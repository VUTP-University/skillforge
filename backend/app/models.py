import enum
import math
import secrets
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


class JobDifficulty(enum.Enum):
    junior = "junior"    # 30 XP
    mid    = "mid"       # 60 XP
    senior = "senior"    # 100 XP


XP_BY_JOB_DIFFICULTY = {
    JobDifficulty.junior:  30,
    JobDifficulty.mid:     60,
    JobDifficulty.senior: 100,
}

# Minimum total XP required to reach each level (1-100).
# Index 0 → level 1 (starts at 0 XP), index 99 → level 100 (~98 k XP).
# Formula: floor(50 * (level - 1) ** 1.65) — fast early levels, slows at the top.
LEVEL_XP_TABLE: tuple[int, ...] = tuple(
    0 if lvl == 1 else math.floor(50 * (lvl - 1) ** 1.65)
    for lvl in range(1, 101)
)

# 20 ranks, one per 5 levels, listed highest-first for the scan below.
_RANK_THRESHOLDS = [
    (96, "0-Day"),
    (91, "Root"),
    (86, "Sudoer"),
    (81, "Superuser"),
    (76, "Exploit Dev"),
    (71, "Daemon"),
    (66, "Sysadmin"),
    (61, "Sentinel"),
    (56, "Toolsmith"),
    (51, "Optimizer"),
    (46, "Architect"),
    (41, "Refactorer"),
    (36, "Maintainer"),
    (31, "Contributor"),
    (26, "Committer"),
    (21, "Debugger"),
    (16, "Coder"),
    (11, "Script Kid"),
    (6,  "Bootstrap"),
    (1,  "Guest"),
]


def level_from_xp(total_xp: int) -> int:
    xp = total_xp or 0
    for lvl in range(100, 0, -1):
        if xp >= LEVEL_XP_TABLE[lvl - 1]:
            return lvl
    return 1


def xp_progress(total_xp: int) -> dict:
    lvl   = level_from_xp(total_xp)
    xp    = total_xp or 0
    floor = LEVEL_XP_TABLE[lvl - 1]
    if lvl < 100:
        ceiling     = LEVEL_XP_TABLE[lvl]
        xp_into     = xp - floor
        xp_range    = ceiling - floor
        progress_pct = round(xp_into / xp_range * 100) if xp_range else 100
    else:
        xp_into      = xp - floor
        xp_range     = 0
        progress_pct = 100
    return {
        "xp_into_level":     xp_into,
        "xp_level_range":    xp_range,
        "level_progress_pct": progress_pct,
    }


class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80), unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False, default="")
    avatar        = db.Column(db.String(100), nullable=True)
    total_xp      = db.Column(db.Integer, default=0, nullable=False)
    is_banned     = db.Column(db.Boolean, default=False, nullable=False)
    ban_reason    = db.Column(db.Text, nullable=True)
    banned_at     = db.Column(db.DateTime, nullable=True)
    created_at    = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user_role   = db.relationship(
        "UserRole", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    completions = db.relationship(
        "JobCompletion", back_populates="user", cascade="all, delete-orphan"
    )
    submissions = db.relationship(
        "JobSubmission", back_populates="user", cascade="all, delete-orphan"
    )
    achievements = db.relationship(
        "UserAchievement", back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def level(self):
        return level_from_xp(self.total_xp)

    @property
    def rank(self):
        lvl = self.level
        for threshold, name in _RANK_THRESHOLDS:
            if lvl >= threshold:
                return name
        return "Guest"

    def to_dict(self):
        progress = xp_progress(self.total_xp or 0)
        return {
            "id":                  self.id,
            "username":            self.username,
            "email":               self.email,
            "role":                self.user_role.role.value if self.user_role else "user",
            "avatar_url":          f"/api/media/avatars/{self.avatar}" if self.avatar else None,
            "total_xp":            self.total_xp or 0,
            "level":               self.level,
            "rank":                self.rank,
            "xp_into_level":       progress["xp_into_level"],
            "xp_level_range":      progress["xp_level_range"],
            "level_progress_pct":  progress["level_progress_pct"],
            "is_banned":           self.is_banned,
            "ban_reason":          self.ban_reason,
            "banned_at":           self.banned_at.isoformat() if self.banned_at else None,
            "created_at":          self.created_at.isoformat(),
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


class TokenBlocklist(db.Model):
    __tablename__ = "token_blocklist"

    id         = db.Column(db.Integer, primary_key=True)
    jti        = db.Column(db.String(36), nullable=False, unique=True, index=True)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self):
        return f"<TokenBlocklist {self.jti}>"


class Job(db.Model):
    __tablename__ = "jobs"

    id               = db.Column(db.Integer, primary_key=True)
    title            = db.Column(db.String(200), nullable=False)
    description      = db.Column(db.Text, nullable=False)
    example_solution = db.Column(db.Text, nullable=True)
    language         = db.Column(db.Enum(Language), nullable=False)
    difficulty       = db.Column(db.Enum(JobDifficulty, name="job_difficulty"), nullable=False)
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
        back_populates="job",
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
        return f"<Job {self.id}: {self.title}>"


class TestCase(db.Model):
    __tablename__ = "test_cases"

    id     = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(
        db.Integer,
        db.ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
    )
    index  = db.Column(db.Integer, nullable=False)   # 0 – 9
    input  = db.Column(db.Text, nullable=False)
    output = db.Column(db.Text, nullable=False)

    job = db.relationship("Job", back_populates="test_cases")

    __table_args__ = (
        db.UniqueConstraint("job_id", "index", name="uq_job_testcase_index"),
    )

    def to_dict(self):
        return {
            "index":  self.index,
            "input":  self.input,
            "output": self.output,
        }

    def __repr__(self):
        return f"<TestCase job={self.job_id} idx={self.index}>"


class JobComment(db.Model):
    __tablename__ = "job_comments"

    id         = db.Column(db.Integer, primary_key=True)
    job_id     = db.Column(
        db.Integer,
        db.ForeignKey("jobs.id", ondelete="CASCADE"),
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

    job  = db.relationship("Job")
    user = db.relationship("User")

    def to_dict(self):
        return {
            "id":         self.id,
            "job_id":     self.job_id,
            "user_id":    self.user_id,
            "username":   self.user.username,
            "avatar_url": f"/api/media/avatars/{self.user.avatar}" if self.user.avatar else None,
            "content":    self.content,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<JobComment {self.id} job={self.job_id} user={self.user_id}>"


class JobCompletion(db.Model):
    __tablename__ = "job_completions"

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    job_id       = db.Column(
        db.Integer,
        db.ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
    )
    xp_earned    = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = db.relationship("User", back_populates="completions")
    job  = db.relationship("Job")

    __table_args__ = (
        db.UniqueConstraint("user_id", "job_id", name="uq_user_job_completion"),
    )

    def __repr__(self):
        return f"<JobCompletion user={self.user_id} job={self.job_id}>"


class JobSubmission(db.Model):
    """Every code run a user submits, whether it passes or fails."""
    __tablename__ = "job_submissions"

    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id        = db.Column(
        db.Integer,
        db.ForeignKey("jobs.id", ondelete="CASCADE"),
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

    user = db.relationship("User", back_populates="submissions")
    job  = db.relationship("Job")

    def __repr__(self):
        return f"<JobSubmission user={self.user_id} job={self.job_id} passed={self.all_passed}>"


# ── Test Suite ──────────────────────────────────────────────────────────────


class TestRunStatus(enum.Enum):
    active    = "active"
    completed = "completed"
    expired   = "expired"


class TestRun(db.Model):
    __tablename__ = "test_runs"

    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    language      = db.Column(db.String(20), nullable=False)
    status        = db.Column(
        db.Enum(TestRunStatus, name="test_run_status"),
        nullable=False,
        default=TestRunStatus.active,
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
        return f"<TestRun {self.id} user={self.user_id} lang={self.language}>"


# ── Stack Trace ─────────────────────────────────────────────────────────────


class ProcessSeverity(enum.Enum):
    warning  = "warning"
    critical = "critical"
    fatal    = "fatal"


class ChallengeStatus(enum.Enum):
    active    = "active"
    completed = "completed"
    failed    = "failed"


PROCESS_SEVERITY_CONFIG = {
    ProcessSeverity.warning:  {"minutes": 5,  "max_xp": 30},
    ProcessSeverity.critical: {"minutes": 10, "max_xp": 60},
    ProcessSeverity.fatal:    {"minutes": 15, "max_xp": 100},
}


class Process(db.Model):
    __tablename__ = "processes"

    id          = db.Column(db.Integer, primary_key=True)
    slug        = db.Column(db.String(80),  unique=True, nullable=False)
    name        = db.Column(db.String(120), nullable=False)
    glyph       = db.Column(db.String(200), nullable=False)   # short text/symbol rendered in a CSS terminal tile — no portrait art
    language    = db.Column(db.String(20),  nullable=False)   # plain string: python / javascript / java / csharp
    description = db.Column(db.Text, nullable=False)
    specialty   = db.Column(db.String(200), nullable=False)
    difficulty  = db.Column(db.Enum(ProcessSeverity, name="process_severity"), nullable=False)
    aura        = db.Column(db.Text, nullable=False)
    lore        = db.Column(db.String(200), nullable=False)

    challenges  = db.relationship("ProcessChallenge", back_populates="process", cascade="all, delete-orphan")

    def to_dict(self):
        cfg = PROCESS_SEVERITY_CONFIG[self.difficulty]
        return {
            "id":          self.id,
            "slug":        self.slug,
            "name":        self.name,
            "glyph":       self.glyph,
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
        return f"<Process {self.slug}>"


class ProcessChallenge(db.Model):
    __tablename__ = "process_challenges"

    id                 = db.Column(db.Integer, primary_key=True)
    user_id            = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    process_id         = db.Column(
        db.Integer,
        db.ForeignKey("processes.id", ondelete="CASCADE"),
        nullable=False,
    )
    challenge_text     = db.Column(db.Text, nullable=False)
    process_taunt      = db.Column(db.Text, nullable=False)
    user_solution      = db.Column(db.Text, nullable=True)
    process_verdict    = db.Column(db.Text, nullable=True)
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
    fail_token         = db.Column(
        db.String(43),
        nullable=False,
        default=lambda: secrets.token_urlsafe(32),
    )

    user    = db.relationship("User")
    process = db.relationship("Process", back_populates="challenges")

    def to_dict(self):
        return {
            "id":                 self.id,
            "user_id":            self.user_id,
            "process_id":         self.process_id,
            "challenge_text":     self.challenge_text,
            "process_taunt":      self.process_taunt,
            "user_solution":      self.user_solution,
            "process_verdict":    self.process_verdict,
            "technical_feedback": self.technical_feedback,
            "xp_earned":          self.xp_earned,
            "score_pct":          self.score_pct,
            "status":             self.status.value,
            "started_at":         self.started_at.isoformat(),
            "submitted_at":       self.submitted_at.isoformat() if self.submitted_at else None,
            "fail_token":         self.fail_token,
        }

    def __repr__(self):
        return f"<ProcessChallenge {self.id} user={self.user_id} process={self.process_id}>"


# ── Job Reports ─────────────────────────────────────────────────────────────


class ReportStatus(enum.Enum):
    reported    = "reported"
    in_progress = "in_progress"
    solved      = "solved"


class JobReport(db.Model):
    __tablename__ = "job_reports"

    id             = db.Column(db.Integer, primary_key=True)
    job_id         = db.Column(
        db.Integer,
        db.ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reporter_id    = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    reason         = db.Column(db.Text, nullable=False)
    status         = db.Column(
        db.Enum(ReportStatus),
        nullable=False,
        default=ReportStatus.reported,
    )
    assigned_to_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at     = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at     = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    job         = db.relationship("Job", foreign_keys=[job_id])
    reporter    = db.relationship("User", foreign_keys=[reporter_id])
    assigned_to = db.relationship("User", foreign_keys=[assigned_to_id])

    def to_dict(self):
        return {
            "id":             self.id,
            "job_id":         self.job_id,
            "job_title":      self.job.title if self.job else None,
            "reporter_id":    self.reporter_id,
            "reporter":       self.reporter.username if self.reporter else None,
            "reason":         self.reason,
            "status":         self.status.value,
            "assigned_to_id": self.assigned_to_id,
            "assigned_to":    self.assigned_to.username if self.assigned_to else None,
            "created_at":     self.created_at.isoformat(),
            "updated_at":     self.updated_at.isoformat(),
        }

    def __repr__(self):
        return f"<JobReport {self.id} job={self.job_id} status={self.status.value}>"


# ── Achievements ─────────────────────────────────────────────────────────────


class AchievementCategory(enum.Enum):
    job        = "job"
    process    = "process"
    test_suite = "test_suite"
    general    = "general"


class AchievementCriteriaType(enum.Enum):
    job_completions        = "job_completions"         # count JobCompletion, optional language/difficulty filter
    process_challenges     = "process_challenges"       # count completed ProcessChallenge, optional severity filter
    test_run_completions   = "test_run_completions"     # count non-active TestRun rows
    test_run_perfect_score = "test_run_perfect_score"   # any TestRun with correct_count == total questions
    total_xp               = "total_xp"                 # user.total_xp >= threshold
    level                  = "level"                    # user.level >= threshold
    rank                   = "rank"                      # user.rank == params["rank"]
    has_avatar             = "has_avatar"                # user.avatar is not None
    job_comments_count     = "job_comments_count"        # count JobComment for user
    jobs_authored_count    = "jobs_authored_count"       # count Job where author_id == user.id


class Achievement(db.Model):
    __tablename__ = "achievements"

    id              = db.Column(db.Integer, primary_key=True)
    slug            = db.Column(db.String(80), unique=True, nullable=False)
    name            = db.Column(db.String(120), nullable=False)
    description     = db.Column(db.String(255), nullable=False)
    category        = db.Column(db.Enum(AchievementCategory, name="achievement_category"), nullable=False)
    glyph           = db.Column(db.String(8), nullable=False)
    criteria_type   = db.Column(db.Enum(AchievementCriteriaType, name="achievement_criteria_type"), nullable=False)
    criteria_params = db.Column(db.JSON, nullable=False, default=dict)
    sort_order      = db.Column(db.Integer, nullable=False, default=0)
    created_at      = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    unlocks = db.relationship(
        "UserAchievement", back_populates="achievement", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Achievement {self.slug}>"


class UserAchievement(db.Model):
    __tablename__ = "user_achievements"

    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    achievement_id = db.Column(
        db.Integer,
        db.ForeignKey("achievements.id", ondelete="CASCADE"),
        nullable=False,
    )
    earned_at      = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user        = db.relationship("User", back_populates="achievements")
    achievement = db.relationship("Achievement", back_populates="unlocks")

    __table_args__ = (
        db.UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    def __repr__(self):
        return f"<UserAchievement user={self.user_id} achievement={self.achievement_id}>"
