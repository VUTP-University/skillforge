from extensions import db


class UserStats(db.Model):
    """
    Represents a user's statistics.

    Attributes:
        id (str): The unique identifier for the user's statistics. 1-to-1 relationship with User.
        xp (int): The user's experience points.
        level (int): The user's level.
        rank (str): The user's rank.
        updated_at (datetime): The timestamp of the last update to the user's stats.
    """

    __tablename__ = "user_stats"

    id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    xp = db.Column(db.Integer, default=0, nullable=False)
    level = db.Column(db.Integer, default=1, nullable=False)
    rank = db.Column(db.String(30), default="Novice", nullable=False)
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )
