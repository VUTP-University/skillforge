from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    jwt_required,
    verify_jwt_in_request,
)

from app import db
from app.models import Difficulty, Language, Quest, QuestComment, QuestCompletion, QuestSubmission, TestCase, User, XP_BY_DIFFICULTY
from app.utils import PISTON_RUNTIMES, require_role, run_tests

quests_bp = Blueprint("quests", __name__)

MAX_TEST_CASES = 10


def _caller_role():
    """Return the JWT role string for the current request, or None if unauthenticated."""
    try:
        verify_jwt_in_request(optional=True)
        return get_jwt().get("role")
    except Exception:
        return None


def _validate(data):
    """Return an error string, or None if data is valid."""
    if not (data.get("title") or "").strip():
        return "Title is required"
    if not (data.get("description") or "").strip():
        return "Description is required"
    if not data.get("language"):
        return "Language is required"
    if not data.get("difficulty"):
        return "Difficulty is required"
    if data["language"] not in [l.value for l in Language]:
        return f"Invalid language '{data['language']}'"
    if data["difficulty"] not in [d.value for d in Difficulty]:
        return f"Invalid difficulty '{data['difficulty']}'"

    tcs = data.get("test_cases", [])
    if not isinstance(tcs, list):
        return "test_cases must be a list"
    if len(tcs) > MAX_TEST_CASES:
        return f"Maximum {MAX_TEST_CASES} test cases allowed"
    indices = {tc.get("index") for tc in tcs}
    if 0 not in indices:
        return "Test case at index 0 is required"
    for tc in tcs:
        idx = tc.get("index")
        if not isinstance(idx, int) or not (0 <= idx <= 9):
            return "Test case index must be an integer between 0 and 9"
        if not (tc.get("input") or "").strip():
            return f"Test case {idx}: input is required"
        if not (tc.get("output") or "").strip():
            return f"Test case {idx}: output is required"
    return None


# ── List ─────────────────────────────────────────────────────────────────────

@quests_bp.route("/", methods=["GET"])
def list_quests():
    lang = request.args.get("language")
    diff = request.args.get("difficulty")

    q = Quest.query
    if lang:
        try:
            q = q.filter(Quest.language == Language(lang))
        except ValueError:
            pass
    if diff:
        try:
            q = q.filter(Quest.difficulty == Difficulty(diff))
        except ValueError:
            pass

    quests = q.order_by(Quest.created_at.desc()).all()
    role = _caller_role()
    include_sol = role in ("admin", "moderator")
    return jsonify([quest.to_dict(include_solution=include_sol) for quest in quests])


# ── Single ────────────────────────────────────────────────────────────────────

@quests_bp.route("/<int:quest_id>", methods=["GET"])
def get_quest(quest_id):
    quest = db.get_or_404(Quest, quest_id)
    role = _caller_role()
    include_sol = role in ("admin", "moderator")
    return jsonify(quest.to_dict(include_solution=include_sol))


# ── Create ────────────────────────────────────────────────────────────────────

@quests_bp.route("/", methods=["POST"])
@require_role("admin", "moderator")
def create_quest():
    data = request.get_json(silent=True) or {}
    err = _validate(data)
    if err:
        return jsonify({"error": err}), 400

    author = db.get_or_404(User, int(get_jwt_identity()))
    diff = Difficulty(data["difficulty"])

    quest = Quest(
        title=data["title"].strip(),
        description=data["description"].strip(),
        example_solution=(data.get("example_solution") or "").strip() or None,
        language=Language(data["language"]),
        difficulty=diff,
        xp_reward=XP_BY_DIFFICULTY[diff],
        author_id=author.id,
    )
    db.session.add(quest)
    db.session.flush()

    for tc in data["test_cases"]:
        db.session.add(TestCase(
            quest_id=quest.id,
            index=tc["index"],
            input=tc["input"].strip(),
            output=tc["output"].strip(),
        ))

    db.session.commit()
    return jsonify(quest.to_dict(include_solution=True)), 201


# ── Update ────────────────────────────────────────────────────────────────────

@quests_bp.route("/<int:quest_id>", methods=["PUT"])
@require_role("admin", "moderator")
def update_quest(quest_id):
    quest = db.get_or_404(Quest, quest_id)
    data = request.get_json(silent=True) or {}
    err = _validate(data)
    if err:
        return jsonify({"error": err}), 400

    diff = Difficulty(data["difficulty"])
    quest.title            = data["title"].strip()
    quest.description      = data["description"].strip()
    quest.example_solution = (data.get("example_solution") or "").strip() or None
    quest.language         = Language(data["language"])
    quest.difficulty       = diff
    quest.xp_reward        = XP_BY_DIFFICULTY[diff]
    quest.updated_at       = datetime.now(timezone.utc)

    # Replace all test cases
    TestCase.query.filter_by(quest_id=quest.id).delete(synchronize_session=False)
    for tc in data["test_cases"]:
        db.session.add(TestCase(
            quest_id=quest.id,
            index=tc["index"],
            input=tc["input"].strip(),
            output=tc["output"].strip(),
        ))

    db.session.commit()
    return jsonify(quest.to_dict(include_solution=True))


# ── Submit ───────────────────────────────────────────────────────────────────

@quests_bp.route("/<int:quest_id>/submit", methods=["POST"])
@jwt_required()
def submit_quest(quest_id):
    quest = db.get_or_404(Quest, quest_id)
    data  = request.get_json(silent=True) or {}
    code  = (data.get("code") or "").strip()

    if not code:
        return jsonify({"error": "No code submitted"}), 400

    lang = quest.language.value
    if lang not in PISTON_RUNTIMES:
        return jsonify({"error": f"Code execution for '{lang}' is not configured"}), 422

    if not quest.test_cases:
        return jsonify({"error": "This job has no test cases"}), 422

    try:
        result = run_tests(code, quest.test_cases, lang)
    except Exception as exc:
        return jsonify({"error": f"Execution engine error: {exc}"}), 503

    user_id    = int(get_jwt_identity())
    all_passed = result.get("passed") == result.get("total") and result.get("total", 0) > 0

    # Always record this run
    submission = QuestSubmission(
        user_id=user_id,
        quest_id=quest_id,
        solution_code=code,
        test_results=result,
        all_passed=all_passed,
    )
    db.session.add(submission)

    # Award XP on first full pass
    if all_passed:
        existing = QuestCompletion.query.filter_by(user_id=user_id, quest_id=quest_id).first()
        if not existing:
            user = db.get_or_404(User, user_id)
            db.session.add(QuestCompletion(
                user_id=user_id, quest_id=quest_id, xp_earned=quest.xp_reward
            ))
            user.total_xp = (user.total_xp or 0) + quest.xp_reward
            result["xp_earned"]        = quest.xp_reward
            result["first_completion"] = True
        else:
            result["xp_earned"]        = 0
            result["first_completion"] = False

    db.session.commit()
    result["submission_id"] = submission.id
    return jsonify(result)


# ── Delete ────────────────────────────────────────────────────────────────────

@quests_bp.route("/<int:quest_id>", methods=["DELETE"])
@require_role("admin")
def delete_quest(quest_id):
    quest = db.get_or_404(Quest, quest_id)
    db.session.delete(quest)
    db.session.commit()
    return jsonify({"message": "Job deleted"}), 200


# ── Comments ──────────────────────────────────────────────────────────────────

@quests_bp.route("/<int:quest_id>/comments", methods=["GET"])
def list_comments(quest_id):
    db.get_or_404(Quest, quest_id)
    comments = (
        QuestComment.query
        .filter_by(quest_id=quest_id)
        .order_by(QuestComment.created_at.asc())
        .all()
    )
    return jsonify([c.to_dict() for c in comments])


@quests_bp.route("/<int:quest_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(quest_id):
    db.get_or_404(Quest, quest_id)
    data    = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Comment content is required"}), 400
    if len(content) > 2000:
        return jsonify({"error": "Comment must be 2000 characters or fewer"}), 400

    user_id = int(get_jwt_identity())
    comment = QuestComment(quest_id=quest_id, user_id=user_id, content=content)
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201


@quests_bp.route("/<int:quest_id>/comments/<int:comment_id>", methods=["DELETE"])
@jwt_required()
def delete_comment(quest_id, comment_id):
    comment = db.get_or_404(QuestComment, comment_id)
    if comment.quest_id != quest_id:
        return jsonify({"error": "Comment does not belong to this job"}), 404

    caller_id   = int(get_jwt_identity())
    caller_role = get_jwt().get("role")
    if comment.user_id != caller_id and caller_role not in ("admin", "moderator"):
        return jsonify({"error": "Forbidden"}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({"message": "Comment deleted"}), 200
