from backend.extensions import db


class UserRole(db.Model):
    """
    Represents a user's role in the system.

    Attributes:
        id (str): The unique identifier for the user's role. 1-to-1 relationship with User.
        role (str): The user's role (e.g., "User", "Admin", "Moderator").
        created_at (datetime): The timestamp when the role was created.
    """

    __tablename__ = "user_roles"

    id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role = db.Column(db.String(50), default="User", nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
