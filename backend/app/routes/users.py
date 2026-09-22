from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models import User, to_utc_iso

users_bp = Blueprint("users", __name__)


def _public_dict(user):
    """Minimal, non-sensitive shape for the roster/leaderboard — no email or ban details."""
    return {
        "id":         user.id,
        "username":   user.username,
        "avatar_url": f"/api/media/avatars/{user.avatar}" if user.avatar else None,
        "role":       user.user_role.role.value if user.user_role else "user",
        "total_xp":   user.total_xp or 0,
        "level":      user.level,
        "rank":       user.rank,
        "created_at": to_utc_iso(user.created_at),
    }


@users_bp.route("/", methods=["GET"])
@jwt_required()
def get_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([_public_dict(u) for u in users])


@users_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    user = db.get_or_404(User, user_id)
    return jsonify(_public_dict(user))
