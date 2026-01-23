import string
import uuid

from extensions import db
from werkzeug.security import check_password_hash, generate_password_hash


class User(db.Model):
    """
    User model for the application. Stores user information such as email, password, and username.

    Attributes:
        id (str): Unique identifier for the user.
        email (str): Email address of the user.
        password (str): Hashed password of the user.
        username (str): Username of the user.
        created_at (datetime): Timestamp when the user was created.
        updated_at (datetime): Timestamp when the user was last updated.

    Relationships:
        stats (UserStats): One-to-one relationship with UserStats.
    """

    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )

    # ------------
    # User relationships
    # ------------
    stats = db.relationship(
        "UserStats", backref="user", uselist=False, cascade="all, delete-orphan"
    )

    def __init__(self, email, password, username):
        """
        Initialize a new user.

        Args:
            email (str): The user's email address.
            password (str): The user's password.
            username (str): The user's username.
        """
        self.email = email
        self.password = password
        self.username = username

    # ------------
    # Password hashing and verification methods
    # ------------
    @staticmethod
    def validate_password(password: str) -> None:
        """
        Validate the password according to the following rules:
        - Password cannot be empty
        - Password must be at least 8 characters long
        - Password must contain at least one uppercase letter
        - Password must contain at least one lowercase letter
        - Password must contain at least one digit
        - Password must contain at least one special character
        """

        if not password:
            raise ValueError("Password cannot be empty")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(char.isupper() for char in password):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(char.islower() for char in password):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(char.isdigit() for char in password):
            raise ValueError("Password must contain at least one digit")
        if not any(char in string.punctuation for char in password):
            raise ValueError("Password must contain at least one special character")

    def set_password(self, raw_password: str) -> None:
        """
        Validates and hashes the password.
        """
        self.validate_password(raw_password)
        self.password = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        """
        Checks if the provided password matches the stored password.
        """
        return check_password_hash(self.password, raw_password)
