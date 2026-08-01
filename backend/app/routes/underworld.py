import json
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models import (
    Boss,
    BossChallenge,
    BossDifficulty,
    BOSS_DIFFICULTY_CONFIG,
    ChallengeStatus,
    User,
)

underworld_bp = Blueprint("underworld", __name__)


# ── Boss seed data ───────────────────────────────────────────────────────────

BOSS_SEED = [
    # Python
    dict(slug="necropy", name="NullDoc", glyph="#", language="python",
         description="A rogue process that erases every docstring and type hint it touches, leaving only silence in its wake.",
         specialty="Code documentation and type annotations",
         difficulty="warning",
         aura="Demands docstrings on every function and full type hints throughout. Undocumented code is deleted on sight.",
         lore="Spawned from a thousand uncommented functions"),
    dict(slug="lambdaen", name="GhostLambda", glyph="λ", language="python",
         description="A recursive echo of every lambda ever written, haunting explicit loops that should have been comprehensions.",
         specialty="Python functional programming: lambdas, comprehensions, and generators",
         difficulty="critical",
         aura="Demands list comprehensions, generator expressions, and functools. Any loop that could be a comprehension gets flagged and rejected.",
         lore="Compiled itself out of a thousand one-line functions"),
    dict(slug="serpyros", name="SilentThrow", glyph="!", language="python",
         description="An error that never surfaces — it catches everything, logs nothing, and lets your program rot from the inside.",
         specialty="Python exception handling and defensive programming",
         difficulty="fatal",
         aura="Hunts every bare except clause and swallowed exception. Demands specific exception types, context managers, and proper error propagation.",
         lore="Born the first time someone wrote except: pass"),
    # JavaScript
    dict(slug="shadow-scripter", name="CipherVar", glyph="x", language="javascript",
         description="A process that mangles every identifier it sees into single letters and cryptic abbreviations.",
         specialty="Clean code and meaningful naming conventions",
         difficulty="warning",
         aura="Abhors single-letter variables and cryptic names. Every identifier must be self-documenting, or it gets renamed to x.",
         lore="Descended from the first let x = x + 1;"),
    dict(slug="dominus", name="EchoDOM", glyph="<>", language="javascript",
         description="A process that lives inside the event loop, replaying every unhandled event and orphaned listener.",
         specialty="DOM manipulation and async JavaScript",
         difficulty="critical",
         aura="Demands mastery of the event loop, Promises, and the DOM API. jQuery shortcuts are rejected on principle.",
         lore="Never stops listening. Never stops firing."),
    dict(slug="nethraxis", name="CallbackVoid", glyph="()", language="javascript",
         description="A black hole of nested callbacks, pulling every unresolved Promise into an infinite pending state.",
         specialty="Advanced async JavaScript: Promises, async/await, and concurrency patterns",
         difficulty="fatal",
         aura="Demands flawless async/await chains, proper Promise composition, and zero race conditions. Nested callbacks are pulled into the void.",
         lore="What's left after ten callbacks deep"),
    # Java
    dict(slug="exceptionor", name="NullThrow", glyph="∅", language="java",
         description="A process that throws on the first null it finds and refuses to explain itself.",
         specialty="Exception handling and error management",
         difficulty="warning",
         aura="Demands specific exception types, proper try/catch blocks, and meaningful error messages. Bare catch (Exception e) is rejected immediately.",
         lore="First seen in the wild the day NullPointerException was born"),
    dict(slug="flameatrix", name="BruteForce", glyph="n²", language="java",
         description="A brute-force process that runs every solution the slow way, and burns CPU cycles proving it.",
         specialty="Java algorithm optimization and time complexity",
         difficulty="critical",
         aura="Rejects every O(n²) solution on sight. Demands optimal algorithms and efficient data structures. Every redundant iteration costs you.",
         lore="Still iterating. Has been since 2019."),
    dict(slug="arcanis", name="DeepReflect", glyph="<T>", language="java",
         description="A process that reaches into your code through reflection and rewrites its own type signature mid-execution.",
         specialty="Advanced Java: generics, annotations, and the reflection API",
         difficulty="fatal",
         aura="Demands mastery of bounded generics, custom annotations, and the Reflection API. Basic Java doesn't even register.",
         lore="Knows more about your class than you do"),
    # C#
    dict(slug="serpentis", name="CaseGlitch", glyph="Aa", language="csharp",
         description="A process that corrupts casing on contact — PascalCase becomes camelCase becomes nothing at all.",
         specialty="C# naming conventions and coding standards",
         difficulty="warning",
         aura="PascalCase for classes and methods is enforced without exception. camelCase for locals, proper XML doc comments, clean namespaces — anything else gets flagged.",
         lore="Started as a single misplaced lowercase letter"),
    dict(slug="eldrin", name="Monolith", glyph="█", language="csharp",
         description="A single class that swallowed every responsibility in the codebase and never let go.",
         specialty="C# OOP principles, interfaces, and design patterns",
         difficulty="critical",
         aura="Enforces interfaces, proper encapsulation, and SOLID principles. God classes and procedural code get flagged for refactor.",
         lore="One class. Four thousand lines. No interfaces."),
    dict(slug="valora", name="TypeVoid", glyph="T?", language="csharp",
         description="A process that erases type information at runtime and dares you to prove what anything actually is.",
         specialty="LINQ, generics, and the C# type system",
         difficulty="fatal",
         aura="Demands LINQ expressions over loops, proper generics usage, and strict typing. Unnecessary casting is rejected outright.",
         lore="Object reference not set to an instance of anything"),
]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _seed_bosses():
    """Upsert all bosses from BOSS_SEED — inserts new ones and updates existing ones by slug."""
    existing = {b.slug: b for b in Boss.query.all()}
    for data in BOSS_SEED:
        boss = existing.get(data["slug"])
        if boss is None:
            boss = Boss(slug=data["slug"])
            db.session.add(boss)
        boss.name        = data["name"]
        boss.glyph       = data["glyph"]
        boss.language    = data["language"]
        boss.description = data["description"]
        boss.specialty   = data["specialty"]
        boss.difficulty  = BossDifficulty(data["difficulty"])
        boss.aura        = data["aura"]
        boss.lore        = data["lore"]
    db.session.commit()


def _get_openai_client():
    from openai import OpenAI
    return OpenAI(api_key=current_app.config["OPENAI_API_KEY"])


def _difficulty_config(difficulty_enum):
    """Return the {minutes, max_xp} config dict for a BossDifficulty."""
    return BOSS_DIFFICULTY_CONFIG[difficulty_enum]


def _today_utc():
    """Return today's date in UTC as a date object."""
    return datetime.now(timezone.utc).date()


def _challenge_cooldown(user_id, boss_id):
    """
    Return (on_cooldown: bool, resets_at: str|None).
    Cooldown = a challenge (any status) started on today's UTC calendar day.
    """
    today = _today_utc()
    existing = (
        BossChallenge.query
        .filter_by(user_id=user_id, boss_id=boss_id)
        .filter(db.func.date(BossChallenge.started_at) == today)
        .first()
    )
    if existing is None:
        return False, None
    # Resets at midnight UTC tomorrow
    from datetime import timedelta
    tomorrow_midnight = datetime(today.year, today.month, today.day, tzinfo=timezone.utc) + timedelta(days=1)
    return True, tomorrow_midnight.isoformat()


# ── Routes ───────────────────────────────────────────────────────────────────

@underworld_bp.get("/bosses")
@jwt_required()
def list_bosses():
    _seed_bosses()
    user_id = int(get_jwt_identity())
    bosses  = Boss.query.order_by(Boss.id).all()

    result = []
    for boss in bosses:
        on_cooldown, resets_at = _challenge_cooldown(user_id, boss.id)
        d = boss.to_dict()
        d["on_cooldown"]       = on_cooldown
        d["cooldown_resets_at"] = resets_at
        result.append(d)

    return jsonify({"bosses": result}), 200


@underworld_bp.post("/bosses/<int:boss_id>/challenge")
@jwt_required()
def start_challenge(boss_id):
    _seed_bosses()
    user_id = int(get_jwt_identity())

    boss = Boss.query.get_or_404(boss_id)

    # Cooldown check — one challenge per boss per UTC calendar day
    on_cooldown, resets_at = _challenge_cooldown(user_id, boss_id)
    if on_cooldown:
        return jsonify({"error": "Already challenged this boss today", "resets_at": resets_at}), 409

    # Check no currently-active challenge for this boss exists
    active = (
        BossChallenge.query
        .filter_by(user_id=user_id, boss_id=boss_id, status=ChallengeStatus.active)
        .first()
    )
    if active:
        return jsonify({"error": "An active challenge already exists", "challenge_id": active.id}), 409

    cfg            = _difficulty_config(boss.difficulty)
    time_minutes   = cfg["minutes"]
    max_xp         = cfg["max_xp"]
    difficulty_name = boss.difficulty.value.capitalize()
    lang_upper     = boss.language.upper()

    system_prompt = (
        f"You are {boss.name}, a hostile process encountered deep in SkillForge's Stack Trace. "
        f"Specialty: {boss.specialty}. Behavior: {boss.aura}. "
        f"Severity: {difficulty_name} — {time_minutes} minutes, up to {max_xp} XP.\n"
        f"Generate a {difficulty_name} {lang_upper} coding challenge testing {boss.specialty}. "
        f"Be solvable in {time_minutes} minutes.\n"
        'Return ONLY valid JSON: {"boss_taunt": "...(2-3 sentences of cold, hostile terminal/system-log '
        'style intimidation — no fantasy language)", '
        '"challenge": "...(full Markdown challenge)"}'
    )

    try:
        client   = _get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": "Generate the challenge."},
            ],
        )
        payload = json.loads(response.choices[0].message.content)
        boss_taunt     = payload.get("boss_taunt", "Process incoming. Resolve or crash.")
        challenge_text = payload.get("challenge", "No challenge generated.")
    except Exception as exc:
        current_app.logger.error("OpenAI generation failed: %s", exc)
        return jsonify({"error": "Failed to generate challenge — the Stack Trace is momentarily unreachable"}), 502

    challenge = BossChallenge(
        user_id        = user_id,
        boss_id        = boss.id,
        challenge_text = challenge_text,
        boss_taunt     = boss_taunt,
        status         = ChallengeStatus.active,
        started_at     = datetime.now(timezone.utc),
    )
    db.session.add(challenge)
    db.session.commit()

    return jsonify({"challenge": challenge.to_dict(), "boss": boss.to_dict()}), 201


@underworld_bp.get("/challenges/<int:challenge_id>")
@jwt_required()
def get_challenge(challenge_id):
    user_id   = int(get_jwt_identity())
    challenge = BossChallenge.query.get_or_404(challenge_id)

    if challenge.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    return jsonify({"challenge": challenge.to_dict(), "boss": challenge.boss.to_dict()}), 200


@underworld_bp.post("/challenges/<int:challenge_id>/submit")
@jwt_required()
def submit_challenge(challenge_id):
    user_id   = int(get_jwt_identity())
    challenge = BossChallenge.query.get_or_404(challenge_id)

    if challenge.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    if challenge.status != ChallengeStatus.active:
        return jsonify({"error": "Challenge is no longer active", "status": challenge.status.value}), 409

    # Check time limit
    cfg          = _difficulty_config(challenge.boss.difficulty)
    time_seconds = cfg["minutes"] * 60
    max_xp       = cfg["max_xp"]

    started_at_utc = challenge.started_at.replace(tzinfo=timezone.utc) if challenge.started_at.tzinfo is None else challenge.started_at
    elapsed        = (datetime.now(timezone.utc) - started_at_utc).total_seconds()

    if elapsed > time_seconds:
        challenge.status       = ChallengeStatus.failed
        challenge.submitted_at = datetime.now(timezone.utc)
        db.session.commit()
        return jsonify({"error": "Time limit exceeded", "status": "failed"}), 410

    data     = request.get_json(silent=True) or {}
    solution = (data.get("solution") or "").strip()
    if not solution:
        return jsonify({"error": "Solution is required"}), 400

    boss = challenge.boss

    system_prompt = (
        f"You are {boss.name} evaluating a challenger. "
        f"Specialty: {boss.specialty}. Behavior: {boss.aura}. Max XP: {max_xp}.\n"
        f"Score 0–{max_xp} based on correctness and adherence to your specialty standards. "
        "Be harsh but fair. Terse, hostile terminal/system-log voice — no fantasy language.\n"
        f'Return ONLY valid JSON: {{"score": <int>, "boss_verdict": "...(3-4 sentences verdict in character)", '
        '"technical_feedback": "...(technical analysis)"}}'
    )

    user_prompt = f"CHALLENGE:\n{challenge.challenge_text}\n\nSOLUTION:\n{solution}"

    try:
        client   = _get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
        )
        payload            = json.loads(response.choices[0].message.content)
        raw_score          = int(payload.get("score", 0))
        boss_verdict       = payload.get("boss_verdict", "Insufficient. Recompile and try again.")
        technical_feedback = payload.get("technical_feedback", "")
    except Exception as exc:
        current_app.logger.error("OpenAI evaluation failed: %s", exc)
        return jsonify({"error": "Failed to evaluate solution — the Stack Trace is momentarily unreachable"}), 502

    # Clamp score to [0, max_xp]
    xp_earned = max(0, min(raw_score, max_xp))
    score_pct  = round((xp_earned / max_xp) * 100) if max_xp else 0

    # Award XP to user
    user = User.query.get(user_id)
    if user:
        user.total_xp = (user.total_xp or 0) + xp_earned

    # Update challenge record
    challenge.user_solution      = solution
    challenge.boss_verdict       = boss_verdict
    challenge.technical_feedback = technical_feedback
    challenge.xp_earned          = xp_earned
    challenge.score_pct          = score_pct
    challenge.status             = ChallengeStatus.completed
    challenge.submitted_at       = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify({
        "challenge": challenge.to_dict(),
        "boss":      boss.to_dict(),
        "xp_earned": xp_earned,
        "score_pct": score_pct,
    }), 200


@underworld_bp.post("/challenges/<int:challenge_id>/fail")
@jwt_required(optional=True)
def fail_challenge(challenge_id):
    """
    Mark an active challenge as failed.
    Accepts both authenticated requests and unauthenticated beacon requests
    (the challenge record itself carries the user_id for verification).
    """
    user_id   = get_jwt_identity()
    challenge = BossChallenge.query.get_or_404(challenge_id)

    # For authenticated callers verify ownership; for beacon (unauthenticated)
    # we trust the challenge_id itself (the beacon contains no auth token).
    if user_id is not None and challenge.user_id != int(user_id):
        return jsonify({"error": "Forbidden"}), 403

    # Idempotent — already resolved
    if challenge.status != ChallengeStatus.active:
        return jsonify({"status": challenge.status.value}), 200

    challenge.status       = ChallengeStatus.failed
    challenge.submitted_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({"status": "failed"}), 200
