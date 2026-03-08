import logging

from flask import Blueprint, jsonify, make_response, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from backend.extensions import db
from backend.models.user import User
from backend.models.user_stats import UserStats

users_bp = Blueprint("users", __name__)
logger = logging.getLogger(__name__)

_ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
_MAX_AVATAR_BYTES = 5 * 1024 * 1024  # 5 MB

_PROFILE_FIELDS = [
    "first_name",
    "last_name",
    "about_me",
    "facebook_profile",
    "instagram_profile",
    "github_profile",
    "discord_id",
    "linked_in",
]


@users_bp.route("/users/<user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    stats = user.stats
    xp = stats.xp if stats else 0
    level = stats.level if stats else 1
    rank = stats.rank if stats else "Novice"
    # Percentage progress toward next level (each level = 1000 XP)
    level_percentage = min(int((xp % 1000) / 10), 100)

    return (
        jsonify(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name or "",
                "last_name": user.last_name or "",
                "about_me": user.about_me or "",
                "facebook_profile": user.facebook_profile or "",
                "instagram_profile": user.instagram_profile or "",
                "github_profile": user.github_profile or "",
                "discord_id": user.discord_id or "",
                "linked_in": user.linked_in or "",
                "rank": rank,
                "level": level,
                "level_percentage": level_percentage,
                "user_online_status": "Offline",
                "last_seen_date": (
                    user.updated_at.isoformat() if user.updated_at else None
                ),
                "registration_date": (
                    user.created_at.isoformat() if user.created_at else None
                ),
                # Quest stats — will be populated once quest completion models exist
                "total_solved_quests": 0,
                "total_python_quests": 0,
                "total_java_quests": 0,
                "total_javascript_quests": 0,
                "total_csharp_quests": 0,
                "total_submited_quests": 0,
                "total_approved_submited_quests": 0,
                "total_rejected_submited_quests": 0,
            }
        ),
        200,
    )


@users_bp.route("/update_user/<user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Update email with uniqueness check
    new_email = data.get("email")
    if new_email and new_email != user.email:
        if User.query.filter(User.email == new_email, User.id != user_id).first():
            return jsonify({"error": "Email already in use"}), 409
        user.email = new_email

    # Update all plain profile fields
    for field in _PROFILE_FIELDS:
        if field in data:
            setattr(user, field, data[field])

    db.session.commit()
    logger.info("Profile updated for user %s", user_id)
    return jsonify({"msg": "Profile updated"}), 200


@users_bp.route("/users/<user_id>/avatar", methods=["GET"])
@jwt_required()
def get_avatar(user_id):
    user = db.session.get(User, user_id)
    if not user or not user.avatar:
        return jsonify({"error": "Avatar not found"}), 404

    response = make_response(user.avatar)
    response.headers["Content-Type"] = user.avatar_mime or "image/png"
    response.headers["Cache-Control"] = "private, max-age=86400"
    return response


@users_bp.route("/update_user/<user_id>/avatar", methods=["PUT"])
@jwt_required()
def update_avatar(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if "avatar" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["avatar"]
    if not file or file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if file.content_type not in _ALLOWED_MIME_TYPES:
        return (
            jsonify({"error": "Unsupported file type. Use JPEG, PNG, GIF, or WebP."}),
            415,
        )

    data = file.read()
    if len(data) > _MAX_AVATAR_BYTES:
        return jsonify({"error": "File too large. Maximum size is 5 MB."}), 413

    user.avatar = data
    user.avatar_mime = file.content_type
    db.session.commit()
    logger.info("Avatar updated for user %s", user_id)
    return jsonify({"msg": "Avatar updated"}), 200


@users_bp.route("/leaderboard", methods=["GET"])
@jwt_required()
def get_leaderboard():
    results = (
        db.session.query(User, UserStats)
        .join(UserStats, User.id == UserStats.id)
        .order_by(UserStats.xp.desc())
        .limit(50)
        .all()
    )

    leaderboard = [
        {
            "position": pos,
            "user_id": user.id,
            "username": user.username,
            "xp": stats.xp,
            "level": stats.level,
            "rank": stats.rank,
            "level_percentage": min(int((stats.xp % 1000) / 10), 100),
        }
        for pos, (user, stats) in enumerate(results, start=1)
    ]

    return jsonify(leaderboard), 200
