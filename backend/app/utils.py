import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import wraps

import requests
from flask import current_app, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request

PISTON_RUNTIMES = {
    "python":     {"language": "python",     "version": "*"},
    "javascript": {"language": "javascript", "version": "*"},
    "java":       {"language": "java",       "version": "*"},
    "csharp":     {"language": "csharp",     "version": "*"},
    "cpp":        {"language": "cpp",        "version": "*"},
}

# Piston's java/mono packages compile on the fly as part of the run stage
# (no separate "compile" response key — java 15's single-file source
# execution runs `java Main.java` directly), so JVM/CLR startup latency eats
# into run_timeout, not compile_timeout.
#
# 3000ms can't be raised from our side: each installed Piston package ships
# its own pkg-info.json with a `limit_overrides` entry, and that takes
# priority over the global PISTON_MAX_RUN_TIMEOUT config — Piston's API
# rejects any request whose run_timeout exceeds *that* per-package ceiling
# with a 400, regardless of what the container's env vars allow. Confirmed
# directly: the installed java package's ceiling is exactly 3000ms, so
# there's no config-side way to buy more headroom here — concurrency has to
# be low enough that JVM/CLR startup reliably finishes inside this fixed
# window instead.
# cpp's g++ compiles ahead of run (unlike java/csharp's compile-on-run), so
# it gets its own real "compile" stage in Piston's response — genuinely
# different cost profile from java/csharp, not just copied numbers. These
# starting values mirror java/csharp's conservative defaults but are NOT
# verified against the cpp package's own limit_overrides ceiling (see
# _MAX_PARALLEL_EXECUTIONS below) — that only exists once the package is
# installed, and must be re-tuned empirically the same way java/csharp were.
_COMPILE_TIMEOUT = {"java": 10_000, "csharp": 10_000, "cpp": 10_000}
_RUN_TIMEOUT     = {"java": 3_000, "csharp": 3_000, "cpp": 3_000}
_DEFAULT_RUN     = 3_000

# How many Piston executions run_tests() fires at once for the non-index-0
# test cases. java/csharp need to stay low enough that concurrent JVM/CLR
# startups reliably finish inside the fixed 3000ms ceiling above (see
# _RUN_TIMEOUT) — confirmed empirically that 9-way concurrency on a 4-core
# host got 6/9 SIGKILL'd. python/javascript have no compile/startup cost, so
# they're not subject to the same failure mode and can run with more
# parallelism.
_MAX_PARALLEL_EXECUTIONS = {"java": 2, "csharp": 2, "cpp": 2}
_DEFAULT_PARALLEL_EXECUTIONS = 6


def _clean_error(text: str) -> str:
    if not text:
        return ""
    # Strip Piston sandbox paths — leave only the filename
    text = re.sub(r"(?:/piston/jobs/[^/\s]+)?/box/", "", text)
    # dotnet "Getting ready..." header noise
    text = re.sub(r"^Getting ready\.\.\.\n?", "", text, flags=re.MULTILINE)
    return text.strip()


def _execute(code: str, stdin: str, lang: str, piston_url: str) -> dict:
    runtime = PISTON_RUNTIMES[lang]
    url = piston_url.rstrip("/") + "/api/v2/execute"
    payload = {
        "language":             runtime["language"],
        "version":              runtime["version"],
        "files":                [{"content": code}],
        "stdin":                stdin,
        "run_timeout":          _RUN_TIMEOUT.get(lang, _DEFAULT_RUN),
        "run_memory_limit":     -1,
        "compile_memory_limit": -1,
    }
    if lang in _COMPILE_TIMEOUT:
        payload["compile_timeout"] = _COMPILE_TIMEOUT[lang]
    resp = requests.post(url, json=payload, timeout=70)
    if not resp.ok:
        raise RuntimeError(f"Piston {resp.status_code}: {resp.text[:400]}")
    return resp.json()


def _parse_result(raw: dict, expected_output: str) -> dict:
    compile_stage = raw.get("compile") or {}
    run_stage     = raw.get("run")     or {}

    compile_code = compile_stage.get("code")
    compile_sig  = compile_stage.get("signal")
    if (compile_code is not None and compile_code != 0) or compile_sig:
        error_text = _clean_error(
            compile_stage.get("output") or compile_stage.get("stderr") or ""
        )
        return {
            "passed":     False,
            "actual":     "",
            "error":      error_text or "Compilation failed",
            "error_type": "compile",
        }

    stdout = (run_stage.get("stdout") or "").rstrip("\n")
    stderr = (run_stage.get("stderr") or "").strip()

    if run_stage.get("signal") == "SIGKILL" or run_stage.get("message") == "Time limit exceeded":
        return {"passed": False, "actual": stdout, "error": "Time limit exceeded", "error_type": "timeout"}

    run_code = run_stage.get("code")
    if run_code is not None and run_code != 0:
        return {
            "passed":     False,
            "actual":     stdout,
            "error":      _clean_error(stderr) or f"Runtime error (exit code {run_code})",
            "error_type": "runtime",
        }

    passed = stdout.strip() == expected_output.strip()
    return {"passed": passed, "actual": stdout, "error": None, "error_type": None}


def run_tests(code: str, test_cases: list, lang: str) -> dict:
    """
    Run code against all test cases via Piston.

    Test 0 always runs first — a compile error aborts the rest immediately.
    Tests 1-N run in parallel once test 0 compiles successfully.

    Returns:
      {
        compile_error: str | None,
        zero_test:     {passed, input, expected, actual, error} | None,
        passed:        int,
        total:         int,
        results:       [{index, passed}, ...]   # hidden test details are never included
      }
    """
    sorted_tcs  = sorted(test_cases, key=lambda tc: tc.index)
    zero_tc     = sorted_tcs[0]
    piston_url  = current_app.config["PISTON_URL"]   # resolved here, in the request thread

    zero_raw    = _execute(code, zero_tc.input, lang, piston_url)
    zero_result = _parse_result(zero_raw, zero_tc.output)

    if zero_result["error_type"] == "compile":
        return {
            "compile_error": zero_result["error"],
            "zero_test":     None,
            "passed":        0,
            "total":         len(sorted_tcs),
            "results":       [{"index": tc.index, "passed": False} for tc in sorted_tcs],
        }

    other: dict[int, dict] = {}
    remaining = sorted_tcs[1:]
    if remaining:
        max_parallel = _MAX_PARALLEL_EXECUTIONS.get(lang, _DEFAULT_PARALLEL_EXECUTIONS)
        with ThreadPoolExecutor(max_workers=min(len(remaining), max_parallel)) as pool:
            fut_map = {pool.submit(_execute, code, tc.input, lang, piston_url): tc for tc in remaining}
            for fut in as_completed(fut_map):
                tc = fut_map[fut]
                other[tc.index] = _parse_result(fut.result(), tc.output)

    passed = (1 if zero_result["passed"] else 0) + sum(
        1 for r in other.values() if r["passed"]
    )

    results = [{"index": zero_tc.index, "passed": zero_result["passed"]}] + [
        {"index": i, "passed": other[i]["passed"]}
        for i in sorted(other)
    ]

    return {
        "compile_error": None,
        "zero_test": {
            "passed":   zero_result["passed"],
            "input":    zero_tc.input,
            "expected": zero_tc.output,
            "actual":   zero_result["actual"],
            "error":    zero_result["error"],
        },
        "passed":  passed,
        "total":   len(sorted_tcs),
        "results": results,
    }


def require_role(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            if get_jwt().get("role") not in roles:
                return jsonify({"error": "Forbidden"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
