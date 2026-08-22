from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Job, JobSubmission, Language, RoleName, User, UserRole
from app.utils import require_role

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/dashboard", methods=["GET"])
@require_role("admin")
def dashboard():
    total_users = User.query.count()
    return jsonify({"total_users": total_users})


@admin_bp.route("/users", methods=["GET"])
@require_role("admin", "moderator")
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@admin_bp.route("/users/<int:user_id>/role", methods=["PATCH"])
@require_role("admin")
def update_user_role(user_id):
    caller_id = int(get_jwt_identity())
    if caller_id == user_id:
        return jsonify({"error": "You cannot change your own role"}), 400

    data     = request.get_json(silent=True) or {}
    new_role = (data.get("role") or "").strip()
    valid    = [r.value for r in RoleName]
    if new_role not in valid:
        return jsonify({"error": f"Role must be one of: {valid}"}), 400

    user = db.get_or_404(User, user_id)
    if user.user_role:
        user.user_role.role = RoleName(new_role)
    else:
        db.session.add(UserRole(user_id=user.id, role=RoleName(new_role)))

    db.session.commit()
    return jsonify(user.to_dict())


@admin_bp.route("/users/<int:user_id>/ban", methods=["PATCH"])
@require_role("admin")
def update_user_ban(user_id):
    caller_id = int(get_jwt_identity())
    if caller_id == user_id:
        return jsonify({"error": "You cannot ban yourself"}), 400

    data   = request.get_json(silent=True) or {}
    banned = bool(data.get("banned"))
    user   = db.get_or_404(User, user_id)

    if banned:
        reason = (data.get("reason") or "").strip()
        if not reason:
            return jsonify({"error": "A ban reason is required"}), 400
        user.is_banned  = True
        user.ban_reason = reason
        user.banned_at  = datetime.now(timezone.utc)
    else:
        user.is_banned  = False
        user.ban_reason = None
        user.banned_at  = None

    db.session.commit()
    return jsonify(user.to_dict())


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@require_role("admin")
def delete_user(user_id):
    caller_id = int(get_jwt_identity())
    if caller_id == user_id:
        return jsonify({"error": "You cannot delete your own account"}), 400

    user = db.get_or_404(User, user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"User {user.username} deleted"}), 200


# ── All-users submissions (admin + moderator) ─────────────────────────────────

@admin_bp.route("/submissions", methods=["GET"])
@require_role("admin", "moderator")
def list_submissions():
    page     = max(1, request.args.get("page", 1, type=int))
    per_page = min(50, max(5, request.args.get("per_page", 20, type=int)))
    search   = (request.args.get("search") or "").strip()
    language = (request.args.get("language") or "").strip()
    passed   = request.args.get("all_passed", None)

    query = (
        db.session.query(JobSubmission, Job, User)
        .join(Job, JobSubmission.job_id == Job.id)
        .join(User, JobSubmission.user_id == User.id)
        .order_by(JobSubmission.submitted_at.desc())
    )

    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(User.username.ilike(like), Job.title.ilike(like))
        )
    if language and language in [l.value for l in Language]:
        query = query.filter(Job.language == Language(language))
    if passed == "true":
        query = query.filter(JobSubmission.all_passed == True)
    elif passed == "false":
        query = query.filter(JobSubmission.all_passed == False)

    total = query.count()
    rows  = query.offset((page - 1) * per_page).limit(per_page).all()
    pages = max(1, (total + per_page - 1) // per_page)

    items = [{
        "id":           s.id,
        "user_id":      s.user_id,
        "username":     u.username,
        "job_id":       s.job_id,
        "job_title":    j.title,
        "language":     j.language.value,
        "difficulty":   j.difficulty.value,
        "all_passed":   s.all_passed,
        "passed":       (s.test_results or {}).get("passed"),
        "total":        (s.test_results or {}).get("total"),
        "submitted_at": s.submitted_at.isoformat(),
    } for s, j, u in rows]

    return jsonify({"items": items, "total": total, "page": page, "pages": pages, "per_page": per_page})


@admin_bp.route("/submissions/<int:submission_id>", methods=["GET"])
@require_role("admin", "moderator")
def get_submission(submission_id):
    s = db.get_or_404(JobSubmission, submission_id)
    j = db.get_or_404(Job, s.job_id)
    u = db.get_or_404(User, s.user_id)
    return jsonify({
        "id":            s.id,
        "user_id":       s.user_id,
        "username":      u.username,
        "job_id":        s.job_id,
        "job_title":     j.title,
        "language":      j.language.value,
        "difficulty":    j.difficulty.value,
        "all_passed":    s.all_passed,
        "passed":        (s.test_results or {}).get("passed"),
        "total":         (s.test_results or {}).get("total"),
        "solution_code": s.solution_code,
        "test_results":  s.test_results,
        "submitted_at":  s.submitted_at.isoformat(),
    })
