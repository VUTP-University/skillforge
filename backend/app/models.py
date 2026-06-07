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
    submissions = db.relationship(
        "QuestSubmission", back_populates="user", cascade="all, delete-orphan"
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


class QuestComment(db.Model):
    __tablename__ = "quest_comments"

    id         = db.Column(db.Integer, primary_key=True)
    quest_id   = db.Column(
        db.Integer,
        db.ForeignKey("quests.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id    = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content    = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    quest = db.relationship("Quest")
    user  = db.relationship("User")

    def to_dict(self):
        return {
            "id":         self.id,
            "quest_id":   self.quest_id,
            "user_id":    self.user_id,
            "username":   self.user.username,
            "avatar_url": f"/api/media/avatars/{self.user.avatar}" if self.user.avatar else None,
            "content":    self.content,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<QuestComment {self.id} quest={self.quest_id} user={self.user_id}>"


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


class QuestSubmission(db.Model):
    """Every code run a user submits, whether it passes or fails."""
    __tablename__ = "quest_submissions"

    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quest_id      = db.Column(
        db.Integer,
        db.ForeignKey("quests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    solution_code = db.Column(db.Text, nullable=False)
    test_results  = db.Column(db.JSON, nullable=True)
    all_passed    = db.Column(db.Boolean, nullable=False, default=False)
    submitted_at  = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    user  = db.relationship("User", back_populates="submissions")
    quest = db.relationship("Quest")

    def __repr__(self):
        return f"<QuestSubmission user={self.user_id} quest={self.quest_id} passed={self.all_passed}>"


# ── Trivia ──────────────────────────────────────────────────────────────────


class TriviaSessionStatus(enum.Enum):
    active    = "active"
    completed = "completed"
    expired   = "expired"


class TriviaSession(db.Model):
    __tablename__ = "trivia_sessions"

    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    language      = db.Column(db.String(20), nullable=False)
    status        = db.Column(
        db.Enum(TriviaSessionStatus),
        nullable=False,
        default=TriviaSessionStatus.active,
    )
    questions     = db.Column(db.JSON, nullable=False)
    score_xp      = db.Column(db.Integer, default=0, nullable=False)
    correct_count = db.Column(db.Integer, default=0, nullable=False)
    started_at    = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at    = db.Column(db.DateTime, nullable=False)
    completed_at  = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User")

    def to_dict(self):
        return {
            "id":              self.id,
            "language":        self.language,
            "status":          self.status.value,
            "score_xp":        self.score_xp,
            "correct_count":   self.correct_count,
            "total_questions": len(self.questions) if self.questions else 0,
            "started_at":      self.started_at.isoformat(),
            "expires_at":      self.expires_at.isoformat(),
            "completed_at":    self.completed_at.isoformat() if self.completed_at else None,
        }

    def __repr__(self):
        return f"<TriviaSession {self.id} user={self.user_id} lang={self.language}>"


# ── Underworld ──────────────────────────────────────────────────────────────


class BossDifficulty(enum.Enum):
    cursed   = "cursed"
    damned   = "damned"
    infernal = "infernal"


class ChallengeStatus(enum.Enum):
    active    = "active"
    completed = "completed"
    failed    = "failed"


BOSS_DIFFICULTY_CONFIG = {
    BossDifficulty.cursed:   {"minutes": 5,  "max_xp": 30},
    BossDifficulty.damned:   {"minutes": 10, "max_xp": 60},
    BossDifficulty.infernal: {"minutes": 15, "max_xp": 100},
}


class Boss(db.Model):
    __tablename__ = "bosses"

    id          = db.Column(db.Integer, primary_key=True)
    slug        = db.Column(db.String(80),  unique=True, nullable=False)
    name        = db.Column(db.String(120), nullable=False)
    avatar      = db.Column(db.String(200), nullable=False)
    language    = db.Column(db.String(20),  nullable=False)   # plain string: python / javascript / java / csharp
    description = db.Column(db.Text, nullable=False)
    specialty   = db.Column(db.String(200), nullable=False)
    difficulty  = db.Column(db.Enum(BossDifficulty), nullable=False)
    aura        = db.Column(db.Text, nullable=False)
    lore        = db.Column(db.String(200), nullable=False)

    challenges  = db.relationship("BossChallenge", back_populates="boss", cascade="all, delete-orphan")

    def to_dict(self):
        cfg = BOSS_DIFFICULTY_CONFIG[self.difficulty]
        return {
            "id":          self.id,
            "slug":        self.slug,
            "name":        self.name,
            "avatar":      self.avatar,
            "language":    self.language,
            "description": self.description,
            "specialty":   self.specialty,
            "difficulty":  self.difficulty.value,
            "aura":        self.aura,
            "lore":        self.lore,
            "time_minutes": cfg["minutes"],
            "max_xp":      cfg["max_xp"],
        }

    def __repr__(self):
        return f"<Boss {self.slug}>"


class BossChallenge(db.Model):
    __tablename__ = "boss_challenges"

    id                 = db.Column(db.Integer, primary_key=True)
    user_id            = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    boss_id            = db.Column(
        db.Integer,
        db.ForeignKey("bosses.id", ondelete="CASCADE"),
        nullable=False,
    )
    challenge_text     = db.Column(db.Text, nullable=False)
    boss_taunt         = db.Column(db.Text, nullable=False)
    user_solution      = db.Column(db.Text, nullable=True)
    boss_verdict       = db.Column(db.Text, nullable=True)
    technical_feedback = db.Column(db.Text, nullable=True)
    xp_earned          = db.Column(db.Integer, default=0,  nullable=False)
    score_pct          = db.Column(db.Integer, default=0,  nullable=False)
    status             = db.Column(db.Enum(ChallengeStatus), nullable=False, default=ChallengeStatus.active)
    started_at         = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    submitted_at       = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User")
    boss = db.relationship("Boss", back_populates="challenges")

    def to_dict(self):
        return {
            "id":                 self.id,
            "user_id":            self.user_id,
            "boss_id":            self.boss_id,
            "challenge_text":     self.challenge_text,
            "boss_taunt":         self.boss_taunt,
            "user_solution":      self.user_solution,
            "boss_verdict":       self.boss_verdict,
            "technical_feedback": self.technical_feedback,
            "xp_earned":          self.xp_earned,
            "score_pct":          self.score_pct,
            "status":             self.status.value,
            "started_at":         self.started_at.isoformat(),
            "submitted_at":       self.submitted_at.isoformat() if self.submitted_at else None,
        }

    def __repr__(self):
        return f"<BossChallenge {self.id} user={self.user_id} boss={self.boss_id}>"
