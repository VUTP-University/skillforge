"""
Achievement catalog + unlock evaluation.

Shared across the job/process/test-suite/profile routes (not tied to a
single blueprint), the same way utils.py holds cross-cutting helpers.
"""

from app import db
from app.models import (
    Achievement,
    AchievementCategory,
    AchievementCriteriaType,
    ChallengeStatus,
    Job,
    JobComment,
    JobCompletion,
    JobDifficulty,
    Language,
    Process,
    ProcessChallenge,
    ProcessSeverity,
    TestRun,
    TestRunStatus,
    UserAchievement,
)

# ── Catalog seed ─────────────────────────────────────────────────────────────

# Slugs that used to be seeded but no longer are — deleted outright by
# _prune_removed_achievements() below rather than left as orphaned rows.
_RETIRED_SLUGS = ["root-access", "python-specialist"]

_JOB_LANGUAGES = {
    "python":     {"label": "Python",     "glyph": "py"},
    "javascript": {"label": "JavaScript", "glyph": "js"},
    "java":       {"label": "Java",       "glyph": "jv"},
    "csharp":     {"label": "C#",         "glyph": "c#"},
}

_JOB_LADDER_TIERS = [(5, "Novice"), (10, "Adept"), (20, "Specialist"), (30, "Expert"),
                      (40, "Veteran"), (50, "Master"), (100, "Grandmaster")]

_TEST_SUITE_LANGUAGES = {
    "python":     {"label": "Python",     "glyph": "py"},
    "javascript": {"label": "JavaScript", "glyph": "js"},
    "java":       {"label": "Java",       "glyph": "jv"},
    "csharp":     {"label": "C#",         "glyph": "c#"},
    "mix":        {"label": "Grand Mix",  "glyph": "**"},
}

_LEVEL_TIERS = [20, 30, 40, 50, 60, 70, 80, 90, 100]  # 5 and 10 declared explicitly above

ACHIEVEMENT_SEED = [
    # ── Job — overall completion ladder ──
    dict(slug="first-job", name="Hello, Job", description="Complete your first job.",
         category="job", glyph="01",
         criteria_type="job_completions", criteria_params={"threshold": 1}),
    dict(slug="job-veteran", name="Job Veteran", description="Complete 10 jobs.",
         category="job", glyph="10",
         criteria_type="job_completions", criteria_params={"threshold": 10}),
    dict(slug="job-grinder-20", name="Job Grinder", description="Complete 20 jobs.",
         category="job", glyph="20",
         criteria_type="job_completions", criteria_params={"threshold": 20}),
    dict(slug="job-crusher-30", name="Job Crusher", description="Complete 30 jobs.",
         category="job", glyph="30",
         criteria_type="job_completions", criteria_params={"threshold": 30}),
    dict(slug="job-juggernaut-40", name="Job Juggernaut", description="Complete 40 jobs.",
         category="job", glyph="40",
         criteria_type="job_completions", criteria_params={"threshold": 40}),
    dict(slug="job-master", name="Job Master", description="Complete 50 jobs.",
         category="job", glyph="50",
         criteria_type="job_completions", criteria_params={"threshold": 50}),
    dict(slug="job-centurion-100", name="Job Centurion", description="Complete 100 jobs.",
         category="job", glyph="100",
         criteria_type="job_completions", criteria_params={"threshold": 100}),
    dict(slug="senior-slayer", name="Senior Slayer", description="Complete 5 Senior-difficulty jobs.",
         category="job", glyph="!!",
         criteria_type="job_completions", criteria_params={"threshold": 5, "difficulty": "senior"}),

    # ── Process ──
    dict(slug="first-patch", name="First Patch", description="Resolve your first hostile process.",
         category="process", glyph="#",
         criteria_type="process_challenges", criteria_params={"threshold": 1}),
    dict(slug="fatal-exception-handler", name="Fatal Exception Handler", description="Resolve 5 Fatal-severity processes.",
         category="process", glyph="∅",
         criteria_type="process_challenges", criteria_params={"threshold": 5, "severity": "fatal"}),

    # ── Test Suite ──
    dict(slug="test-pilot", name="Test Pilot", description="Complete your first Test Suite run.",
         category="test_suite", glyph="?",
         criteria_type="test_run_completions", criteria_params={"threshold": 1}),
    dict(slug="zero-defects", name="Zero Defects", description="Score a perfect run on the Test Suite.",
         category="test_suite", glyph="✓",
         criteria_type="test_run_perfect_score", criteria_params={}),

    # ── General ──
    dict(slug="level-5", name="Level 5", description="Reach Level 5.",
         category="general", glyph="05",
         criteria_type="level", criteria_params={"threshold": 5}),
    dict(slug="double-digits", name="Double Digits", description="Reach Level 10.",
         category="general", glyph="10",
         criteria_type="level", criteria_params={"threshold": 10}),
    dict(slug="identity-verified", name="Identity Verified", description="Set a custom avatar.",
         category="general", glyph="@",
         criteria_type="has_avatar", criteria_params={}),
    dict(slug="open-source", name="Open Source", description="Author a published job.",
         category="general", glyph="+",
         criteria_type="jobs_authored_count", criteria_params={"threshold": 1}),
    dict(slug="first-comment", name="First Comment", description="Post your first comment on a job.",
         category="general", glyph="//",
         criteria_type="job_comments_count", criteria_params={"threshold": 1}),
]

# Job completion ladder, per language (5/10/20/30/40/50/100 jobs × 4 languages)
for _lang, _meta in _JOB_LANGUAGES.items():
    for _n, _tier in _JOB_LADDER_TIERS:
        ACHIEVEMENT_SEED.append(dict(
            slug=f"jobs-{_lang}-{_n}",
            name=f"{_meta['label']} {_tier}",
            description=f"Complete {_n} {_meta['label']} jobs.",
            category="job",
            glyph=f"{_meta['glyph']}{_n}",
            criteria_type="job_completions",
            criteria_params={"threshold": _n, "language": _lang},
        ))

# Test Suite completion, per language + the Grand Mix
for _lang, _meta in _TEST_SUITE_LANGUAGES.items():
    ACHIEVEMENT_SEED.append(dict(
        slug=f"test-suite-{_lang}",
        name=f"{_meta['label']} Certified",
        description=f"Complete a Test Suite run in {_meta['label']}.",
        category="test_suite",
        glyph=_meta["glyph"],
        criteria_type="test_run_completions",
        criteria_params={"threshold": 1, "language": _lang},
    ))

# Level ladder (5 and 10 declared explicitly above; 20 through 100 here)
for _n in _LEVEL_TIERS:
    ACHIEVEMENT_SEED.append(dict(
        slug=f"level-{_n}",
        name=f"Level {_n}",
        description=f"Reach Level {_n}.",
        category="general",
        glyph=str(_n),
        criteria_type="level",
        criteria_params={"threshold": _n},
    ))


def _seed_achievements():
    """Upsert all achievements from ACHIEVEMENT_SEED — inserts new ones and updates existing ones by slug.
    Also deletes any _RETIRED_SLUGS row still in the DB (cascades to UserAchievement unlocks)."""
    existing = {a.slug: a for a in Achievement.query.all()}
    for i, data in enumerate(ACHIEVEMENT_SEED):
        achievement = existing.get(data["slug"])
        if achievement is None:
            achievement = Achievement(slug=data["slug"])
            db.session.add(achievement)
        achievement.name            = data["name"]
        achievement.description     = data["description"]
        achievement.category        = AchievementCategory(data["category"])
        achievement.glyph           = data["glyph"]
        achievement.criteria_type   = AchievementCriteriaType(data["criteria_type"])
        achievement.criteria_params = data["criteria_params"]
        achievement.sort_order      = i

    Achievement.query.filter(Achievement.slug.in_(_RETIRED_SLUGS)).delete(synchronize_session=False)
    db.session.commit()


# ── XP ───────────────────────────────────────────────────────────────────────

def award_xp(user, amount):
    """Add XP to a user. Callers are responsible for following up with
    check_achievements() for the relevant categories."""
    user.total_xp = (user.total_xp or 0) + amount


# ── Criteria evaluators ──────────────────────────────────────────────────────

def _count_job_completions(user, params):
    q = JobCompletion.query.filter_by(user_id=user.id)
    if params.get("language") or params.get("difficulty"):
        q = q.join(Job, JobCompletion.job_id == Job.id)
        if params.get("language"):
            q = q.filter(Job.language == Language(params["language"]))
        if params.get("difficulty"):
            q = q.filter(Job.difficulty == JobDifficulty(params["difficulty"]))
    return q.count()


def _count_process_challenges(user, params):
    q = ProcessChallenge.query.filter_by(user_id=user.id, status=ChallengeStatus.completed)
    if params.get("severity"):
        q = (
            q.join(Process, ProcessChallenge.process_id == Process.id)
            .filter(Process.difficulty == ProcessSeverity(params["severity"]))
        )
    return q.count()


def _count_test_run_completions(user, params):
    q = TestRun.query.filter(TestRun.user_id == user.id, TestRun.status != TestRunStatus.active)
    if params.get("language"):
        q = q.filter(TestRun.language == params["language"])
    return q.count()


def _has_perfect_test_run(user, params):
    runs = TestRun.query.filter_by(user_id=user.id, status=TestRunStatus.completed).all()
    return any(r.questions and r.correct_count >= len(r.questions) for r in runs)


def _evaluate(user, achievement):
    p = achievement.criteria_params or {}
    t = achievement.criteria_type

    if t == AchievementCriteriaType.job_completions:
        return _count_job_completions(user, p) >= p["threshold"]
    if t == AchievementCriteriaType.process_challenges:
        return _count_process_challenges(user, p) >= p["threshold"]
    if t == AchievementCriteriaType.test_run_completions:
        return _count_test_run_completions(user, p) >= p["threshold"]
    if t == AchievementCriteriaType.test_run_perfect_score:
        return _has_perfect_test_run(user, p)
    if t == AchievementCriteriaType.total_xp:
        return (user.total_xp or 0) >= p["threshold"]
    if t == AchievementCriteriaType.level:
        return user.level >= p["threshold"]
    if t == AchievementCriteriaType.rank:
        return user.rank == p["rank"]
    if t == AchievementCriteriaType.has_avatar:
        return user.avatar is not None
    if t == AchievementCriteriaType.job_comments_count:
        return JobComment.query.filter_by(user_id=user.id).count() >= p["threshold"]
    if t == AchievementCriteriaType.jobs_authored_count:
        return Job.query.filter_by(author_id=user.id).count() >= p["threshold"]

    return False


# ── Public entry point ───────────────────────────────────────────────────────

def check_achievements(user, categories=None):
    """
    Evaluate not-yet-unlocked achievements for `user` (optionally scoped to
    `categories`, a list of AchievementCategory) and unlock any newly met
    ones. Adds UserAchievement rows to the session without committing —
    callers already commit shortly after. Returns the newly-unlocked
    Achievement objects.
    """
    query = Achievement.query
    if categories:
        query = query.filter(Achievement.category.in_(categories))

    already_unlocked = {
        ua.achievement_id
        for ua in UserAchievement.query.filter_by(user_id=user.id).all()
    }

    newly_unlocked = []
    for achievement in query.all():
        if achievement.id in already_unlocked:
            continue
        if _evaluate(user, achievement):
            db.session.add(UserAchievement(user_id=user.id, achievement_id=achievement.id))
            newly_unlocked.append(achievement)

    return newly_unlocked
