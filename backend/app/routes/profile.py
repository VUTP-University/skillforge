import os
import uuid

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models import Boss, BossChallenge, ChallengeStatus, Quest, QuestCompletion, User

profile_bp = Blueprint("profile", __name__)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_AVATAR_BYTES   = 2 * 1024 * 1024  # 2 MB


def _avatars_dir():
    # current_app.root_path = backend/app  →  dirname = backend/
    return os.path.join(os.path.dirname(current_app.root_path), "uploads", "avatars")


def _allowed_ext(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _build_boss_challenges(user_id):
    rows = (
        db.session.query(BossChallenge, Boss)
        .join(Boss, BossChallenge.boss_id == Boss.id)
        .filter(BossChallenge.user_id == user_id)
        .filter(BossChallenge.status != ChallengeStatus.active)
        .order_by(BossChallenge.started_at.desc())
        .all()
    )
    return [{
        "id":           c.id,
        "boss_name":    b.name,
        "boss_avatar":  b.avatar,
        "language":     b.language,
        "difficulty":   b.difficulty.value,
        "status":       c.status.value,
        "xp_earned":    c.xp_earned,
        "score_pct":    c.score_pct,
        "boss_verdict": c.boss_verdict,
        "started_at":   c.started_at.isoformat(),
    } for c, b in rows]


def _build_completions(user_id):
    rows = (
        db.session.query(QuestCompletion, Quest)
        .join(Quest, QuestCompletion.quest_id == Quest.id)
        .filter(QuestCompletion.user_id == user_id)
        .order_by(QuestCompletion.completed_at.desc())
        .all()
    )
    return [{
        "quest_id":     c.quest_id,
        "quest_title":  q.title,
        "language":     q.language.value,
        "difficulty":   q.difficulty.value,
        "xp_earned":    c.xp_earned,
        "completed_at": c.completed_at.isoformat(),
    } for c, q in rows]


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
    data["completions"]     = _build_completions(user.id)
    data["boss_challenges"] = _build_boss_challenges(user.id)
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
        "total_xp":    user.total_xp or 0,
        "level":       user.level,
        "rank":        user.rank,
        "created_at":  user.created_at.isoformat(),
        "completions":     _build_completions(user_id),
        "boss_challenges": _build_boss_challenges(user_id),
    })


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
