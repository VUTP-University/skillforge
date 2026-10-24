import json
from datetime import UTC, datetime

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app import db
from app.achievements import award_xp, check_achievements
from app.contract_runner import run_contract, verify_contract
from app.models import (
    CONTRACT_DEFAULT_MEMORY_LIMIT_MB,
    CONTRACT_DEFAULT_TIME_LIMIT_MS,
    CONTRACT_LANGUAGES,
    XP_BY_CONTRACT_DIFFICULTY,
    AchievementCategory,
    Contract,
    ContractComment,
    ContractCompletion,
    ContractSubmission,
    JobDifficulty,
    Language,
    User,
)
from app.routes.jobs import _caller_id, _caller_role, _get_openai_client
from app.utils import require_role

contracts_bp = Blueprint("contracts", __name__)

CONTRACT_SORTS = ("newest", "xp_desc", "xp_asc")

MAX_CODE_LENGTH = 50_000
TIME_LIMIT_RANGE_MS   = (50, 5000)
MEMORY_LIMIT_RANGE_MB = (8, 512)

# Large text fields left out of list responses — the solve page fetches them.
_LIST_OMIT = ("description", "starter_code", "public_tests")


def _validate(data):
    """Return an error string, or None if data is valid."""
    if not (data.get("title") or "").strip():
        return "Title is required"
    if not (data.get("description") or "").strip():
        return "Description is required"
    if data.get("language") not in CONTRACT_LANGUAGES:
        return f"Contracts currently support: {', '.join(CONTRACT_LANGUAGES)}"
    if data.get("difficulty") not in [d.value for d in JobDifficulty]:
        return f"Invalid difficulty '{data.get('difficulty')}'"
    if len((data.get("topic") or "").strip()) > 60:
        return "Topic must be 60 characters or fewer"

    for field, label in (
        ("starter_code", "Starter code"),
        ("example_solution", "Example solution"),
        ("public_tests", "Public tests"),
        ("hidden_tests", "Hidden tests"),
    ):
        value = data.get(field) or ""
        if not value.strip():
            return f"{label} is required"
        if len(value) > MAX_CODE_LENGTH:
            return f"{label} must be {MAX_CODE_LENGTH} characters or fewer"

    for field, (lo, hi), unit in (
        ("time_limit_ms",   TIME_LIMIT_RANGE_MS,   "ms"),
        ("memory_limit_mb", MEMORY_LIMIT_RANGE_MB, "MB"),
    ):
        value = data.get(field)
        if not isinstance(value, int) or isinstance(value, bool) or not (lo <= value <= hi):
            return f"{field} must be an integer between {lo} and {hi} {unit}"
    return None


def _fields(data):
    """Normalise a validated payload into Contract column values."""
    diff = JobDifficulty(data["difficulty"])
    return {
        "title":            data["title"].strip(),
        "description":      data["description"].strip(),
        "topic":            (data.get("topic") or "").strip() or None,
        "language":         Language(data["language"]),
        "difficulty":       diff,
        "xp_reward":        XP_BY_CONTRACT_DIFFICULTY[diff],
        "starter_code":     data["starter_code"].rstrip() + "\n",
        "example_solution": data["example_solution"].rstrip() + "\n",
        "public_tests":     data["public_tests"].rstrip() + "\n",
        "hidden_tests":     data["hidden_tests"].rstrip() + "\n",
        "time_limit_ms":    data["time_limit_ms"],
        "memory_limit_mb":  data["memory_limit_mb"],
    }


def _parse_payload():
    """Return (fields, error_response). Fills in default limits when omitted."""
    data = request.get_json(silent=True) or {}
    data.setdefault("language", "python")
    data.setdefault("time_limit_ms", CONTRACT_DEFAULT_TIME_LIMIT_MS)
    data.setdefault("memory_limit_mb", CONTRACT_DEFAULT_MEMORY_LIMIT_MB)
    err = _validate(data)
    if err:
        return None, (jsonify({"error": err}), 400)
    return _fields(data), None


def _verify_or_error(fields):
    """Run verify_contract; return (report, error_response)."""
    try:
        report = verify_contract(fields)
    except Exception as exc:  # noqa: BLE001 — sandbox/runtime failure must fall back to a graceful error
        current_app.logger.error("Contract verification failed: %s", exc)
        return None, (jsonify({"error": f"Execution engine error: {exc}"}), 503)
    if not report["ok"]:
        return report, (jsonify({"error": report["error"], "verification": report}), 422)
    return report, None


# ── List ─────────────────────────────────────────────────────────────────────

@contracts_bp.route("/", methods=["GET"])
def list_contracts():
    diff     = request.args.get("difficulty")
    topic    = (request.args.get("topic") or "").strip()
    search   = (request.args.get("search") or "").strip()
    sort     = request.args.get("sort", "newest")
    unsolved = (request.args.get("unsolved") or "").lower() in ("true", "1")
    page     = max(1, request.args.get("page", 1, type=int))
    per_page = min(50, max(5, request.args.get("per_page", 20, type=int)))

    if sort not in CONTRACT_SORTS:
        sort = "newest"

    user_id = _caller_id()

    q = Contract.query
    if diff:
        try:
            q = q.filter(Contract.difficulty == JobDifficulty(diff))
        except ValueError:
            pass
    if topic:
        q = q.filter(Contract.topic.ilike(topic))
    if search:
        like = f"%{search}%"
        q = q.outerjoin(User, Contract.author_id == User.id).filter(
            db.or_(Contract.title.ilike(like), Contract.topic.ilike(like), User.username.ilike(like))
        )
    if unsolved and user_id:
        completed_ids = db.session.query(ContractCompletion.contract_id).filter(
            ContractCompletion.user_id == user_id
        )
        q = q.filter(~Contract.id.in_(completed_ids))

    if sort == "xp_desc":
        q = q.order_by(Contract.xp_reward.desc(), Contract.created_at.desc())
    elif sort == "xp_asc":
        q = q.order_by(Contract.xp_reward.asc(), Contract.created_at.desc())
    else:
        q = q.order_by(Contract.created_at.desc())

    total     = q.count()
    contracts = q.offset((page - 1) * per_page).limit(per_page).all()
    pages     = max(1, (total + per_page - 1) // per_page)

    completed_ids = set()
    if user_id and contracts:
        completed_ids = {
            row.contract_id for row in ContractCompletion.query.filter(
                ContractCompletion.user_id == user_id,
                ContractCompletion.contract_id.in_([c.id for c in contracts]),
            )
        }

    items = []
    for contract in contracts:
        d = contract.to_dict()
        for key in _LIST_OMIT:
            d.pop(key)
        d["solved"] = contract.id in completed_ids
        items.append(d)

    return jsonify({
        "items":    items,
        "total":    total,
        "page":     page,
        "pages":    pages,
        "per_page": per_page,
    })


@contracts_bp.route("/topics", methods=["GET"])
def list_topics():
    rows = (
        db.session.query(Contract.topic)
        .filter(Contract.topic.isnot(None))
        .distinct()
        .order_by(Contract.topic)
        .all()
    )
    return jsonify([topic for (topic,) in rows])


# ── Single ────────────────────────────────────────────────────────────────────

@contracts_bp.route("/<int:contract_id>", methods=["GET"])
def get_contract(contract_id):
    contract = db.get_or_404(Contract, contract_id)
    include_sol = _caller_role() in ("admin", "moderator")
    data = contract.to_dict(include_solution=include_sol)
    user_id = _caller_id()
    data["solved"] = bool(
        user_id and ContractCompletion.query.filter_by(user_id=user_id, contract_id=contract_id).first()
    )
    return jsonify(data)


# ── Verify / Create / Update ──────────────────────────────────────────────────

@contracts_bp.route("/verify", methods=["POST"])
@require_role("admin", "moderator")
def verify():
    """Dry-run a contract draft without saving it — powers the form's Verify button."""
    fields, err = _parse_payload()
    if err:
        return err
    try:
        return jsonify(verify_contract(fields))
    except Exception as exc:  # noqa: BLE001 — sandbox/runtime failure must fall back to a graceful error
        current_app.logger.error("Contract verification failed: %s", exc)
        return jsonify({"error": f"Execution engine error: {exc}"}), 503


@contracts_bp.route("/", methods=["POST"])
@require_role("admin", "moderator")
def create_contract():
    fields, err = _parse_payload()
    if err:
        return err
    report, err = _verify_or_error(fields)
    if err:
        return err

    contract = Contract(**fields, author_id=int(get_jwt_identity()))
    db.session.add(contract)
    db.session.commit()
    data = contract.to_dict(include_solution=True)
    data["verification"] = report
    return jsonify(data), 201


@contracts_bp.route("/<int:contract_id>", methods=["PUT"])
@require_role("admin", "moderator")
def update_contract(contract_id):
    contract = db.get_or_404(Contract, contract_id)
    fields, err = _parse_payload()
    if err:
        return err
    report, err = _verify_or_error(fields)
    if err:
        return err

    for key, value in fields.items():
        setattr(contract, key, value)
    contract.updated_at = datetime.now(UTC)
    db.session.commit()
    data = contract.to_dict(include_solution=True)
    data["verification"] = report
    return jsonify(data)


@contracts_bp.route("/<int:contract_id>", methods=["DELETE"])
@require_role("admin")
def delete_contract(contract_id):
    contract = db.get_or_404(Contract, contract_id)
    db.session.delete(contract)
    db.session.commit()
    return jsonify({"message": "Contract deleted"}), 200


# ── AI Assistant ─────────────────────────────────────────────────────────────

_AI_DIFFICULTY_HINTS = {
    "junior": "a single class or a few functions with clear rules and a handful of edge cases",
    "mid":    "several cooperating methods with real state management, error handling and non-trivial edge cases",
    "senior": "a substantial design (multiple classes or an algorithm with a complexity requirement) where "
              "naive solutions fail the hidden performance tests",
}


def _ai_contract_system_prompt(difficulty):
    return (
        "You are an expert exercise author for SkillForge, a developer training platform. "
        f"Write one original, {difficulty}-level Python **Contract**: an exercise graded by `unittest` "
        "suites instead of stdin/stdout. The solver implements an API (classes, methods, functions) "
        "that the tests import and exercise directly.\n"
        f"Scope for this difficulty: {_AI_DIFFICULTY_HINTS[difficulty]}.\n"
        "Contracts are NOT limited to textbook data structures. Good contracts include things like: an LRU or "
        "TTL cache, a rate limiter, a bank ledger with transactions and overdraft rules, an event bus, an "
        "inventory or booking system, a tokenizer or expression evaluator, a text-diff or template engine, "
        "matrix/vector classes, a state machine, a scheduler with priorities, graph/tree algorithms, "
        "interval merging, a trie-based autocomplete, a JSON-path query helper — anything where behaviour, "
        "structure and edge cases matter. Avoid problems that are just 'read input, print output'.\n"
        "Return ONLY valid JSON with exactly these keys:\n"
        '{"title": "...", "topic": "...(1-3 words, e.g. Caching, Graphs, Parsing, OOP Design)", '
        '"description": "...", "starter_code": "...", "example_solution": "...", '
        '"public_tests": "...", "hidden_tests": "...", "time_limit_ms": 1000, "memory_limit_mb": 64}\n'
        "Rules:\n"
        "- description: Markdown. Context, then an exact API section listing every class/method/function "
        "signature the tests use (names, parameters, return types, exceptions raised), then rules and "
        "constraints. The solver never sees the tests' assertions beyond the public ones, so the spec must be "
        "complete.\n"
        "- starter_code: the module skeleton (solution.py) with every required signature and docstring, bodies "
        "`raise NotImplementedError`. No solution logic.\n"
        "- example_solution: a complete, correct solution.py that passes every public and hidden test.\n"
        "- public_tests and hidden_tests: full Python modules using `import unittest` and "
        "`from solution import ...`, each with one or more unittest.TestCase classes and test methods named "
        "test_*. Give every test method a one-line docstring describing the behaviour it checks.\n"
        "- public_tests: 3-5 tests covering the basic API and the main behaviour, including at least one test "
        "that checks the required structure (classes/methods exist and are callable).\n"
        "- hidden_tests: 5-8 tests covering edge cases, error handling (assertRaises), invariants and at least "
        "one performance test on a large input. For per-test limits use `from contract import limits` and "
        "decorate with `@limits(time_ms=..., memory_mb=...)`. Leave generous headroom: the reference solution "
        "should use under a third of any limit. Note the memory limit counts the test's own data too.\n"
        "- Tests must be deterministic: seed any randomness (random.Random(42)), never depend on wall-clock "
        "time, network, files or printing.\n"
        "- time_limit_ms (50-5000) and memory_limit_mb (8-512) are the defaults applied to every test.\n"
        "- Use only the Python 3.12 standard library.\n"
        "- Do not include any commentary outside the JSON object."
    )


@contracts_bp.route("/ai-generate", methods=["POST"])
@require_role("admin")
def ai_generate_contract():
    data = request.get_json(silent=True) or {}
    difficulty = (data.get("difficulty") or "").strip().lower()
    hint       = (data.get("description") or "").strip()

    if difficulty not in [d.value for d in JobDifficulty]:
        return jsonify({"error": f"Invalid difficulty '{difficulty}'"}), 400

    user_prompt = (
        f"Topic/theme hint from the admin: {hint}" if hint
        else "No specific topic given — invent an original, interesting contract appropriate for the difficulty."
    )
    try:
        client   = _get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            max_tokens=8000,
            messages=[
                {"role": "system", "content": _ai_contract_system_prompt(difficulty)},
                {"role": "user",   "content": user_prompt},
            ],
        )
        payload = json.loads(response.choices[0].message.content)
    except Exception as exc:  # noqa: BLE001 — any OpenAI/SDK failure must fall back to a graceful error
        current_app.logger.error("AI contract generation failed: %s", exc)
        return jsonify({"error": "Failed to generate contract — the AI Assistant is momentarily unreachable"}), 502

    def as_int(value, default):
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    generated = {
        "title":            str(payload.get("title") or "").strip()[:200],
        "topic":            str(payload.get("topic") or "").strip()[:60],
        "description":      str(payload.get("description") or "").strip(),
        "language":         "python",
        "difficulty":       difficulty,
        "starter_code":     str(payload.get("starter_code") or ""),
        "example_solution": str(payload.get("example_solution") or ""),
        "public_tests":     str(payload.get("public_tests") or ""),
        "hidden_tests":     str(payload.get("hidden_tests") or ""),
        "time_limit_ms":    min(max(as_int(payload.get("time_limit_ms"), CONTRACT_DEFAULT_TIME_LIMIT_MS),
                                    TIME_LIMIT_RANGE_MS[0]), TIME_LIMIT_RANGE_MS[1]),
        "memory_limit_mb":  min(max(as_int(payload.get("memory_limit_mb"), CONTRACT_DEFAULT_MEMORY_LIMIT_MB),
                                    MEMORY_LIMIT_RANGE_MB[0]), MEMORY_LIMIT_RANGE_MB[1]),
    }

    err = _validate(generated)
    if err:
        current_app.logger.error("AI contract generation produced an invalid payload: %s", err)
        return jsonify({"error": "The AI Assistant produced an invalid contract — please try again"}), 502

    # Same check a save runs — the form shows the report so the admin can fix what the model got wrong.
    try:
        generated["verification"] = verify_contract(_fields(generated))
    except Exception as exc:  # noqa: BLE001 — sandbox/runtime failure must not crash generation
        current_app.logger.error("AI contract verification failed: %s", exc)
        generated["verification"] = None

    return jsonify(generated), 200


# ── Run (public tests) / Submit (all tests) ───────────────────────────────────

def _code_or_error():
    data = request.get_json(silent=True) or {}
    code = data.get("code") or ""
    if not code.strip():
        return None, (jsonify({"error": "No code submitted"}), 400)
    if len(code) > MAX_CODE_LENGTH:
        return None, (jsonify({"error": f"Code must be {MAX_CODE_LENGTH} characters or fewer"}), 400)
    return code, None


@contracts_bp.route("/<int:contract_id>/run", methods=["POST"])
@jwt_required()
def run_public(contract_id):
    """Run only the public tests — a scratch run: nothing is recorded, no XP."""
    contract = db.get_or_404(Contract, contract_id)
    code, err = _code_or_error()
    if err:
        return err
    try:
        return jsonify(run_contract(code, contract, include_hidden=False))
    except Exception as exc:  # noqa: BLE001 — sandbox/runtime failure must fall back to a graceful error
        return jsonify({"error": f"Execution engine error: {exc}"}), 503


@contracts_bp.route("/<int:contract_id>/submit", methods=["POST"])
@jwt_required()
def submit_contract(contract_id):
    contract = db.get_or_404(Contract, contract_id)
    code, err = _code_or_error()
    if err:
        return err
    try:
        result = run_contract(code, contract, include_hidden=True)
    except Exception as exc:  # noqa: BLE001 — sandbox/runtime failure must fall back to a graceful error
        return jsonify({"error": f"Execution engine error: {exc}"}), 503

    user_id    = int(get_jwt_identity())
    all_passed = result["status"] == "ok" and result["total"] > 0 and result["passed"] == result["total"]

    submission = ContractSubmission(
        user_id=user_id,
        contract_id=contract_id,
        solution_code=code,
        test_results=result,
        all_passed=all_passed,
    )
    db.session.add(submission)

    result["xp_earned"]        = 0
    result["first_completion"] = False
    if all_passed:
        existing = ContractCompletion.query.filter_by(user_id=user_id, contract_id=contract_id).first()
        if not existing:
            user = db.get_or_404(User, user_id)
            db.session.add(ContractCompletion(
                user_id=user_id, contract_id=contract_id, xp_earned=contract.xp_reward
            ))
            award_xp(user, contract.xp_reward)
            unlocked = check_achievements(user, categories=[AchievementCategory.general])
            result["xp_earned"]             = contract.xp_reward
            result["first_completion"]      = True
            result["achievements_unlocked"] = [a.slug for a in unlocked]

    db.session.commit()
    result["submission_id"] = submission.id
    return jsonify(result)


# ── Comments ──────────────────────────────────────────────────────────────────

@contracts_bp.route("/<int:contract_id>/comments", methods=["GET"])
def list_comments(contract_id):
    db.get_or_404(Contract, contract_id)
    comments = (
        ContractComment.query
        .filter_by(contract_id=contract_id)
        .order_by(ContractComment.created_at.asc())
        .all()
    )
    return jsonify([c.to_dict() for c in comments])


@contracts_bp.route("/<int:contract_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(contract_id):
    db.get_or_404(Contract, contract_id)
    data    = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Comment content is required"}), 400
    if len(content) > 2000:
        return jsonify({"error": "Comment must be 2000 characters or fewer"}), 400

    comment = ContractComment(contract_id=contract_id, user_id=int(get_jwt_identity()), content=content)
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201


@contracts_bp.route("/<int:contract_id>/comments/<int:comment_id>", methods=["DELETE"])
@jwt_required()
def delete_comment(contract_id, comment_id):
    comment = db.get_or_404(ContractComment, comment_id)
    if comment.contract_id != contract_id:
        return jsonify({"error": "Comment does not belong to this contract"}), 404

    caller_id   = int(get_jwt_identity())
    caller_role = get_jwt().get("role")
    if comment.user_id != caller_id and caller_role not in ("admin", "moderator"):
        return jsonify({"error": "Forbidden"}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({"message": "Comment deleted"}), 200
