import logging
from backend.extensions import db
from flask import Blueprint, jsonify, request
from sqlalchemy import or_
from backend.models.user import User
from backend.models.user_stats import UserStats
from backend.services import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash

# Auth Blueprint
auth_bp = Blueprint("auth", __name__)

logger = logging.getLogger(__name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    # Check if fields are empty
    if not username or not email or not password:
        return jsonify({"msg": "Missing required fields"}), 400

    # Check if username already exists
    existing_user = User.query.filter_by(username=data["username"]).first()
    if existing_user:
        return jsonify({"error": "Username already taken"}), 409

    # Check if email already exists
    existing_email = User.query.filter_by(email=data["email"]).first()
    if existing_email:
        return jsonify({"error": "Email already registered"}), 409

    # Validate and hash password
    try:
        User.validate_password(password)
    except ValueError as ve:
        logger.error("Password validation error: %s", ve)
        return jsonify({"error": "Password does not meet criteria!"}), 400

    hashed_password = generate_password_hash(password, method="pbkdf2:sha256")

    # Create new user and user stats
    try:
        new_user = User(email=email, password=hashed_password, username=username)
        new_user.stats = UserStats()
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

    return (
        jsonify(
            {
                "access_token": access_token,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            }
        ),
        200,
    )
