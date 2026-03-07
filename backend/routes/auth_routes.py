import logging
import os

from flask import Blueprint, current_app, jsonify, make_response, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from sqlalchemy import or_
from werkzeug.security import check_password_hash, generate_password_hash

from backend.extensions import db
from backend.models.user import User
from backend.models.user_stats import UserStats

auth_bp = Blueprint("auth", __name__)

logger = logging.getLogger(__name__)


def _set_default_avatar(user) -> None:
    """Assign skill_forge_logo.png as the user's initial avatar."""
    avatar_path = os.path.join(
        current_app.root_path,          # backend/
        "..", "frontend", "src", "assets", "img", "skill_forge_logo.png",
    )
    avatar_path = os.path.normpath(avatar_path)
    try:
        with open(avatar_path, "rb") as f:
            user.avatar = f.read()
            user.avatar_mime = "image/png"
    except OSError:
        logger.warning("Default avatar not found at %s — user created without avatar", avatar_path)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"msg": "Missing required fields"}), 400

    existing_user = User.query.filter_by(username=data["username"]).first()
    if existing_user:
        return jsonify({"error": "Username already taken"}), 409

    existing_email = User.query.filter_by(email=data["email"]).first()
    if existing_email:
        return jsonify({"error": "Email already registered"}), 409

    try:
        User.validate_password(password)
    except ValueError as ve:
        logger.error("Password validation error: %s", ve)
        return jsonify({"error": "Password does not meet criteria!"}), 400

    hashed_password = generate_password_hash(password, method="pbkdf2:sha256")

    try:
        new_user = User(email=email, password=hashed_password, username=username)
        new_user.stats = UserStats()
        _set_default_avatar(new_user)
    except Exception as e:
        db.session.rollback()
        logger.error("Error creating new user: %s", e)
        return jsonify({"error": "Error creating new user"}), 500

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User registered successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Unsupported request format"}), 415

    identifier = data.get("identifier")
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"msg": "Missing required fields"}), 400

    user = User.query.filter(
        or_(
            User.username == identifier,
            User.email == identifier,
        )
    ).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    response = make_response(
        jsonify({
            "msg": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
        }),
        200,
    )
    # Tokens are stored in HttpOnly cookies — never exposed to JavaScript
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    return response


@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = make_response(jsonify({"msg": "Logout successful"}), 200)
    unset_jwt_cookies(response)
    return response


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    response = make_response(jsonify({"msg": "Token refreshed"}), 200)
    set_access_cookies(response, access_token)
    return response


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }), 200
