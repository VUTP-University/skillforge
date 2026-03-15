from ..extensions import db
import uuid


class Quest(db.Model):
    __tablename__ = "coding_quests"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    language = db.Column(db.String(50), nullable=False)
    difficulty = db.Column(db.String(50), nullable=False)
    quest_name = db.Column(db.String(255), nullable=False)
    solved_times = db.Column(db.Integer, default=0, nullable=True)
    quest_author = db.Column(db.String(255), nullable=False)
    created_at = db.Column(
        db.DateTime, default=db.func.current_timestamp(), nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
        nullable=False,
    )
    condition = db.Column(db.Text, nullable=False)
    function_template = db.Column(db.Text, nullable=False)

    # Quest inputs, where input_0 is the null test
    input_0 = db.Column(db.Text, nullable=False)  # Input for the quest
    input_1 = db.Column(db.Text, nullable=True)  # Input for the quest
    input_2 = db.Column(db.Text, nullable=True)  # Input for the quest
    input_3 = db.Column(db.Text, nullable=True)  # Input for the quest
    input_4 = db.Column(db.Text, nullable=True)  # Input for the quest
    input_5 = db.Column(db.Text, nullable=True)  # Input for the quest
    input_6 = db.Column(db.Text, nullable=True)  # Input for the quest
    input_7 = db.Column(db.Text, nullable=True)  # Input for the quest
    input_8 = db.Column(db.Text, nullable=True)  # Input for the quest
    input_9 = db.Column(db.Text, nullable=True)  # Input for the quest

    # Quest outputs, where output_0 is the null test
    output_0 = db.Column(db.Text, nullable=False)  # Output for the quest
    output_1 = db.Column(db.Text, nullable=True)  # Output for the quest
    output_2 = db.Column(db.Text, nullable=True)  # Output for the quest
    output_3 = db.Column(db.Text, nullable=True)  # Output for the quest
    output_4 = db.Column(db.Text, nullable=True)  # Output for the quest
    output_5 = db.Column(db.Text, nullable=True)  # Output for the quest
    output_6 = db.Column(db.Text, nullable=True)  # Output for the quest
    output_7 = db.Column(db.Text, nullable=True)  # Output for the quest
    output_8 = db.Column(db.Text, nullable=True)  # Output for the quest
    output_9 = db.Column(db.Text, nullable=True)  # Output for the quest

    example_solution = db.Column(
        db.Text, nullable=True
    )  # Example solution for the quest
