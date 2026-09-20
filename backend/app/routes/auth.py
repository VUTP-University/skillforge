import hashlib
import re
import secrets
import time
from datetime import datetime, timedelta, timezone

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
from app.mailer import send_password_reset_email, send_welcome_email
from app.models import PasswordResetToken, RoleName, TokenBlocklist, User, UserRole

auth_bp = Blueprint("auth", __name__)

USERNAME_RE = re.compile(r"^[a-zA-Z0-9_-]+$")
PASSWORD_RESET_TOKEN_TTL = timedelta(hours=1)
# Floor for forgot-password's response time — padding out the fast
# (email-not-found) path so it can't be distinguished from the slower
# (email-found: extra DB writes + email dispatch) path via timing.
MIN_FORGOT_PASSWORD_SECONDS = 0.3

# Computed once at import time so login() can hash-compare against *something*
# even when no matching user exists — otherwise a nonexistent identifier skips
# check_password_hash entirely and responds measurably faster, letting an
# attacker enumerate registered usernames/emails via timing.
_DUMMY_PASSWORD_HASH = generate_password_hash(secrets.token_urlsafe(32))


def _hash_reset_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def _valid_email(email: str) -> bool:
    return bool(email) and "@" in email and "." in email.split("@")[-1]


# The two JWT cookies (access/refresh, both HttpOnly) used to be set at
# Path=/ before they were scoped down to /api and /api/auth. Cookies are
# keyed by name *and* path, so narrowing the path left any browser with an
# existing session holding two copies of each cookie — the stale Path=/ one
# is never touched by set_access_cookies/set_refresh_cookies/unset_jwt_
# cookies, which only ever act on the currently configured path. Explicitly
# expire the old copies on every auth response so they clear out instead of
# lingering (and potentially shadowing the fresh one — browsers send the
# more specific path first, but naive server-side cookie parsing can end up
# preferring whichever one came last).
#
# The CSRF companion cookies are NOT included here: they're intentionally
# kept at Path=/ (JWT_ACCESS_CSRF_COOKIE_PATH / JWT_REFRESH_CSRF_COOKIE_PATH
# in config.py) so frontend JS can read them from any page of the SPA, not
# just pages under /api. Deleting "the Path=/ copy" of those would delete
# the only copy that's ever actually set.
_LEGACY_COOKIE_PATH = "/"


def _clear_legacy_root_cookies(response):
    cfg = current_app.config
    names = [
        cfg.get("JWT_ACCESS_COOKIE_NAME", "access_token_cookie"),
        cfg.get("JWT_REFRESH_COOKIE_NAME", "refresh_token_cookie"),
    ]
    for name in names:
        response.delete_cookie(name, path=_LEGACY_COOKIE_PATH)


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
    if not USERNAME_RE.match(username):
        return jsonify({"error": "Username may only contain letters, numbers, underscores, and hyphens"}), 400
    if not _valid_email(email):
        return jsonify({"error": "Invalid email address"}), 400
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
    _clear_legacy_root_cookies(response)
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

    # Always run the hash comparison, even against a dummy hash when no user
    # matches, so response time doesn't reveal whether the identifier exists.
    password_valid = check_password_hash(user.password_hash if user else _DUMMY_PASSWORD_HASH, password)
    if not user or not password_valid:
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
    _clear_legacy_root_cookies(response)
    return response


@auth_bp.route("/logout", methods=["POST"])
@jwt_required(optional=True)
def logout():
    response = jsonify({"message": "Logged out"})

    # Opportunistic cleanup — anything older than the longest-lived token type
    # (the refresh token) is guaranteed to have already expired on its own,
    # so it's safe to drop regardless of which token it was for. Keeps this
    # table from growing forever without needing a separate scheduled job.
    stale_cutoff = datetime.now(timezone.utc) - current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]
    TokenBlocklist.query.filter(TokenBlocklist.created_at < stale_cutoff).delete()

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
    _clear_legacy_root_cookies(response)
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
    _clear_legacy_root_cookies(response)
    return response


@auth_bp.route("/forgot-password", methods=["POST"])
@limiter.limit("5 per hour")
def forgot_password():
    started_at = time.monotonic()
    data  = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    # Always return the same response whether or not the email is registered
    # — a differing response would let an attacker enumerate accounts.
    generic_response = jsonify({"message": "If that email is registered, a reset link has been sent."})

    if email:
        user = User.query.filter(User.email == email).first()
        if user:
            # Invalidate any outstanding links before issuing a new one.
            PasswordResetToken.query.filter_by(user_id=user.id, used_at=None).update({"used_at": datetime.now(timezone.utc)})

            raw_token = secrets.token_urlsafe(32)
            db.session.add(PasswordResetToken(
                user_id=user.id,
                token_hash=_hash_reset_token(raw_token),
                expires_at=datetime.now(timezone.utc) + PASSWORD_RESET_TOKEN_TTL,
            ))
            db.session.commit()

            reset_url = f"{current_app.config['FRONTEND_ORIGIN']}/reset-password?token={raw_token}"
            send_password_reset_email(user.email, user.username, reset_url)

    # Pad the response to a fixed minimum duration so an attacker can't tell
    # a registered email (extra DB writes above) from an unregistered one
    # (none of that work) by measuring response time.
    remaining = MIN_FORGOT_PASSWORD_SECONDS - (time.monotonic() - started_at)
    if remaining > 0:
        time.sleep(remaining)

    return generic_response


@auth_bp.route("/password", methods=["PATCH"])
@limiter.limit("10 per hour")
def reset_password():
    data     = request.get_json(silent=True) or {}
    token    = data.get("token") or ""
    password = data.get("password") or ""

    if not token or not password:
        return jsonify({"error": "Token and new password are required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    reset_token = PasswordResetToken.query.filter_by(token_hash=_hash_reset_token(token)).first()
    if reset_token:
        expires_at = reset_token.expires_at.replace(tzinfo=timezone.utc) if reset_token.expires_at.tzinfo is None else reset_token.expires_at
    if (
        not reset_token
        or reset_token.used_at is not None
        or expires_at < datetime.now(timezone.utc)
    ):
        return jsonify({"error": "This reset link is invalid or has expired"}), 400

    user = db.session.get(User, reset_token.user_id)
    user.password_hash = generate_password_hash(password)
    # Any token issued before now is treated as revoked (see
    # check_if_token_revoked) so a hijacked session doesn't survive the reset.
    user.password_changed_at = datetime.now(timezone.utc)
    reset_token.used_at = datetime.now(timezone.utc)
    # Invalidate any other outstanding links for this user.
    PasswordResetToken.query.filter_by(user_id=user.id, used_at=None).update({"used_at": datetime.now(timezone.utc)})
    db.session.commit()

    return jsonify({"message": "Password updated. You can now sign in with your new password."})
