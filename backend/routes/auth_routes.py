from flask import Blueprint, jsonify, request
from models.user import User
from extensions import db
from werkzeug.security import generate_password_hash

# Auth Blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Check if fields are empty
    if not username or not email or not password:
        return jsonify({"msg": "Missing required fields"}), 400

    # Check if username already exists
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({"error": "Username already taken"}), 409
    
    # Check if email already exists
    existing_email = User.query.filter_by(email=data['email']).first()
    if existing_email:
        return jsonify({"error": "Email already registered"}), 409

    #Validate and hash password
    User.validate_password(password)
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')


    new_user = User(email=email, password=hashed_password, username=username)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User registered successfully"}), 201
