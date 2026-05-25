from flask import Blueprint, jsonify
from app.utils import require_role
from app.models import User

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
