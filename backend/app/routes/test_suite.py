import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.achievements import award_xp, check_achievements
from app.models import AchievementCategory, TestRun, TestRunStatus, User

test_suite_bp = Blueprint("test_suite", __name__)

# ── Constants ─────────────────────────────────────────────────────────────────

COOLDOWN_DAYS       = 7
DURATION_SECONDS    = 5 * 60   # 5 minutes
QUESTIONS_PER_MODE  = 20

_PICK = {"easy": 7, "medium": 8, "hard": 5}
_XP   = {"easy": 10, "medium": 20, "hard": 30}

VALID_LANGUAGES = {"python", "javascript", "java", "csharp", "mix"}

# ── Question pools (loaded once at import time) ───────────────────────────────

_QUESTIONS_DIR = Path(__file__).parent.parent / "test_suite_questions"
_POOLS: dict[str, list] = {}


def _pool(lang: str) -> list:
    if lang not in _POOLS:
        path = _QUESTIONS_DIR / f"{lang}_questions.json"
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

def _last_used_run(user_id: int) -> TestRun | None:
    cutoff = datetime.now(timezone.utc) - timedelta(days=COOLDOWN_DAYS)
    return (
        TestRun.query
        .filter(
            TestRun.user_id == user_id,
            TestRun.status.in_([TestRunStatus.completed, TestRunStatus.expired]),
            TestRun.started_at >= cutoff,
        )
        .order_by(TestRun.started_at.desc())
        .first()
    )


def _active_run(user_id: int) -> TestRun | None:
    now = datetime.now(timezone.utc)
    return (
        TestRun.query
        .filter(
            TestRun.user_id == user_id,
            TestRun.status == TestRunStatus.active,
            TestRun.expires_at > now,
        )
        .order_by(TestRun.started_at.desc())
        .first()
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@test_suite_bp.route("/status", methods=["GET"])
@jwt_required()
def get_status():
    user_id = int(get_jwt_identity())
    active  = _active_run(user_id)
    used    = _last_used_run(user_id)

    can_play = used is None and active is None

    payload = {"can_play": can_play}

    if active:
        payload["active_run"] = {
            **active.to_dict(),
            "questions": [_strip_correct(q) for q in active.questions],
        }
    elif used:
        next_at = used.started_at.replace(tzinfo=timezone.utc) + timedelta(days=COOLDOWN_DAYS)
        payload["next_available_at"] = next_at.isoformat()
        payload["last_run"] = used.to_dict()

    return jsonify(payload)


@test_suite_bp.route("/start", methods=["POST"])
@jwt_required()
def start_run():
    user_id  = int(get_jwt_identity())
    data     = request.get_json(silent=True) or {}
    language = (data.get("language") or "").strip().lower()

    if language not in VALID_LANGUAGES:
        return jsonify({"error": f"Invalid language. Choose from: {', '.join(sorted(VALID_LANGUAGES))}"}), 400

    # Check for an existing active run — return it instead of creating a new one
    active = _active_run(user_id)
    if active:
        return jsonify({
            "run_id":     active.id,
            "expires_at": active.expires_at.isoformat(),
            "questions":  [_strip_correct(q) for q in active.questions],
            "resumed":    True,
        })

    # Block if already played this week
    used = _last_used_run(user_id)
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

    run = TestRun(
        user_id    = user_id,
        language   = language,
        questions  = questions,
        started_at = now,
        expires_at = expires_at,
    )
    db.session.add(run)
    db.session.commit()

    return jsonify({
        "run_id":     run.id,
        "expires_at": run.expires_at.isoformat(),
        "questions":  [_strip_correct(q) for q in questions],
        "resumed":    False,
    }), 201


@test_suite_bp.route("/<int:run_id>/submit", methods=["POST"])
@jwt_required()
def submit_run(run_id):
    user_id = int(get_jwt_identity())
    run     = db.get_or_404(TestRun, run_id)

    if run.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    if run.status != TestRunStatus.active:
        return jsonify({"error": "Run is no longer active"}), 409

    now = datetime.now(timezone.utc)

    # Mark expired if time ran out (client submitted late)
    timed_out = now > run.expires_at.replace(tzinfo=timezone.utc)

    data    = request.get_json(silent=True) or {}
    answers = data.get("answers", [])   # [{id, selected}]

    # Build lookup from submitted answers
    answer_map = {a["id"]: a["selected"] for a in answers if "id" in a and "selected" in a}

    results       = []
    total_xp      = 0
    correct_count = 0

    for q in run.questions:
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
    award_xp(user, total_xp)

    run.status        = TestRunStatus.expired if timed_out else TestRunStatus.completed
    run.score_xp      = total_xp
    run.correct_count = correct_count
    run.completed_at  = now

    unlocked = check_achievements(user, categories=[AchievementCategory.test_suite, AchievementCategory.general])

    db.session.commit()

    return jsonify({
        "run":           run.to_dict(),
        "results":       results,
        "xp_earned":     total_xp,
        "correct_count": correct_count,
        "total":         len(run.questions),
        "timed_out":     timed_out,
        "achievements_unlocked": [a.slug for a in unlocked],
    })


# ── Utility ───────────────────────────────────────────────────────────────────

def _strip_correct(q: dict) -> dict:
    return {k: v for k, v in q.items() if k != "correct_index"}
