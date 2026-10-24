"""
Contract execution — runs a solution against unit-test suites via Piston.

The harness (contract_harness.py) is shipped as the entry-point file with
the solution beside it as `solution.py`; tests and limits go over stdin.
See the harness docstring for why tests never land on the sandbox disk.
"""

import base64
import json
import logging
import re
import secrets
import zlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from flask import current_app

from app.utils import PISTON_RUNTIMES, _clean_error

_HARNESS_SOURCE = (Path(__file__).parent / "contract_harness.py").read_text()

# Module logger, not current_app.logger — _execute also runs in
# verify_contract's worker threads, which have no app context.
logger = logging.getLogger(__name__)

# Fields of a hidden test's result that are safe to show the solver —
# assertion messages and stdout would leak expected values.
_HIDDEN_FIELDS = ("suite", "name", "class", "doc", "status", "duration_ms", "memory_kb")

# A Piston server rejects run_timeout above its PISTON_RUN_TIMEOUT ceiling
# (3000 ms unless configured). Rather than failing every run, learn the
# ceiling from the rejection once per server and stay under it.
_CEILING_RE = re.compile(r"run_timeout cannot exceed the configured limit of (\d+)")
_server_ceiling_ms: dict[str, int] = {}


def _execute(code, suites, time_limit_ms, memory_limit_mb, piston_url, run_timeout_ms):
    token  = secrets.token_hex(16)
    config = {"time_limit_ms": time_limit_ms, "memory_limit_mb": memory_limit_mb, "suites": suites}
    runtime = PISTON_RUNTIMES["python"]
    payload = {
        "language": runtime["language"],
        "version":  runtime["version"],
        "files": [
            {"name": "harness.py",  "content": _HARNESS_SOURCE},
            {"name": "solution.py", "content": code},
        ],
        "stdin":            f"{token}\n{json.dumps(config)}\n",
        "run_timeout":      min(run_timeout_ms, _server_ceiling_ms.get(piston_url, run_timeout_ms)),
        "run_memory_limit": -1,
    }
    url  = piston_url.rstrip("/") + "/api/v2/execute"
    resp = requests.post(url, json=payload, timeout=70)
    ceiling = _CEILING_RE.search(resp.text) if resp.status_code == 400 else None
    if ceiling:
        _server_ceiling_ms[piston_url] = int(ceiling.group(1))
        logger.warning(
            "Piston at %s caps run_timeout at %s ms (CONTRACT_RUN_TIMEOUT_MS is %s) — "
            "raise PISTON_RUN_TIMEOUT on that server to give contracts their full budget",
            piston_url, ceiling.group(1), run_timeout_ms,
        )
        payload["run_timeout"] = _server_ceiling_ms[piston_url]
        resp = requests.post(url, json=payload, timeout=70)
    if not resp.ok:
        raise RuntimeError(f"Piston {resp.status_code}: {resp.text[:400]}")
    return token, resp.json().get("run") or {}, payload["run_timeout"]


def _decode(token, run_stage):
    """Return the harness payload, or None if the run never reported one."""
    lines = [l for l in (run_stage.get("stdout") or "").splitlines() if l.startswith(token)]
    if not lines:
        return None
    try:
        return json.loads(zlib.decompress(base64.b64decode(lines[-1][len(token):])))
    except (ValueError, zlib.error):
        return None


def _summarise(token, run_stage, run_timeout_ms):
    payload = _decode(token, run_stage)

    if payload is None:
        if token in (run_stage.get("stdout") or ""):
            # The report line started but was cut off — Piston kills a run whose
            # stdout passes PISTON_OUTPUT_MAX_SIZE (1024 bytes by default).
            error = (
                "The test report was too large for the execution engine's output limit — "
                "raise PISTON_OUTPUT_MAX_SIZE on the Piston server (65536 recommended)."
            )
            return {"status": "crash", "error": error, "passed": 0, "total": 0, "tests": []}
        if run_stage.get("signal") == "SIGKILL" or run_stage.get("message") == "Time limit exceeded":
            error = (
                f"Run killed after the overall {run_timeout_ms / 1000:g}s budget — either the tests "
                "together take longer than that, or one is stuck in a loop that swallows the "
                "per-test time limit (bare `except:`)."
            )
            return {"status": "timeout", "error": error, "passed": 0, "total": 0, "tests": []}
        stderr = _clean_error(run_stage.get("stderr") or "")
        error  = stderr or f"Process exited (code {run_stage.get('code')}) before reporting results"
        return {"status": "crash", "error": error[-1500:], "passed": 0, "total": 0, "tests": []}

    if payload["status"] == "import_error":
        error = payload["error"]
        if payload.get("suite") == "hidden":
            # Keep only the exception line — the frames would quote hidden test source.
            error = "Hidden tests could not load your solution: " + error.strip().splitlines()[-1]
        return {"status": "import_error", "error": error, "passed": 0, "total": 0, "tests": []}

    tests = [
        t if t["suite"] == "public" else {k: t.get(k) for k in _HIDDEN_FIELDS}
        for t in payload["tests"]
    ]
    return {
        "status": "ok",
        "error":  None,
        "passed": sum(1 for t in tests if t["status"] == "passed"),
        "total":  len(tests),
        "tests":  tests,
    }


def _suites(public_tests, hidden_tests):
    suites = [["public", public_tests]]
    if hidden_tests is not None:
        suites.append(["hidden", hidden_tests])
    return suites


def run_contract(code, contract, include_hidden):
    """
    Run `code` against a contract's public tests (and hidden ones when
    `include_hidden`). Returns:
      {
        status: "ok" | "import_error" | "timeout" | "crash",
        error:  str | None,
        passed: int,
        total:  int,
        tests:  [ {suite, name, class, doc, status, duration_ms, memory_kb, ...}, ... ]
      }
    Public test entries also carry message/stdout/limits; hidden ones don't.
    """
    piston_url     = current_app.config["PISTON_URL"]
    run_timeout_ms = current_app.config["CONTRACT_RUN_TIMEOUT_MS"]
    suites = _suites(contract.public_tests, contract.hidden_tests if include_hidden else None)
    token, run_stage, effective_timeout_ms = _execute(
        code, suites, contract.time_limit_ms, contract.memory_limit_mb, piston_url, run_timeout_ms
    )
    return _summarise(token, run_stage, effective_timeout_ms)


def verify_contract(fields):
    """
    Author-side sanity check before a contract is saved: the example
    solution must pass every test, and the starter code must fail at least
    one (otherwise the contract is free XP). Both run concurrently.

    Unlike run_contract, the reports here keep full detail for hidden tests
    — only admins/moderators ever see them.
    """
    piston_url     = current_app.config["PISTON_URL"]
    run_timeout_ms = current_app.config["CONTRACT_RUN_TIMEOUT_MS"]
    suites = _suites(fields["public_tests"], fields["hidden_tests"])

    def run(code):
        token, run_stage, effective_timeout_ms = _execute(
            code, suites, fields["time_limit_ms"], fields["memory_limit_mb"], piston_url, run_timeout_ms
        )
        payload = _decode(token, run_stage)
        report  = _summarise(token, run_stage, effective_timeout_ms)
        if payload and payload["status"] == "ok":
            report["tests"] = payload["tests"]
        elif payload and payload["status"] == "import_error":
            report["error"] = payload["error"]
        return report

    with ThreadPoolExecutor(max_workers=2) as pool:
        solution_fut = pool.submit(run, fields["example_solution"])
        starter_fut  = pool.submit(run, fields["starter_code"])
        solution, starter = solution_fut.result(), starter_fut.result()

    error = None
    if solution["status"] != "ok":
        error = f"Example solution failed to run: {solution['error']}"
    elif solution["total"] == 0:
        error = "No tests were collected — test methods must start with `test` inside a unittest.TestCase"
    elif solution["passed"] != solution["total"]:
        failing = [t["name"] for t in solution["tests"] if t["status"] != "passed"]
        error = f"Example solution fails {len(failing)} test(s): {', '.join(failing[:5])}"
    elif starter["status"] == "ok" and starter["passed"] == starter["total"]:
        error = "Starter code already passes every test — the contract would be free XP"

    return {"ok": error is None, "error": error, "solution": solution, "starter": starter}
