import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from backend.extensions import db
from backend.models.quest import Quest
from backend.models.user import User

quest_bp = Blueprint("quests", __name__)
logger = logging.getLogger(__name__)


def _require_admin():
    """Returns (user, error_response) — error_response is None if admin check passes."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user or not user.role or user.role.role != "Admin":
        return None, (jsonify({"error": "Admin access required"}), 403)
    return user, None


def _quest_to_dict(quest):
    author = quest.quest_author
    return {
        "id": quest.id,
        "language": quest.language,
        "difficulty": quest.difficulty,
        "quest_name": quest.quest_name,
        "quest_author_id": quest.quest_author_id,
        "quest_author_username": author.username if author else None,
        "status": quest.status,
        "condition": quest.condition,
        "function_template": quest.function_template,
        "example_solution": quest.example_solution,
        "solved_times": quest.solved_times,
        "created_at": quest.created_at.isoformat() if quest.created_at else None,
        "updated_at": quest.updated_at.isoformat() if quest.updated_at else None,
        **{f"input_{i}": getattr(quest, f"input_{i}") for i in range(10)},
        **{f"output_{i}": getattr(quest, f"output_{i}") for i in range(10)},
    }


@quest_bp.route("/quests", methods=["GET"])
@jwt_required()
def get_quests():
    language = request.args.get("language")
    query = Quest.query
    if language:
        query = query.filter_by(language=language)
    quests = query.all()
    return jsonify([_quest_to_dict(q) for q in quests]), 200


@quest_bp.route("/quests/<quest_id>", methods=["GET"])
@jwt_required()
def get_quest(quest_id):
    quest = db.session.get(Quest, quest_id)
    if not quest:
        return jsonify({"error": "Quest not found"}), 404
    return jsonify(_quest_to_dict(quest)), 200


@quest_bp.route("/quests", methods=["POST"])
@jwt_required()
def create_quest():
    _, err = _require_admin()
    if err:
        return err

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    required = ["language", "difficulty", "quest_name",
                "condition", "function_template", "input_0", "output_0"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    # quest_author_id comes from the payload; fall back to the token identity
    author_id = data.get("quest_author_id") or get_jwt_identity()

    quest = Quest(
        language=data["language"],
        difficulty=data["difficulty"],
        quest_name=data["quest_name"],
        quest_author_id=author_id,
        condition=data["condition"],
        function_template=data["function_template"],
        example_solution=data.get("example_solution"),
        status=data.get("status", "Active"),
        input_0=data["input_0"],
        output_0=data["output_0"],
    )

    for i in range(1, 10):
        setattr(quest, f"input_{i}", data.get(f"input_{i}") or None)
        setattr(quest, f"output_{i}", data.get(f"output_{i}") or None)

    db.session.add(quest)
    db.session.commit()
    logger.info("Quest created: %s by user %s", quest.id, author_id)
    return jsonify({"msg": "Quest created", "quest_id": quest.id}), 201


@quest_bp.route("/quests/<quest_id>", methods=["PUT"])
@jwt_required()
def update_quest(quest_id):
    _, err = _require_admin()
    if err:
        return err

    quest = db.session.get(Quest, quest_id)
    if not quest:
        return jsonify({"error": "Quest not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    updatable = [
        "language", "difficulty", "quest_name", "condition",
        "function_template", "example_solution", "status",
    ]
    for field in updatable:
        if field in data:
            setattr(quest, field, data[field])

    if "quest_author_id" in data:
        quest.quest_author_id = data["quest_author_id"] or None

    for i in range(10):
        if f"input_{i}" in data:
            setattr(quest, f"input_{i}", data[f"input_{i}"] or None)
        if f"output_{i}" in data:
            setattr(quest, f"output_{i}", data[f"output_{i}"] or None)

    db.session.commit()
    logger.info("Quest updated: %s", quest_id)
    return jsonify({"msg": "Quest updated", "quest_id": quest.id}), 200
