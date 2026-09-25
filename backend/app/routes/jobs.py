import json
import types
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    jwt_required,
    verify_jwt_in_request,
)
from sqlalchemy import func

from app import db
from app.achievements import award_xp, check_achievements
from app.models import (
    XP_BY_JOB_DIFFICULTY,
    AchievementCategory,
    Job,
    JobComment,
    JobCompletion,
    JobDifficulty,
    JobSubmission,
    Language,
    TestCase,
    User,
)
from app.utils import PISTON_RUNTIMES, require_role, run_tests

jobs_bp = Blueprint("jobs", __name__)

MAX_TEST_CASES = 10


def _caller_role():
    """Return the JWT role string for the current request, or None if unauthenticated."""
    try:
        verify_jwt_in_request(optional=True)
        return get_jwt().get("role")
    except Exception:  # noqa: BLE001 — any JWT verification failure means "unauthenticated"
        return None


def _caller_id():
    """Return the current user's id, or None if unauthenticated."""
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except Exception:  # noqa: BLE001 — any JWT verification failure means "unauthenticated"
        return None


JOB_SORTS = ("newest", "xp_desc", "xp_asc")


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
    lang     = request.args.get("language")
    diff     = request.args.get("difficulty")
    search   = (request.args.get("search") or "").strip()
    sort     = request.args.get("sort", "newest")
    unsolved = (request.args.get("unsolved") or "").lower() in ("true", "1")
    page     = max(1, request.args.get("page", 1, type=int))
    per_page = min(50, max(5, request.args.get("per_page", 20, type=int)))

    if sort not in JOB_SORTS:
        sort = "newest"

    user_id = _caller_id()

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
    if search:
        like = f"%{search}%"
        q = q.outerjoin(User, Job.author_id == User.id).filter(
            db.or_(Job.title.ilike(like), User.username.ilike(like))
        )
    if unsolved and user_id:
        completed_ids = db.session.query(JobCompletion.job_id).filter(JobCompletion.user_id == user_id)
        q = q.filter(~Job.id.in_(completed_ids))

    if sort == "xp_desc":
        q = q.order_by(Job.xp_reward.desc(), Job.created_at.desc())
    elif sort == "xp_asc":
        q = q.order_by(Job.xp_reward.asc(), Job.created_at.desc())
    else:
        q = q.order_by(Job.created_at.desc())

    total = q.count()
    jobs  = q.offset((page - 1) * per_page).limit(per_page).all()
    pages = max(1, (total + per_page - 1) // per_page)

    completed_ids = set()
    if user_id and jobs:
        job_ids = [job.id for job in jobs]
        completed_ids = {
            row.job_id for row in
            JobCompletion.query.filter(JobCompletion.user_id == user_id, JobCompletion.job_id.in_(job_ids))
        }

    role = _caller_role()
    include_sol = role in ("admin", "moderator")
    items = []
    for job in jobs:
        d = job.to_dict(include_solution=include_sol)
        d["solved"] = job.id in completed_ids
        items.append(d)

    return jsonify({
        "items":    items,
        "total":    total,
        "page":     page,
        "pages":    pages,
        "per_page": per_page,
    })


@jobs_bp.route("/stats", methods=["GET"])
def job_stats():
    lang = request.args.get("language")

    if lang:
        try:
            lang_enum = Language(lang)
        except ValueError:
            return jsonify({"error": f"Invalid language '{lang}'"}), 400

        rows  = (
            db.session.query(Job.difficulty, func.count(Job.id))
            .filter(Job.language == lang_enum)
            .group_by(Job.difficulty)
            .all()
        )
        by_difficulty = {d.value: 0 for d in JobDifficulty}
        for difficulty, count in rows:
            by_difficulty[difficulty.value] = count
        return jsonify({"total": sum(by_difficulty.values()), "by_difficulty": by_difficulty})

    rows = db.session.query(Job.language, func.count(Job.id)).group_by(Job.language).all()
    by_language = {l.value: 0 for l in Language}
    for language, count in rows:
        by_language[language.value] = count
    return jsonify({"total": sum(by_language.values()), "by_language": by_language})


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

    check_achievements(author, categories=[AchievementCategory.general])
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


# ── AI Assistant ─────────────────────────────────────────────────────────────

_AI_LANG_ENTRY_HINTS = {
    "python":     "Read input via input(). Plain script, no class wrapper needed.",
    "javascript": (
        "Read stdin synchronously — NOT the readline module or process.stdin event "
        "listeners, which are confusing async patterns for a coding-challenge learner. "
        "Use: `const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');` "
        "then index into `lines` for each value (parseInt/parseFloat as needed). "
        "Plain Node.js script, no class needed."
    ),
    "java":       "MUST be a single top-level `public class Main` with `public static void main(String[] args)`. Read input via `new Scanner(System.in)` or a BufferedReader.",
    "csharp":     "MUST be a single `public class Program` with `public static void Main(string[] args)`. Read input via `Console.ReadLine()`.",
    "cpp":        "MUST include `#include <iostream>` (and any other needed standard headers) with a single top-level `int main()`. Read input via `std::cin >>` or `std::getline(std::cin, ...)`.",
}


def _get_openai_client():
    from openai import OpenAI
    return OpenAI(api_key=current_app.config["OPENAI_API_KEY"])


def _ai_system_prompt(language, difficulty):
    # example_solution is never shown to the person solving the job — only
    # to the admin/author who generated it (Job.to_dict()'s include_solution
    # gate) — so a solver gets no code hint at all unless the description
    # itself spells one out. Python's input()/Java's Scanner/C#'s
    # Console.ReadLine() are common-knowledge enough not to need this, but
    # Node has no single obvious idiom for reading stdin, so a junior
    # developer solving a JS job would otherwise be guessing.
    js_input_hint = (
        "\nSince this is JavaScript: the description's Input Format section must include, in a "
        "fenced code block, exactly this stdin-reading line so the solver knows how to read input "
        "in Node (they never see example_solution): "
        "`const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');`"
        if language == "javascript" else ""
    )
    return (
        "You are an expert coding-challenge author for SkillForge, a developer training platform. "
        f"Generate a complete, original {difficulty} {language} coding job.\n"
        f"Language-specific requirement: {_AI_LANG_ENTRY_HINTS.get(language, '')}"
        f"{js_input_hint}\n"
        "Return ONLY valid JSON with this exact shape:\n"
        '{"title": "...", "description": "...(full Markdown problem statement: context, constraints, '
        'input format, output format)", "example_solution": "...(a correct, working solution in the '
        'requested language, following the language-specific requirement above)", '
        '"test_cases": [{"index": 0, "input": "...", "output": "..."}, ... exactly 10 entries, indices 0-9]}\n'
        "Rules for test_cases:\n"
        "- Exactly 10 entries, indices 0 through 9, each unique.\n"
        "- index 0 must be the simplest, example-like case; indices 1-9 should get progressively more "
        "varied and cover edge cases (e.g. empty input, negative numbers, large values, boundary conditions) "
        "as appropriate for the problem.\n"
        "- `input` is fed to the program as stdin. If the program reads multiple values, put ONE value per "
        "line (matching multiple input()/Scanner/Console.ReadLine() calls).\n"
        "- `output` is the exact expected stdout the example_solution produces for that input — it must be "
        "correct and consistent with example_solution.\n"
        "- NEVER use a literally empty string (\"\") for `input` or `output`, even for an edge case like an "
        "empty-string argument — the platform cannot store a blank field. Instead pick a different edge case "
        "(e.g. a single character, whitespace, a very short value, a boundary number like 0 or -1) that still "
        "stresses the same behavior but is non-empty.\n"
        "- Do not include any commentary outside the JSON object."
    )


def _ai_user_prompt(description):
    if description:
        return f"Topic/theme hint from the admin: {description}"
    return "No specific topic given — invent an original, interesting problem appropriate for the language and difficulty."


@jobs_bp.route("/ai-generate", methods=["POST"])
@require_role("admin")
def ai_generate_job():
    data = request.get_json(silent=True) or {}
    language   = (data.get("language") or "").strip().lower()
    difficulty = (data.get("difficulty") or "").strip().lower()
    description = (data.get("description") or "").strip()

    if language not in [l.value for l in Language]:
        return jsonify({"error": f"Invalid language '{language}'"}), 400
    if difficulty not in [d.value for d in JobDifficulty]:
        return jsonify({"error": f"Invalid difficulty '{difficulty}'"}), 400

    try:
        client   = _get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            max_tokens=4000,
            messages=[
                {"role": "system", "content": _ai_system_prompt(language, difficulty)},
                {"role": "user",   "content": _ai_user_prompt(description)},
            ],
        )
        payload = json.loads(response.choices[0].message.content)
    except Exception as exc:  # noqa: BLE001 — any OpenAI/SDK failure must fall back to a graceful error
        current_app.logger.error("AI job generation failed: %s", exc)
        return jsonify({"error": "Failed to generate job — the AI Assistant is momentarily unreachable"}), 502

    # Clamp the raw model output into a well-formed shape before validating it.
    title            = (payload.get("title") or "").strip()[:200]
    out_description  = (payload.get("description") or "").strip()
    example_solution = (payload.get("example_solution") or "").strip()

    raw_tcs = payload.get("test_cases", [])
    if not isinstance(raw_tcs, list):
        raw_tcs = []
    clamped_tcs = []
    for tc in raw_tcs[:MAX_TEST_CASES]:
        if not isinstance(tc, dict):
            continue
        idx = tc.get("index")
        if not isinstance(idx, int) or not (0 <= idx <= 9):
            continue
        tc_input  = str(tc.get("input") or "").strip()
        tc_output = str(tc.get("output") or "").strip()
        # Same rule the manual JobForm submit applies: index 0 is always kept, but a
        # blank field on any other index means "skip this slot" — the model sometimes
        # reaches for a literally-empty edge case (e.g. reversing ""), which this
        # platform's test-case fields can't represent, so drop it rather than fail.
        if idx != 0 and not (tc_input and tc_output):
            continue
        clamped_tcs.append({"index": idx, "input": tc_input, "output": tc_output})

    err = _validate({
        "title":       title,
        "description": out_description,
        "language":    language,
        "difficulty":  difficulty,
        "test_cases":  clamped_tcs,
    })
    if err:
        current_app.logger.error("AI job generation produced an invalid payload: %s", err)
        return jsonify({"error": "The AI Assistant produced an invalid job — please try again"}), 502

    # Verify the example solution actually produces the stated outputs via Piston.
    verification = {"verified": False, "passed": 0, "total": len(clamped_tcs), "compile_error": None}
    if example_solution and language in PISTON_RUNTIMES:
        wrapped_tcs = [
            types.SimpleNamespace(index=tc["index"], input=tc["input"], output=tc["output"])
            for tc in clamped_tcs
        ]
        try:
            result = run_tests(example_solution, wrapped_tcs, language)
            verification["compile_error"] = result.get("compile_error")
            verification["passed"] = result.get("passed", 0)
            verification["total"]  = result.get("total", len(clamped_tcs))
            verification["verified"] = (
                result["compile_error"] is None
                and verification["passed"] == verification["total"]
                and verification["total"] > 0
            )
        except Exception as exc:  # noqa: BLE001 — sandbox/runtime failure must not crash job generation
            current_app.logger.error("AI job verification failed: %s", exc)
            verification["compile_error"] = "Verification engine error — could not run generated tests"

    return jsonify({
        "title":            title,
        "description":      out_description,
        "example_solution": example_solution,
        "language":         language,
        "difficulty":       difficulty,
        "test_cases":       clamped_tcs,
        "verification":     verification,
    }), 200


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
    except Exception as exc:  # noqa: BLE001 — sandbox/runtime failure must fall back to a graceful error
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
            award_xp(user, job.xp_reward)
            unlocked = check_achievements(user, categories=[AchievementCategory.job, AchievementCategory.general])
            result["xp_earned"]           = job.xp_reward
            result["first_completion"]    = True
            result["achievements_unlocked"] = [a.slug for a in unlocked]
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

    user = db.get_or_404(User, user_id)
    check_achievements(user, categories=[AchievementCategory.general])

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
