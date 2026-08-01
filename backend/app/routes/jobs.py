from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    jwt_required,
    verify_jwt_in_request,
)

from app import db
from app.models import JobDifficulty, Language, Job, JobComment, JobCompletion, JobSubmission, TestCase, User, XP_BY_JOB_DIFFICULTY
from app.utils import PISTON_RUNTIMES, require_role, run_tests

jobs_bp = Blueprint("jobs", __name__)

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
    if data["difficulty"] not in [d.value for d in JobDifficulty]:
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

@jobs_bp.route("/", methods=["GET"])
def list_jobs():
    lang = request.args.get("language")
    diff = request.args.get("difficulty")

    q = Job.query
    if lang:
        try:
            q = q.filter(Job.language == Language(lang))
        except ValueError:
            pass
    if diff:
        try:
            q = q.filter(Job.difficulty == JobDifficulty(diff))
        except ValueError:
            pass

    jobs = q.order_by(Job.created_at.desc()).all()
    role = _caller_role()
    include_sol = role in ("admin", "moderator")
    return jsonify([job.to_dict(include_solution=include_sol) for job in jobs])


# ── Single ────────────────────────────────────────────────────────────────────

@jobs_bp.route("/<int:job_id>", methods=["GET"])
def get_job(job_id):
    job = db.get_or_404(Job, job_id)
    role = _caller_role()
    include_sol = role in ("admin", "moderator")
    return jsonify(job.to_dict(include_solution=include_sol))


# ── Create ────────────────────────────────────────────────────────────────────

@jobs_bp.route("/", methods=["POST"])
@require_role("admin", "moderator")
def create_job():
    data = request.get_json(silent=True) or {}
    err = _validate(data)
    if err:
        return jsonify({"error": err}), 400

    author = db.get_or_404(User, int(get_jwt_identity()))
    diff = JobDifficulty(data["difficulty"])

    job = Job(
        title=data["title"].strip(),
        description=data["description"].strip(),
        example_solution=(data.get("example_solution") or "").strip() or None,
        language=Language(data["language"]),
        difficulty=diff,
        xp_reward=XP_BY_JOB_DIFFICULTY[diff],
        author_id=author.id,
    )
    db.session.add(job)
    db.session.flush()

    for tc in data["test_cases"]:
        db.session.add(TestCase(
            job_id=job.id,
            index=tc["index"],
            input=tc["input"].strip(),
            output=tc["output"].strip(),
        ))

    db.session.commit()
    return jsonify(job.to_dict(include_solution=True)), 201


# ── Update ────────────────────────────────────────────────────────────────────

@jobs_bp.route("/<int:job_id>", methods=["PUT"])
@require_role("admin", "moderator")
def update_job(job_id):
    job = db.get_or_404(Job, job_id)
    data = request.get_json(silent=True) or {}
    err = _validate(data)
    if err:
        return jsonify({"error": err}), 400

    diff = JobDifficulty(data["difficulty"])
    job.title            = data["title"].strip()
    job.description      = data["description"].strip()
    job.example_solution = (data.get("example_solution") or "").strip() or None
    job.language         = Language(data["language"])
    job.difficulty       = diff
    job.xp_reward        = XP_BY_JOB_DIFFICULTY[diff]
    job.updated_at       = datetime.now(timezone.utc)

    # Replace all test cases
    TestCase.query.filter_by(job_id=job.id).delete(synchronize_session=False)
    for tc in data["test_cases"]:
        db.session.add(TestCase(
            job_id=job.id,
            index=tc["index"],
            input=tc["input"].strip(),
            output=tc["output"].strip(),
        ))

    db.session.commit()
    return jsonify(job.to_dict(include_solution=True))


# ── Submit ───────────────────────────────────────────────────────────────────

@jobs_bp.route("/<int:job_id>/submit", methods=["POST"])
@jwt_required()
def submit_job(job_id):
    job  = db.get_or_404(Job, job_id)
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip()

    if not code:
        return jsonify({"error": "No code submitted"}), 400

    lang = job.language.value
    if lang not in PISTON_RUNTIMES:
        return jsonify({"error": f"Code execution for '{lang}' is not configured"}), 422

    if not job.test_cases:
        return jsonify({"error": "This job has no test cases"}), 422

    try:
        result = run_tests(code, job.test_cases, lang)
    except Exception as exc:
        return jsonify({"error": f"Execution engine error: {exc}"}), 503

    user_id    = int(get_jwt_identity())
    all_passed = result.get("passed") == result.get("total") and result.get("total", 0) > 0

    # Always record this run
    submission = JobSubmission(
        user_id=user_id,
        job_id=job_id,
        solution_code=code,
        test_results=result,
        all_passed=all_passed,
    )
    db.session.add(submission)

    # Award XP on first full pass
    if all_passed:
        existing = JobCompletion.query.filter_by(user_id=user_id, job_id=job_id).first()
        if not existing:
            user = db.get_or_404(User, user_id)
            db.session.add(JobCompletion(
                user_id=user_id, job_id=job_id, xp_earned=job.xp_reward
            ))
            user.total_xp = (user.total_xp or 0) + job.xp_reward
            result["xp_earned"]        = job.xp_reward
            result["first_completion"] = True
        else:
            result["xp_earned"]        = 0
            result["first_completion"] = False

    db.session.commit()
    result["submission_id"] = submission.id
    return jsonify(result)


# ── Delete ────────────────────────────────────────────────────────────────────

@jobs_bp.route("/<int:job_id>", methods=["DELETE"])
@require_role("admin")
def delete_job(job_id):
    job = db.get_or_404(Job, job_id)
    db.session.delete(job)
    db.session.commit()
    return jsonify({"message": "Job deleted"}), 200


# ── Comments ──────────────────────────────────────────────────────────────────

@jobs_bp.route("/<int:job_id>/comments", methods=["GET"])
def list_comments(job_id):
    db.get_or_404(Job, job_id)
    comments = (
        JobComment.query
        .filter_by(job_id=job_id)
        .order_by(JobComment.created_at.asc())
        .all()
    )
    return jsonify([c.to_dict() for c in comments])


@jobs_bp.route("/<int:job_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(job_id):
    db.get_or_404(Job, job_id)
    data    = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Comment content is required"}), 400
    if len(content) > 2000:
        return jsonify({"error": "Comment must be 2000 characters or fewer"}), 400

    user_id = int(get_jwt_identity())
    comment = JobComment(job_id=job_id, user_id=user_id, content=content)
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201


@jobs_bp.route("/<int:job_id>/comments/<int:comment_id>", methods=["DELETE"])
@jwt_required()
def delete_comment(job_id, comment_id):
    comment = db.get_or_404(JobComment, comment_id)
    if comment.job_id != job_id:
        return jsonify({"error": "Comment does not belong to this job"}), 404

    caller_id   = int(get_jwt_identity())
    caller_role = get_jwt().get("role")
    if comment.user_id != caller_id and caller_role not in ("admin", "moderator"):
        return jsonify({"error": "Forbidden"}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({"message": "Comment deleted"}), 200
