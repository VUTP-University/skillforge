from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import RoleName, User, UserRole
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
