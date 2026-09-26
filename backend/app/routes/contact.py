from flask import Blueprint, jsonify, request

from app import limiter
from app.mailer import send_contact_email

contact_bp = Blueprint("contact", __name__)

MAX_NAME_LEN    = 100
MAX_MESSAGE_LEN = 5000


def _valid_email(email: str) -> bool:
    return bool(email) and "@" in email and "." in email.split("@")[-1]


def _single_line(value: str) -> bool:
    """Reject header-injection attempts — name/email are interpolated into
    the Subject/Reply-To headers, so a newline could smuggle extra headers."""
    return "\n" not in value and "\r" not in value


@contact_bp.post("/")
@limiter.limit("5 per hour")
def send_message():
    data    = request.get_json(silent=True) or {}
    name    = (data.get("name") or "").strip()
    email   = (data.get("email") or "").strip().lower()
    message = (data.get("message") or "").strip()

    if not name or not email or not message:
        return jsonify({"error": "Name, email, and message are required"}), 400
    if not _single_line(name) or not _single_line(email):
        return jsonify({"error": "Invalid name or email"}), 400
    if not _valid_email(email):
        return jsonify({"error": "Invalid email address"}), 400
    if len(name) > MAX_NAME_LEN:
        return jsonify({"error": f"Name cannot exceed {MAX_NAME_LEN} characters"}), 400
    if len(message) > MAX_MESSAGE_LEN:
        return jsonify({"error": f"Message cannot exceed {MAX_MESSAGE_LEN} characters"}), 400

    send_contact_email(name, email, message)

    return jsonify({"message": "Your message has been sent — we'll get back to you soon."})
