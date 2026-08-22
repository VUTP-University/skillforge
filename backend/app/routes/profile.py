import os
import uuid

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.achievements import check_achievements
from app.models import (
    Achievement,
    AchievementCategory,
    ChallengeStatus,
    Job,
    JobCompletion,
    JobSubmission,
    Process,
    ProcessChallenge,
    TestRun,
    TestRunStatus,
    User,
    UserAchievement,
    xp_progress,
)

profile_bp = Blueprint("profile", __name__)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_AVATAR_BYTES   = 2 * 1024 * 1024  # 2 MB


def _avatars_dir():
    # current_app.root_path = backend/app  →  dirname = backend/
    return os.path.join(os.path.dirname(current_app.root_path), "uploads", "avatars")


def _allowed_ext(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _build_process_challenges(user_id):
    rows = (
        db.session.query(ProcessChallenge, Process)
        .join(Process, ProcessChallenge.process_id == Process.id)
        .filter(ProcessChallenge.user_id == user_id)
        .filter(ProcessChallenge.status != ChallengeStatus.active)
        .order_by(ProcessChallenge.started_at.desc())
        .all()
    )
    return [{
        "id":              c.id,
        "process_name":    p.name,
        "process_glyph":   p.glyph,
        "language":        p.language,
        "difficulty":      p.difficulty.value,
        "status":          c.status.value,
        "xp_earned":       c.xp_earned,
        "score_pct":       c.score_pct,
        "process_verdict": c.process_verdict,
        "started_at":      c.started_at.isoformat(),
    } for c, p in rows]


def _build_test_runs(user_id):
    rows = (
        TestRun.query
        .filter(
            TestRun.user_id == user_id,
            TestRun.status != TestRunStatus.active,
        )
        .order_by(TestRun.started_at.desc())
        .all()
    )
    return [{
        "id":              s.id,
        "language":        s.language,
        "status":          s.status.value,
        "score_xp":        s.score_xp,
        "correct_count":   s.correct_count,
        "total_questions": len(s.questions) if s.questions else 0,
        "started_at":      s.started_at.isoformat(),
        "completed_at":    s.completed_at.isoformat() if s.completed_at else None,
    } for s in rows]


def _build_completions(user_id):
    rows = (
        db.session.query(JobCompletion, Job)
        .join(Job, JobCompletion.job_id == Job.id)
        .filter(JobCompletion.user_id == user_id)
        .order_by(JobCompletion.completed_at.desc())
        .all()
    )
    return [{
        "job_id":       c.job_id,
        "job_title":    j.title,
        "language":     j.language.value,
        "difficulty":   j.difficulty.value,
        "xp_earned":    c.xp_earned,
        "completed_at": c.completed_at.isoformat(),
    } for c, j in rows]


def _build_achievements(user_id):
    rows = (
        db.session.query(UserAchievement, Achievement)
        .join(Achievement, UserAchievement.achievement_id == Achievement.id)
        .filter(UserAchievement.user_id == user_id)
        .order_by(UserAchievement.earned_at.desc())
        .all()
    )
    return [{
        "slug":        a.slug,
        "name":        a.name,
        "description": a.description,
        "category":    a.category.value,
        "glyph":       a.glyph,
        "earned_at":   ua.earned_at.isoformat(),
    } for ua, a in rows]


# ── Serve avatar files ────────────────────────────────────────────────────────

@profile_bp.route("/media/avatars/<filename>")
def serve_avatar(filename):
    return send_from_directory(_avatars_dir(), filename)


# ── Own profile (includes email + completions) ────────────────────────────────

@profile_bp.route("/profile/me", methods=["GET"])
@jwt_required()
def get_my_profile():
    user = db.get_or_404(User, int(get_jwt_identity()))
    data = user.to_dict()
    data["completions"]        = _build_completions(user.id)
    data["process_challenges"] = _build_process_challenges(user.id)
    data["test_runs"]          = _build_test_runs(user.id)
    data["achievements"]       = _build_achievements(user.id)
    return jsonify(data)


# ── Public profile (no email) ─────────────────────────────────────────────────

@profile_bp.route("/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    user = db.get_or_404(User, user_id)
    return jsonify({
        "id":          user.id,
        "username":    user.username,
        "role":        user.user_role.role.value if user.user_role else "user",
        "avatar_url":  f"/api/media/avatars/{user.avatar}" if user.avatar else None,
        "total_xp":            user.total_xp or 0,
        "level":               user.level,
        "rank":                user.rank,
        **xp_progress(user.total_xp or 0),
        "created_at":          user.created_at.isoformat(),
        "completions":        _build_completions(user_id),
        "process_challenges": _build_process_challenges(user_id),
        "test_runs":          _build_test_runs(user_id),
        "achievements":       _build_achievements(user_id),
    })


# ── Submissions (paginated list + detail) ────────────────────────────────────

def _build_submission_page(user_id, page, per_page):
    """Shared paginated query for submissions; returns (items_list, total, pages)."""
    query = (
        db.session.query(JobSubmission, Job)
        .join(Job, JobSubmission.job_id == Job.id)
        .filter(JobSubmission.user_id == user_id)
        .order_by(JobSubmission.submitted_at.desc())
    )
    total = query.count()
    rows  = query.offset((page - 1) * per_page).limit(per_page).all()
    pages = max(1, (total + per_page - 1) // per_page)
    items = [{
        "id":           s.id,
        "job_id":       s.job_id,
        "job_title":    j.title,
        "language":     j.language.value,
        "difficulty":   j.difficulty.value,
        "all_passed":   s.all_passed,
        "passed":       (s.test_results or {}).get("passed"),
        "total":        (s.test_results or {}).get("total"),
        "submitted_at": s.submitted_at.isoformat(),
    } for s, j in rows]
    return items, total, pages


@profile_bp.route("/profile/me/submissions", methods=["GET"])
@jwt_required()
def get_my_submissions():
    """Own paginated submissions — includes solution code and results via detail endpoint."""
    user_id  = int(get_jwt_identity())
    page     = max(1, request.args.get("page", 1, type=int))
    per_page = min(50, max(5, request.args.get("per_page", 20, type=int)))
    items, total, pages = _build_submission_page(user_id, page, per_page)
    return jsonify({"items": items, "total": total, "page": page, "pages": pages, "per_page": per_page})


@profile_bp.route("/profile/me/submissions/<int:submission_id>", methods=["GET"])
@jwt_required()
def get_submission_detail(submission_id):
    """Full detail including code — only accessible by the owning user."""
    user_id = int(get_jwt_identity())
    s = JobSubmission.query.filter_by(id=submission_id, user_id=user_id).first_or_404()
    j = db.get_or_404(Job, s.job_id)
    return jsonify({
        "id":            s.id,
        "job_id":        s.job_id,
        "job_title":     j.title,
        "language":      j.language.value,
        "difficulty":    j.difficulty.value,
        "all_passed":    s.all_passed,
        "solution_code": s.solution_code,
        "test_results":  s.test_results,
        "submitted_at":  s.submitted_at.isoformat(),
    })


@profile_bp.route("/profile/<int:user_id>/submissions", methods=["GET"])
def get_user_submissions(user_id):
    """Public paginated submissions for any profile — metadata only, never code or results."""
    db.get_or_404(User, user_id)
    page     = max(1, request.args.get("page", 1, type=int))
    per_page = min(50, max(5, request.args.get("per_page", 20, type=int)))
    items, total, pages = _build_submission_page(user_id, page, per_page)
    return jsonify({"items": items, "total": total, "page": page, "pages": pages, "per_page": per_page})


# ── Update email ──────────────────────────────────────────────────────────────

@profile_bp.route("/profile/me/email", methods=["PATCH"])
@jwt_required()
def update_email():
    user  = db.get_or_404(User, int(get_jwt_identity()))
    data  = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email or "@" not in email or "." not in email.split("@")[-1]:
        return jsonify({"error": "Invalid email address"}), 400
    if email == user.email:
        return jsonify(user.to_dict())
    if User.query.filter(User.email == email, User.id != user.id).first():
        return jsonify({"error": "Email already in use"}), 409

    user.email = email
    db.session.commit()
    return jsonify(user.to_dict())


# ── Upload avatar ─────────────────────────────────────────────────────────────

@profile_bp.route("/profile/me/avatar", methods=["POST"])
@jwt_required()
def upload_avatar():
    user = db.get_or_404(User, int(get_jwt_identity()))

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "No file selected"}), 400
    if not _allowed_ext(f.filename):
        return jsonify({"error": "Only JPEG and PNG images are allowed"}), 400

    f.seek(0, os.SEEK_END)
    size = f.tell()
    f.seek(0)
    if size > MAX_AVATAR_BYTES:
        return jsonify({"error": "File too large (max 2 MB)"}), 400

    ext      = f.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4()}.{ext}"

    avatars_dir = _avatars_dir()
    os.makedirs(avatars_dir, exist_ok=True)

    if user.avatar:
        old = os.path.join(avatars_dir, user.avatar)
        if os.path.isfile(old):
            os.remove(old)

    f.save(os.path.join(avatars_dir, filename))
    user.avatar = filename
    check_achievements(user, categories=[AchievementCategory.general])
    db.session.commit()
    return jsonify(user.to_dict())


# ── Remove avatar ─────────────────────────────────────────────────────────────

@profile_bp.route("/profile/me/avatar", methods=["DELETE"])
@jwt_required()
def delete_avatar():
    user = db.get_or_404(User, int(get_jwt_identity()))

    if user.avatar:
        old = os.path.join(_avatars_dir(), user.avatar)
        if os.path.isfile(old):
            os.remove(old)
        user.avatar = None
        db.session.commit()

    return jsonify(user.to_dict())
