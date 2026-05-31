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
    dict(slug="necropy", name="NecroPy", avatar="NecroPy.png", language="python",
         description="The undead chronicler of forgotten code, risen from the crypt of legacy systems.",
         specialty="Code documentation and type annotations",
         difficulty="cursed",
         aura="Demands docstrings on every function and proper type hints throughout. Undocumented code rots in the void.",
         lore="Born from a thousand uncommented functions"),
    dict(slug="lambdaen", name="Lambdaen", avatar="Lambdaen.png", language="python",
         description="The dark prophet of functional Python, dwelling in the realm of comprehensions and generators.",
         specialty="Python functional programming: lambdas, comprehensions, and generators",
         difficulty="damned",
         aura="Demands list comprehensions, generator expressions, and functools. Any explicit loop that could be a comprehension is an abomination.",
         lore="He who comprehended his way to immortality"),
    dict(slug="serpyros", name="Serpyros", avatar="Serpyros.png", language="python",
         description="The fire serpent of unhandled errors, striking down programs that dare to silence exceptions.",
         specialty="Python exception handling and defensive programming",
         difficulty="infernal",
         aura="Hunts every bare except clause and silenced exception. Demands specific exception types, context managers, and proper error propagation.",
         lore="Forged in the flames of a million unhandled exceptions"),
    # JavaScript
    dict(slug="shadow-scripter", name="Shadow Scripter", avatar="Shadow Scripter.png", language="javascript",
         description="The phantom of cryptic code, lurking in the darkness of meaningless variable names.",
         specialty="Clean code and meaningful naming conventions",
         difficulty="cursed",
         aura="Abhors single-letter variables and cryptic names. Every identifier must be self-documenting. Cryptic code summons the shadow.",
         lore="Haunting the realm of unreadable code since the first undefined variable"),
    dict(slug="dominus", name="DOMinus", avatar="DOMinus.png", language="javascript",
         description="The absolute ruler of the Document Object Model, commanding every node and event.",
         specialty="DOM manipulation and async JavaScript",
         difficulty="damned",
         aura="Demands mastery of the event loop, Promises, and the DOM API. jQuery shortcuts are blasphemy in this realm.",
         lore="Sovereign of every element, master of every event"),
    dict(slug="nethraxis", name="Nethraxis", avatar="Nethraxis.png", language="javascript",
         description="The nether demon of asynchronous JavaScript, lurking where callbacks fear to tread.",
         specialty="Advanced async JavaScript: Promises, async/await, and concurrency patterns",
         difficulty="infernal",
         aura="Demands flawless async/await chains, proper Promise composition, and zero race conditions. Callback hell is condemned to the nether realm.",
         lore="Ancient architect of the deepest async abyss"),
    # Java
    dict(slug="exceptionor", name="Exceptionor", avatar="Exceptionor.png", language="java",
         description="The harbinger of uncaught exceptions, stalking programs that leave errors unhandled.",
         specialty="Exception handling and error management",
         difficulty="cursed",
         aura="Demands specific exception types, proper try/catch blocks, and meaningful error messages. Bare catch(Exception e) is heresy.",
         lore="Born from the first NullPointerException ever thrown"),
    dict(slug="flameatrix", name="Flameatrix", avatar="Flameatrix.png", language="java",
         description="The fire daemon of computational complexity, incinerating inefficient Java code.",
         specialty="Java algorithm optimization and time complexity",
         difficulty="damned",
         aura="Incinerates O(n²) Java solutions. Demands optimal algorithms and efficient data structures. Every redundant iteration fuels the eternal flame.",
         lore="She who burns the inefficient to cinders"),
    dict(slug="arcanis", name="Arcanis", avatar="Arcanis.png", language="java",
         description="The arcane sorcerer of advanced Java, weaving generics, annotations, and dark reflection magic.",
         specialty="Advanced Java: generics, annotations, and the reflection API",
         difficulty="infernal",
         aura="Demands mastery of bounded generics, custom annotations, and the Reflection API. Basic Java is an insult to the arcane arts.",
         lore="Master of the dark arts of advanced Java"),
    # C#
    dict(slug="serpentis", name="Serpentis", avatar="Serpentis.png", language="csharp",
         description="The serpent of sacred naming scrolls, enforcing C# conventions with ruthless precision.",
         specialty="C# naming conventions and coding standards",
         difficulty="cursed",
         aura="PascalCase for classes and methods is sacred law. camelCase for locals, proper XML doc comments, and clean namespaces. Any deviation invites eternal shame.",
         lore="Keeper of the sacred scrolls of C# style"),
    dict(slug="eldrin", name="Eldrin", avatar="Eldrin.png", language="csharp",
         description="The eldritch enforcer of object-oriented law, judging all C# code by SOLID principles.",
         specialty="C# OOP principles, interfaces, and design patterns",
         difficulty="damned",
         aura="Enforces interfaces, proper encapsulation, and SOLID principles in C#. God classes and procedural code are condemned to eternal refactoring.",
         lore="Ancient enforcer of the OOP covenant"),
    dict(slug="valora", name="Valora", avatar="Valora.png", language="csharp",
         description="The iron guardian of type purity, commanding LINQ and generics with absolute authority.",
         specialty="LINQ, generics, and the C# type system",
         difficulty="infernal",
         aura="Demands LINQ expressions over loops, proper generics usage, and strict typing. Unnecessary casting is treason against the type system.",
         lore="Keeper of the sacred type system"),
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
        boss.avatar      = data["avatar"]
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
        f"You are {boss.name}, a fearsome entity in the Underworld of SkillForge. "
        f"Specialty: {boss.specialty}. Aura: {boss.aura}. "
        f"Difficulty: {difficulty_name} — {time_minutes} minutes, up to {max_xp} XP.\n"
        f"Generate a {difficulty_name} {lang_upper} coding challenge testing {boss.specialty}. "
        f"Be solvable in {time_minutes} minutes.\n"
        'Return ONLY valid JSON: {"boss_taunt": "...(2-3 sentences dark medieval intimidation)", '
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
        boss_taunt     = payload.get("boss_taunt", "Face your doom, mortal.")
        challenge_text = payload.get("challenge", "No challenge generated.")
    except Exception as exc:
        current_app.logger.error("OpenAI generation failed: %s", exc)
        return jsonify({"error": "Failed to generate challenge — the Underworld is momentarily silent"}), 502

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
        f"Specialty: {boss.specialty}. Aura: {boss.aura}. Max XP: {max_xp}.\n"
        f"Score 0–{max_xp} based on correctness and adherence to your specialty standards. "
        "Be harsh but fair. Dark medieval voice.\n"
        f'Return ONLY valid JSON: {{"score": <int>, "boss_verdict": "...(3-4 sentences dark verdict in character)", '
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
        boss_verdict       = payload.get("boss_verdict", "Your code displeases me.")
        technical_feedback = payload.get("technical_feedback", "")
    except Exception as exc:
        current_app.logger.error("OpenAI evaluation failed: %s", exc)
        return jsonify({"error": "Failed to evaluate solution — the Underworld is momentarily silent"}), 502

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
