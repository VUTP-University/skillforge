import logging
from extensions import db
from flask import Blueprint, jsonify, request
from models.user import User
from models.user_stats import UserStats
from werkzeug.security import generate_password_hash

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
        return jsonify({"error": "Error creating newuser"}), 500

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User registered successfully"}), 201
