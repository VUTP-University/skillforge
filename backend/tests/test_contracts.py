import base64
import json
import os
import zlib

import pytest
import requests
from app import create_app, db
from app.config import Config
from app.contract_runner import _summarise
from app.models import RoleName, User, UserRole
from flask_jwt_extended import create_access_token

PISTON_URL = os.environ.get("TEST_PISTON_URL", "http://localhost:2000")


def _piston_up():
    try:
        return requests.get(f"{PISTON_URL}/api/v2/runtimes", timeout=2).ok
    except requests.RequestException:
        return False


needs_piston = pytest.mark.skipif(not _piston_up(), reason=f"Piston not reachable at {PISTON_URL}")


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    PISTON_URL = PISTON_URL
    RATELIMIT_ENABLED = False


STARTER = '''
class BST:
    def insert(self, value):
        raise NotImplementedError

    def inorder(self):
        raise NotImplementedError
'''

SOLUTION = '''
class _Node:
    def __init__(self, value):
        self.value, self.left, self.right = value, None, None


class BST:
    def __init__(self):
        self.root = None

    def insert(self, value):
        if self.root is None:
            self.root = _Node(value)
            return
        node = self.root
        while True:
            side = "left" if value < node.value else "right"
            child = getattr(node, side)
            if child is None:
                setattr(node, side, _Node(value))
                return
            node = child

    def inorder(self):
        out, stack, node = [], [], self.root
        while stack or node:
            while node:
                stack.append(node)
                node = node.left
            node = stack.pop()
            out.append(node.value)
            node = node.right
        return out
'''

PUBLIC_TESTS = '''
import unittest
from solution import BST


class TestBST(unittest.TestCase):
    def test_has_methods(self):
        """BST exposes insert() and inorder()"""
        self.assertTrue(callable(getattr(BST, "insert", None)))
        self.assertTrue(callable(getattr(BST, "inorder", None)))

    def test_inorder_sorted(self):
        tree = BST()
        for v in [5, 3, 8, 1]:
            tree.insert(v)
        self.assertEqual(tree.inorder(), [1, 3, 5, 8])
'''

HIDDEN_TESTS = '''
import random
import unittest
from contract import limits
from solution import BST


class TestBSTHidden(unittest.TestCase):
    def test_duplicates(self):
        tree = BST()
        for v in [2, 2, 1]:
            tree.insert(v)
        self.assertEqual(tree.inorder(), [1, 2, 2])

    @limits(time_ms=2000)
    def test_large_sorted_input(self):
        """deep (degenerate) trees don't hit the recursion limit"""
        tree = BST()
        for v in range(3000):
            tree.insert(v)
        self.assertEqual(tree.inorder(), list(range(3000)))
'''

RECURSIVE_SOLUTION = SOLUTION.replace('''    def inorder(self):
        out, stack, node = [], [], self.root
        while stack or node:
            while node:
                stack.append(node)
                node = node.left
            node = stack.pop()
            out.append(node.value)
            node = node.right
        return out
''', '''    def inorder(self):
        out = []
        def go(n):
            if n:
                go(n.left); out.append(n.value); go(n.right)
        go(self.root)
        return out
''')


def _payload(**overrides):
    data = {
        "title":            "Binary Search Tree",
        "description":      "Implement `BST` with `insert` and `inorder`.",
        "topic":            "BST",
        "language":         "python",
        "difficulty":       "mid",
        "starter_code":     STARTER,
        "example_solution": SOLUTION,
        "public_tests":     PUBLIC_TESTS,
        "hidden_tests":     HIDDEN_TESTS,
        "time_limit_ms":    1000,
        "memory_limit_mb":  64,
    }
    data.update(overrides)
    return data


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def _client_for(app, username, role):
    user = User(username=username, email=f"{username}@example.com", password_hash="x")
    db.session.add(user)
    db.session.flush()
    db.session.add(UserRole(user_id=user.id, role=role))
    db.session.commit()
    client = app.test_client()
    token = create_access_token(identity=str(user.id), additional_claims={"role": role.value})
    client.set_cookie("access_token_cookie", token, path="/api")
    return client, user


# ── Pure result parsing (no Piston) ──────────────────────────────────────────

def _run_stage(token, payload, **extra):
    blob = base64.b64encode(zlib.compress(json.dumps(payload).encode())).decode()
    return {"stdout": f"forged-line\n{token}{blob}\n", "stderr": "", "code": 0, **extra}


def test_summarise_strips_hidden_test_details():
    payload = {"status": "ok", "tests": [
        {"suite": "public", "name": "test_a", "status": "failed", "message": "boom", "stdout": "dbg",
         "duration_ms": 1, "memory_kb": 1},
        {"suite": "hidden", "name": "test_b", "status": "failed", "message": "expected 42", "stdout": "dbg",
         "duration_ms": 1, "memory_kb": 1},
    ]}
    result = _summarise("tok", _run_stage("tok", payload), 10000)
    assert result["status"] == "ok"
    assert (result["passed"], result["total"]) == (0, 2)
    public, hidden = result["tests"]
    assert public["message"] == "boom"
    assert "message" not in hidden and "stdout" not in hidden


def test_summarise_hides_hidden_suite_traceback():
    payload = {"status": "import_error", "suite": "hidden",
               "error": 'File "hidden_tests.py", line 3\nImportError: cannot import name \'delete\''}
    result = _summarise("tok", _run_stage("tok", payload), 10000)
    assert result["status"] == "import_error"
    assert "hidden_tests.py" not in result["error"]
    assert "cannot import name 'delete'" in result["error"]


def test_summarise_ignores_lines_without_token():
    result = _summarise("tok", {"stdout": "nottok123\n", "stderr": "", "code": 0}, 10000)
    assert result["status"] == "crash"


def test_summarise_reports_overall_timeout():
    result = _summarise("tok", {"stdout": "", "stderr": "", "code": None, "signal": "SIGKILL"}, 10000)
    assert result["status"] == "timeout"


def test_create_rejects_unsupported_language(app):
    client, _ = _client_for(app, "admin", RoleName.admin)
    resp = client.post("/api/contracts/", json=_payload(language="java"))
    assert resp.status_code == 400


def test_regular_user_cannot_create(app):
    client, _ = _client_for(app, "user", RoleName.user)
    resp = client.post("/api/contracts/", json=_payload())
    assert resp.status_code == 403


# ── End to end through Piston ────────────────────────────────────────────────

@needs_piston
def test_contract_lifecycle(app):
    admin, _ = _client_for(app, "admin", RoleName.admin)
    resp = admin.post("/api/contracts/", json=_payload())
    assert resp.status_code == 201, resp.get_json()
    contract = resp.get_json()
    assert contract["xp_reward"] == 120
    assert contract["verification"]["solution"]["passed"] == 4

    player, user = _client_for(app, "player", RoleName.user)
    seen = player.get(f"/api/contracts/{contract['id']}").get_json()
    assert "hidden_tests" not in seen and "example_solution" not in seen

    run = player.post(f"/api/contracts/{contract['id']}/run", json={"code": STARTER}).get_json()
    assert run["status"] == "ok"
    assert {t["suite"] for t in run["tests"]} == {"public"}
    assert run["passed"] == 1  # the structure check passes; behaviour doesn't

    # Recursive inorder passes the public tests but blows the recursion limit on the hidden one.
    sub = player.post(f"/api/contracts/{contract['id']}/submit", json={"code": RECURSIVE_SOLUTION}).get_json()
    assert (sub["passed"], sub["total"]) == (3, 4)
    failing = [t for t in sub["tests"] if t["status"] != "passed"]
    assert [t["name"] for t in failing] == ["test_large_sorted_input"]
    assert "message" not in failing[0]
    assert sub["xp_earned"] == 0

    sub = player.post(f"/api/contracts/{contract['id']}/submit", json={"code": SOLUTION}).get_json()
    assert sub["passed"] == sub["total"] == 4
    assert sub["first_completion"] is True and sub["xp_earned"] == 120
    db.session.refresh(user)
    assert user.total_xp == 120

    again = player.post(f"/api/contracts/{contract['id']}/submit", json={"code": SOLUTION}).get_json()
    assert again["first_completion"] is False and again["xp_earned"] == 0

    listing = player.get("/api/contracts/").get_json()
    assert listing["items"][0]["solved"] is True


@needs_piston
def test_create_rejects_broken_example_solution(app):
    admin, _ = _client_for(app, "admin", RoleName.admin)
    resp = admin.post("/api/contracts/", json=_payload(example_solution=STARTER))
    assert resp.status_code == 422
    assert "Example solution fails" in resp.get_json()["error"]


@needs_piston
def test_create_rejects_starter_that_already_passes(app):
    admin, _ = _client_for(app, "admin", RoleName.admin)
    resp = admin.post("/api/contracts/", json=_payload(starter_code=SOLUTION))
    assert resp.status_code == 422
    assert "free XP" in resp.get_json()["error"]


@needs_piston
def test_harness_limits_and_isolation(app):
    admin, _ = _client_for(app, "admin", RoleName.admin)
    contract = admin.post("/api/contracts/", json=_payload()).get_json()
    player, _ = _client_for(app, "player", RoleName.user)

    def run(code):
        return player.post(f"/api/contracts/{contract['id']}/run", json={"code": code}).get_json()

    looping = SOLUTION.replace("    def inorder(self):", "    def inorder(self):\n        while True:\n            pass\n    def _old(self):")
    statuses = {t["name"]: t["status"] for t in run(looping)["tests"]}
    assert statuses["test_inorder_sorted"] == "timeout"

    hungry = SOLUTION.replace("        return out", "        self.waste = [0] * 20_000_000\n        return out")
    statuses = {t["name"]: t["status"] for t in run(hungry)["tests"]}
    assert statuses["test_inorder_sorted"] == "memory"

    # Neither the hidden test file nor its source is reachable from solution code.
    snoop = SOLUTION + (
        "\nimport os, sys\n"
        "assert sys.stdin.read() == ''\n"
        "assert not any('hidden' in f for f in os.listdir('.'))\n"
    )
    result = run(snoop)
    assert result["status"] == "ok", result

    assert run("def broken(:\n")["status"] == "import_error"


# ── AI Assistant (OpenAI mocked) ─────────────────────────────────────────────

class _FakeOpenAI:
    def __init__(self, content):
        message = type("Msg", (), {"content": content})
        choice  = type("Choice", (), {"message": message, "finish_reason": "stop"})
        self.chat = type("Chat", (), {"completions": self})()
        self._response = type("Resp", (), {"choices": [choice]})
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        return self._response


def _mock_ai(monkeypatch, payload):
    fake = _FakeOpenAI(json.dumps(payload))
    monkeypatch.setattr("app.routes.jobs._get_openai_client", lambda: fake)
    return fake


def test_ai_generate_is_admin_only(app):
    client, _ = _client_for(app, "mod", RoleName.moderator)
    assert client.post("/api/contracts/ai-generate", json={"difficulty": "mid"}).status_code == 403


def test_ai_generate_rejects_invalid_payload(app, monkeypatch):
    _mock_ai(monkeypatch, {"title": "No tests"})
    client, _ = _client_for(app, "admin", RoleName.admin)
    resp = client.post("/api/contracts/ai-generate", json={"difficulty": "mid"})
    assert resp.status_code == 502


@needs_piston
def test_ai_generate_returns_verified_draft(app, monkeypatch):
    fake = _mock_ai(monkeypatch, {
        "title": "Binary Search Tree", "topic": "Trees", "description": "Implement BST.",
        "starter_code": STARTER, "example_solution": SOLUTION,
        "public_tests": PUBLIC_TESTS, "hidden_tests": HIDDEN_TESTS,
        "time_limit_ms": 99999, "memory_limit_mb": "64",
    })
    client, _ = _client_for(app, "admin", RoleName.admin)
    resp = client.post("/api/contracts/ai-generate", json={"difficulty": "senior", "description": "rate limiter"})
    assert resp.status_code == 200, resp.get_json()
    draft = resp.get_json()
    assert draft["time_limit_ms"] == 5000          # clamped into range
    assert draft["memory_limit_mb"] == 64
    assert draft["verification"]["ok"] is True
    assert "rate limiter" in fake.calls[0]["messages"][1]["content"]
    assert fake.calls[0]["model"] == "gpt-6-luna"
    assert fake.calls[0]["reasoning_effort"] == "high"
    assert "max_tokens" not in fake.calls[0]
    # Generation only drafts — nothing is saved until the admin publishes.
    assert client.get("/api/contracts/").get_json()["total"] == 0


# ── Piston server limits ─────────────────────────────────────────────────────

class _FakeResp:
    def __init__(self, status, body):
        self.status_code, self.ok, self._body = status, 200 <= status < 300, body
        self.text = json.dumps(body)

    def json(self):
        return self._body


def test_execute_learns_server_timeout_ceiling(app, monkeypatch):
    from app import contract_runner

    sent = []

    def fake_post(url, json, timeout):
        sent.append(json["run_timeout"])
        if json["run_timeout"] > 3000:
            return _FakeResp(400, {"message": "run_timeout cannot exceed the configured limit of 3000"})
        return _FakeResp(200, {"run": {"stdout": "", "stderr": "", "code": 0}})

    monkeypatch.setattr(contract_runner.requests, "post", fake_post)
    monkeypatch.setattr(contract_runner, "_server_ceiling_ms", {})
    _, _, effective = contract_runner._execute("x = 1", [], 1000, 64, "http://piston.test", 10000)
    assert effective == 3000
    assert sent == [10000, 3000]

    # Remembered: the next run goes straight to the ceiling.
    contract_runner._execute("x = 1", [], 1000, 64, "http://piston.test", 10000)
    assert sent == [10000, 3000, 3000]


def test_summarise_reports_truncated_output():
    run_stage = {"stdout": "tokeJx9truncated", "stderr": "", "code": None, "signal": "SIGKILL"}
    result = _summarise("tok", run_stage, 3000)
    assert result["status"] == "crash"
    assert "PISTON_OUTPUT_MAX_SIZE" in result["error"]


# ── Harness fixtures & measurement ───────────────────────────────────────────

FIND_SOLUTION = '''
import bisect

def find(values, target):
    data = sorted(values)
    i = bisect.bisect_left(data, target)
    return i if i < len(data) and data[i] == target else -1
'''

FIND_STARTER = "def find(values, target):\n    raise NotImplementedError\n"

FIND_PUBLIC = '''
import unittest
from solution import find


class TestFind(unittest.TestCase):
    def test_duplicates(self):
        self.assertEqual(find([4, 2, 4, 3, 1], 4), 3)  # sorted: [1, 2, 3, 4, 4]
'''

# Mirrors a real contract that hit TLE: a large input built inside a 1000 ms
# test. Under the old tracemalloc meter, building 500k ints alone took ~1.1 s.
FIND_HIDDEN = '''
import bisect
import random
import unittest
from solution import find


class TestFindLarge(unittest.TestCase):
    def test_find_in_large_list(self):
        rng = random.Random(42)
        values = [rng.randint(0, 10**6) for _ in range(500_000)]
        target = values[12_345]
        self.assertEqual(find(values, target), bisect.bisect_left(sorted(values), target))


class TestWithClassFixture(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rng = random.Random(7)
        cls.values = [rng.randint(0, 10**6) for _ in range(500_000)]

    def test_uses_class_fixture(self):
        """input built once in setUpClass, outside the per-test limits"""
        target = self.values[0]
        self.assertEqual(find(self.values, target), bisect.bisect_left(sorted(self.values), target))
'''


@needs_piston
def test_large_inputs_fit_time_limit_and_class_fixtures_run(app):
    admin, _ = _client_for(app, "admin", RoleName.admin)
    resp = admin.post("/api/contracts/verify", json=_payload(
        starter_code=FIND_STARTER, example_solution=FIND_SOLUTION,
        public_tests=FIND_PUBLIC, hidden_tests=FIND_HIDDEN, time_limit_ms=1000, memory_limit_mb=128,
    ))
    report = resp.get_json()
    assert report["ok"], report
    tests = {t["name"]: t for t in report["solution"]["tests"]}
    assert tests["test_uses_class_fixture"]["duration_ms"] < tests["test_find_in_large_list"]["duration_ms"]
    assert tests["test_find_in_large_list"]["memory_kb"] > 1024  # RSS growth is actually measured


@needs_piston
def test_setup_class_failure_is_reported_per_test(app):
    admin, _ = _client_for(app, "admin", RoleName.admin)
    broken = FIND_PUBLIC.replace(
        "class TestFind(unittest.TestCase):\n",
        "class TestFind(unittest.TestCase):\n    @classmethod\n    def setUpClass(cls):\n        raise RuntimeError('boom')\n\n",
    )
    report = admin.post("/api/contracts/verify", json=_payload(
        starter_code=FIND_STARTER, example_solution=FIND_SOLUTION,
        public_tests=broken, hidden_tests=FIND_HIDDEN,
    )).get_json()
    public = [t for t in report["solution"]["tests"] if t["suite"] == "public"]
    assert [t["status"] for t in public] == ["error"]
    assert "setUpClass failed" in public[0]["message"] and "boom" in public[0]["message"]


# ── Description markdown ─────────────────────────────────────────────────────

def test_save_rejects_unclosed_code_fence(app):
    client, _ = _client_for(app, "admin", RoleName.admin)
    resp = client.post("/api/contracts/", json=_payload(description="## API\n```python\nclass BST: ...\n"))
    assert resp.status_code == 400
    assert "never closed" in resp.get_json()["error"]


def test_close_fences_repairs_ai_style_triple_quote_close():
    from app.routes.contracts import _close_fences, _unclosed_fence
    broken = '## API\n\n```python\nclass A:\n    pass\n"""\n\n### Rules and Constraints\n- one\n'
    fixed = _close_fences(broken)
    assert not _unclosed_fence(fixed)
    assert '"""' not in fixed
    assert fixed.index("```\n") < fixed.index("### Rules")
