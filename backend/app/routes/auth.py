from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from werkzeug.security import check_password_hash, generate_password_hash

from app import db, limiter
from app.mailer import send_welcome_email
from app.models import RoleName, TokenBlocklist, User, UserRole

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("10 per hour")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    if len(username) < 3 or len(username) > 30:
        return jsonify({"error": "Username must be 3–30 characters"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    if User.query.filter(
        (User.username == username) | (User.email == email)
    ).first():
        return jsonify({"error": "Username or email is already taken"}), 409

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    db.session.flush()  # populate user.id before creating the role row

    role_record = UserRole(user_id=user.id, role=RoleName.user)
    db.session.add(role_record)
    db.session.commit()

    send_welcome_email(user.email, user.username)

    claims = {"role": RoleName.user.value}
    response = jsonify({"user": user.to_dict()})
    set_access_cookies(response, create_access_token(identity=str(user.id), additional_claims=claims))
    set_refresh_cookies(response, create_refresh_token(identity=str(user.id)))
    return response, 201


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute; 50 per hour")
def login():
    data       = request.get_json(silent=True) or {}
    identifier = (data.get("identifier") or "").strip()
    password   = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"error": "Credentials required"}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    if user.is_banned:
        return jsonify({
            "error": f"Your account has been suspended. Reason: {user.ban_reason}. Please contact the support team for assistance.",
        }), 403

    role = user.user_role.role.value if user.user_role else "user"
    claims = {"role": role}
    response = jsonify({"user": user.to_dict()})
    set_access_cookies(response, create_access_token(identity=str(user.id), additional_claims=claims))
    set_refresh_cookies(response, create_refresh_token(identity=str(user.id)))
    return response


@auth_bp.route("/logout", methods=["POST"])
@jwt_required(optional=True)
def logout():
    response = jsonify({"message": "Logged out"})

    access_claims = get_jwt()
    if access_claims:
        db.session.add(TokenBlocklist(jti=access_claims["jti"]))

    refresh_cookie = request.cookies.get(current_app.config["JWT_REFRESH_COOKIE_NAME"])
    if refresh_cookie:
        try:
            refresh_claims = decode_token(refresh_cookie)
            db.session.add(TokenBlocklist(jti=refresh_claims["jti"]))
        except Exception as exc:  # noqa: BLE001 — refresh cookie may be malformed/expired; logout must still succeed
            current_app.logger.debug("Could not blocklist refresh token on logout: %s", exc)

    db.session.commit()
    unset_jwt_cookies(response)
    return response


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = db.get_or_404(User, int(get_jwt_identity()))
    return jsonify({"user": user.to_dict()})


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user = db.get_or_404(User, int(get_jwt_identity()))
    role = user.user_role.role.value if user.user_role else "user"
    claims = {"role": role}
    response = jsonify({"user": user.to_dict()})
    set_access_cookies(response, create_access_token(identity=str(user.id), additional_claims=claims))
    return response
