import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models import TriviaSession, TriviaSessionStatus, User

trivia_bp = Blueprint("trivia", __name__)

# ── Constants ─────────────────────────────────────────────────────────────────

COOLDOWN_DAYS       = 7
DURATION_SECONDS    = 5 * 60   # 5 minutes
QUESTIONS_PER_MODE  = 20

_PICK = {"easy": 7, "medium": 8, "hard": 5}
_XP   = {"easy": 10, "medium": 20, "hard": 30}

VALID_LANGUAGES = {"python", "javascript", "java", "csharp", "mix"}

# ── Question pools (loaded once at import time) ───────────────────────────────

_TRIVIA_DIR = Path(__file__).parent.parent / "trivia"
_POOLS: dict[str, list] = {}


def _pool(lang: str) -> list:
    if lang not in _POOLS:
        path = _TRIVIA_DIR / f"{lang}_questions.json"
        with open(path, encoding="utf-8") as f:
            _POOLS[lang] = json.load(f)
    return _POOLS[lang]


def _build_pool(language: str) -> list:
    if language == "mix":
        combined = []
        for l in ("python", "javascript", "java", "csharp"):
            combined.extend(_pool(l))
        return combined
    return _pool(language)


def _pick_questions(pool: list) -> list:
    by_diff: dict[str, list] = {"easy": [], "medium": [], "hard": []}
    for q in pool:
        by_diff[q["difficulty"]].append(q)

    picked = []
    for diff, n in _PICK.items():
        bucket = by_diff[diff]
        picked.extend(random.sample(bucket, min(n, len(bucket))))

    random.shuffle(picked)
    return picked


def _prepare(q: dict) -> dict:
    """Shuffle options and record the new correct index for server-side storage."""
    options      = q["options"].copy()
    correct_text = options[q["correct"]]
    random.shuffle(options)
    return {
        "id":            q["id"],
        "difficulty":    q["difficulty"],
        "xp":            _XP[q["difficulty"]],
        "question":      q["question"],
        "options":       options,
        "correct_index": options.index(correct_text),
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _last_used_session(user_id: int) -> TriviaSession | None:
    cutoff = datetime.now(timezone.utc) - timedelta(days=COOLDOWN_DAYS)
    return (
        TriviaSession.query
        .filter(
            TriviaSession.user_id == user_id,
            TriviaSession.status.in_([TriviaSessionStatus.completed, TriviaSessionStatus.expired]),
            TriviaSession.started_at >= cutoff,
        )
        .order_by(TriviaSession.started_at.desc())
        .first()
    )


def _active_session(user_id: int) -> TriviaSession | None:
    now = datetime.now(timezone.utc)
    return (
        TriviaSession.query
        .filter(
            TriviaSession.user_id == user_id,
            TriviaSession.status == TriviaSessionStatus.active,
            TriviaSession.expires_at > now,
        )
        .order_by(TriviaSession.started_at.desc())
        .first()
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@trivia_bp.route("/status", methods=["GET"])
@jwt_required()
def get_status():
    user_id = int(get_jwt_identity())
    active  = _active_session(user_id)
    used    = _last_used_session(user_id)

    can_play = used is None and active is None

    payload = {"can_play": can_play}

    if active:
        payload["active_session"] = {
            **active.to_dict(),
            "questions": [_strip_correct(q) for q in active.questions],
        }
    elif used:
        next_at = used.started_at.replace(tzinfo=timezone.utc) + timedelta(days=COOLDOWN_DAYS)
        payload["next_available_at"] = next_at.isoformat()
        payload["last_session"] = used.to_dict()

    return jsonify(payload)


@trivia_bp.route("/start", methods=["POST"])
@jwt_required()
def start_trivia():
    user_id  = int(get_jwt_identity())
    data     = request.get_json(silent=True) or {}
    language = (data.get("language") or "").strip().lower()

    if language not in VALID_LANGUAGES:
        return jsonify({"error": f"Invalid language. Choose from: {', '.join(sorted(VALID_LANGUAGES))}"}), 400

    # Check for an existing active session — return it instead of creating a new one
    active = _active_session(user_id)
    if active:
        return jsonify({
            "session_id": active.id,
            "expires_at": active.expires_at.isoformat(),
            "questions":  [_strip_correct(q) for q in active.questions],
            "resumed":    True,
        })

    # Block if already played this week
    used = _last_used_session(user_id)
    if used:
        next_at = used.started_at.replace(tzinfo=timezone.utc) + timedelta(days=COOLDOWN_DAYS)
        return jsonify({
            "error":            "You have already completed your weekly run.",
            "next_available_at": next_at.isoformat(),
        }), 429

    pool       = _build_pool(language)
    questions  = [_prepare(q) for q in _pick_questions(pool)]
    now        = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=DURATION_SECONDS)

    session = TriviaSession(
        user_id    = user_id,
        language   = language,
        questions  = questions,
        started_at = now,
        expires_at = expires_at,
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        "session_id": session.id,
        "expires_at": session.expires_at.isoformat(),
        "questions":  [_strip_correct(q) for q in questions],
        "resumed":    False,
    }), 201


@trivia_bp.route("/<int:session_id>/submit", methods=["POST"])
@jwt_required()
def submit_trivia(session_id):
    user_id = int(get_jwt_identity())
    session = db.get_or_404(TriviaSession, session_id)

    if session.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    if session.status != TriviaSessionStatus.active:
        return jsonify({"error": "Session is no longer active"}), 409

    now = datetime.now(timezone.utc)

    # Mark expired if time ran out (client submitted late)
    timed_out = now > session.expires_at.replace(tzinfo=timezone.utc)

    data    = request.get_json(silent=True) or {}
    answers = data.get("answers", [])   # [{id, selected}]

    # Build lookup from submitted answers
    answer_map = {a["id"]: a["selected"] for a in answers if "id" in a and "selected" in a}

    results       = []
    total_xp      = 0
    correct_count = 0

    for q in session.questions:
        selected      = answer_map.get(q["id"])
        was_correct   = selected == q["correct_index"]
        xp            = q["xp"] if was_correct else 0
        total_xp     += xp
        if was_correct:
            correct_count += 1
        results.append({
            "id":            q["id"],
            "question":      q["question"],
            "options":       q["options"],
            "correct_index": q["correct_index"],
            "selected":      selected,
            "was_correct":   was_correct,
            "xp":            q["xp"],
            "xp_earned":     xp,
            "difficulty":    q["difficulty"],
        })

    # Award XP to user
    user = db.get_or_404(User, user_id)
    user.total_xp = (user.total_xp or 0) + total_xp

    session.status        = TriviaSessionStatus.expired if timed_out else TriviaSessionStatus.completed
    session.score_xp      = total_xp
    session.correct_count = correct_count
    session.completed_at  = now
    db.session.commit()

    return jsonify({
        "session":       session.to_dict(),
        "results":       results,
        "xp_earned":     total_xp,
        "correct_count": correct_count,
        "total":         len(session.questions),
        "timed_out":     timed_out,
    })


# ── Utility ───────────────────────────────────────────────────────────────────

def _strip_correct(q: dict) -> dict:
    return {k: v for k, v in q.items() if k != "correct_index"}
