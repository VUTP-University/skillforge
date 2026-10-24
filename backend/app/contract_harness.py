"""
Python test harness for Contracts — NOT imported by the Flask app.

contract_runner.py reads this file as text and ships it to Piston as the
entry-point file, next to the user's code saved as `solution.py`. Test
sources never touch the sandbox's disk: they arrive over stdin together
with a per-run token, and both are consumed before the user's module is
imported, so solution code can't simply open() the hidden tests or print a
forged result line. The single result line is written to a duplicate of the
original stdout fd, prefixed with the token; everything the user prints is
captured instead.

Authors' test modules can `from contract import limits` to override the
contract-wide time/memory limits on a single test method.
"""

import base64
import io
import json
import linecache
import os
import signal
import sys
import time
import traceback
import tracemalloc
import types
import unittest
import zlib


def _main():
    token  = sys.stdin.readline().strip()
    config = json.loads(sys.stdin.readline())
    sys.stdin = io.StringIO()

    out = os.fdopen(os.dup(1), "w")
    default_time_ms = int(config["time_limit_ms"])
    default_mem_kb  = int(config["memory_limit_mb"]) * 1024

    class TimeLimitExceeded(BaseException):
        # BaseException so a solution's `except Exception:` can't swallow it.
        pass

    def limits(time_ms=None, memory_mb=None):
        def deco(fn):
            fn.__contract_time_ms__   = time_ms
            fn.__contract_memory_mb__ = memory_mb
            return fn
        return deco

    contract_mod = types.ModuleType("contract")
    contract_mod.limits = limits
    sys.modules["contract"] = contract_mod

    def clean_tb(exc_type, exc, tb):
        # Drop harness/unittest frames so the solver only sees their own code and the test.
        frames = [
            f for f in traceback.extract_tb(tb)
            if os.path.basename(f.filename) in ("solution.py", "public_tests.py", "hidden_tests.py")
        ]
        lines = traceback.format_list(frames) + traceback.format_exception_only(exc_type, exc)
        text = "".join(lines).strip()
        return text[-1000:]

    def emit(payload):
        # Compressed because Piston caps each stdio buffer (1 KB by default)
        # and SIGKILLs the run when it's exceeded.
        blob = base64.b64encode(zlib.compress(json.dumps(payload).encode(), 9)).decode()
        out.write(token + blob + "\n")
        out.flush()

    def on_alarm(signum, frame):
        raise TimeLimitExceeded()

    signal.signal(signal.SIGALRM, on_alarm)

    captured = io.StringIO()
    sys.stdout = captured
    sys.stderr = captured

    try:
        import solution  # noqa: F401 — imported for its side effects / names
    except BaseException as exc:  # noqa: BLE001 — any failure importing user code is reported, not raised
        emit({"status": "import_error", "error": clean_tb(type(exc), exc, exc.__traceback__)})
        return

    # Suites are compiled one at a time, right before they run, so hidden
    # test source isn't sitting in memory while public tests execute.
    pending = config.pop("suites")
    del config

    def load_suite(suite_name, source):
        filename = f"{suite_name}_tests.py"
        module = types.ModuleType(f"{suite_name}_tests")
        module.__file__ = filename
        if suite_name == "public":
            # Lets tracebacks quote public test lines; hidden ones stay unquoted.
            linecache.cache[filename] = (len(source), None, source.splitlines(True), filename)
        try:
            exec(compile(source, filename, "exec"), module.__dict__)  # noqa: S102 — runs author-written tests inside the sandbox
        except BaseException as exc:  # noqa: BLE001 — e.g. ImportError when solution lacks a required name
            emit({"status": "import_error", "suite": suite_name,
                  "error": clean_tb(type(exc), exc, exc.__traceback__)})
            return None
        return unittest.defaultTestLoader.loadTestsFromModule(module)

    def iter_tests(suite):
        for item in suite:
            if isinstance(item, unittest.TestSuite):
                yield from iter_tests(item)
            else:
                yield item

    class Result(unittest.TestResult):
        def __init__(self):
            super().__init__()
            self.outcome = None

        def addError(self, test, err):
            self.outcome = err

        def addFailure(self, test, err):
            self.outcome = err

        def addSkip(self, test, reason):
            self.outcome = ("skip", reason)

    results = []
    tracemalloc.start()
    while pending:
        suite_name, source = pending.pop(0)
        suite = load_suite(suite_name, source)
        del source
        if suite is None:
            return
        for test in iter_tests(suite):
            method  = getattr(test, test._testMethodName, None)
            time_ms = getattr(method, "__contract_time_ms__", None) or default_time_ms
            mem_mb  = getattr(method, "__contract_memory_mb__", None)
            mem_kb  = mem_mb * 1024 if mem_mb else default_mem_kb

            captured.seek(0)
            captured.truncate()
            result = Result()
            tracemalloc.reset_peak()
            mem_base = tracemalloc.get_traced_memory()[0]
            signal.setitimer(signal.ITIMER_REAL, time_ms / 1000)
            started = time.perf_counter()
            try:
                test.run(result)
            except TimeLimitExceeded:
                result.outcome = (TimeLimitExceeded, TimeLimitExceeded(), None)
            finally:
                signal.setitimer(signal.ITIMER_REAL, 0)
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            peak_kb = max(0, tracemalloc.get_traced_memory()[1] - mem_base) // 1024

            entry = {
                "suite":       suite_name,
                "name":        test._testMethodName,
                "class":       type(test).__name__,
                "doc":         (method.__doc__ or "").strip().splitlines()[0] if method and method.__doc__ else None,
                "duration_ms": duration_ms,
                "memory_kb":   peak_kb,
                "time_limit_ms":   time_ms,
                "memory_limit_kb": mem_kb,
                "stdout":      captured.getvalue()[-1000:],
            }
            outcome = result.outcome
            if outcome is None and peak_kb > mem_kb:
                entry.update(status="memory", message=f"Memory limit exceeded: peak {peak_kb} KB > {mem_kb} KB")
            elif outcome is None:
                entry.update(status="passed", message=None)
            elif outcome[0] == "skip":
                entry.update(status="skipped", message=str(outcome[1]))
            elif outcome[0] is TimeLimitExceeded:
                entry.update(status="timeout", message=f"Time limit exceeded ({time_ms} ms)")
            elif issubclass(outcome[0], MemoryError):
                entry.update(status="memory", message="MemoryError raised")
            elif issubclass(outcome[0], AssertionError):
                entry.update(status="failed", message=clean_tb(*outcome))
            else:
                entry.update(status="error", message=clean_tb(*outcome))
            results.append(entry)
    tracemalloc.stop()

    emit({"status": "ok", "tests": results})


_main()
