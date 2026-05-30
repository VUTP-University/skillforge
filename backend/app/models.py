import enum
from datetime import datetime, timezone
from app import db


class RoleName(enum.Enum):
    user      = "user"
    moderator = "moderator"
    admin     = "admin"


class Language(enum.Enum):
    python     = "python"
    javascript = "javascript"
    java       = "java"
    csharp     = "csharp"


class Difficulty(enum.Enum):
    shallow  = "shallow"    # 30 XP
    cryptic  = "cryptic"    # 60 XP
    abyssal  = "abyssal"    # 100 XP


XP_BY_DIFFICULTY = {
    Difficulty.shallow:  30,
    Difficulty.cryptic:  60,
    Difficulty.abyssal: 100,
}

_RANK_THRESHOLDS = [
    (41, "Grand Master"),
    (26, "Master"),
    (16, "Expert"),
    (8,  "Journeyman"),
    (4,  "Apprentice"),
    (1,  "Novice"),
]


class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80), unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False, default="")
    avatar        = db.Column(db.String(100), nullable=True)
    total_xp      = db.Column(db.Integer, default=0, nullable=False)
    created_at    = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user_role   = db.relationship(
        "UserRole", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    completions = db.relationship(
        "QuestCompletion", back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def level(self):
        return (self.total_xp or 0) // 100 + 1

    @property
    def rank(self):
        lvl = self.level
        for threshold, name in _RANK_THRESHOLDS:
            if lvl >= threshold:
                return name
        return "Novice"

    def to_dict(self):
        return {
            "id":         self.id,
            "username":   self.username,
            "email":      self.email,
            "role":       self.user_role.role.value if self.user_role else "user",
            "avatar_url": f"/api/media/avatars/{self.avatar}" if self.avatar else None,
            "total_xp":   self.total_xp or 0,
            "level":      self.level,
            "rank":       self.rank,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<User {self.username}>"


class UserRole(db.Model):
    __tablename__ = "user_roles"

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    role        = db.Column(db.Enum(RoleName), nullable=False, default=RoleName.user)
    assigned_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = db.relationship("User", back_populates="user_role")

    def __repr__(self):
        return f"<UserRole {self.user_id}:{self.role.value}>"


class Quest(db.Model):
    __tablename__ = "quests"

    id               = db.Column(db.Integer, primary_key=True)
    title            = db.Column(db.String(200), nullable=False)
    description      = db.Column(db.Text, nullable=False)
    example_solution = db.Column(db.Text, nullable=True)
    language         = db.Column(db.Enum(Language), nullable=False)
    difficulty       = db.Column(db.Enum(Difficulty), nullable=False)
    xp_reward        = db.Column(db.Integer, nullable=False)
    author_id        = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    author     = db.relationship("User", foreign_keys=[author_id])
    test_cases = db.relationship(
        "TestCase",
        back_populates="quest",
        cascade="all, delete-orphan",
        order_by="TestCase.index",
    )

    def to_dict(self, include_solution=False):
        data = {
            "id":          self.id,
            "title":       self.title,
            "description": self.description,
            "language":    self.language.value,
            "difficulty":  self.difficulty.value,
            "xp_reward":   self.xp_reward,
            "author":      self.author.username if self.author else None,
            "author_id":   self.author_id,
            "created_at":  self.created_at.isoformat(),
            "updated_at":  self.updated_at.isoformat(),
            "test_cases":  [tc.to_dict() for tc in self.test_cases],
        }
        if include_solution:
            data["example_solution"] = self.example_solution
        return data

    def __repr__(self):
        return f"<Quest {self.id}: {self.title}>"


class TestCase(db.Model):
    __tablename__ = "test_cases"

    id       = db.Column(db.Integer, primary_key=True)
    quest_id = db.Column(
        db.Integer,
        db.ForeignKey("quests.id", ondelete="CASCADE"),
        nullable=False,
    )
    index  = db.Column(db.Integer, nullable=False)   # 0 – 9
    input  = db.Column(db.Text, nullable=False)
    output = db.Column(db.Text, nullable=False)

    quest = db.relationship("Quest", back_populates="test_cases")

    __table_args__ = (
        db.UniqueConstraint("quest_id", "index", name="uq_quest_testcase_index"),
    )

    def to_dict(self):
        return {
            "index":  self.index,
            "input":  self.input,
            "output": self.output,
        }

    def __repr__(self):
        return f"<TestCase quest={self.quest_id} idx={self.index}>"


class QuestCompletion(db.Model):
    __tablename__ = "quest_completions"

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    quest_id     = db.Column(
        db.Integer,
        db.ForeignKey("quests.id", ondelete="CASCADE"),
        nullable=False,
    )
    xp_earned    = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user  = db.relationship("User", back_populates="completions")
    quest = db.relationship("Quest")

    __table_args__ = (
        db.UniqueConstraint("user_id", "quest_id", name="uq_user_quest_completion"),
    )

    def __repr__(self):
        return f"<QuestCompletion user={self.user_id} quest={self.quest_id}>"
