import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getQuests } from "../services/questService";
import { getMyProfile } from "../services/profileService";
import { getRankStyle } from "../constants/ranks";
import ProgressBar from "../components/ProgressBar";
import Badge from "../components/Badge";
import SectionDivider from "../components/SectionDivider";

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) { setValue(0); return; }
    let cancelled = false;
    const t0 = performance.now();
    function tick(now) {
      if (cancelled) return;
      const t = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    return () => { cancelled = true; };
  }, [target, duration]);
  return value;
}

const LANGUAGES = [
  { slug: "python",     name: "Python",     glyph: "py", interpreter: "python3", description: "Data, automation & beyond",  accentColor: "var(--gem-python)" },
  { slug: "javascript", name: "JavaScript", glyph: "js", interpreter: "node",    description: "Build the modern web",        accentColor: "var(--gem-javascript)" },
  { slug: "java",       name: "Java",       glyph: "jv", interpreter: "java",    description: "Enterprise, Android & more",  accentColor: "var(--gem-java)" },
  { slug: "csharp",     name: "C#",         glyph: "c#", interpreter: "dotnet",  description: "Games, apps & cloud",         accentColor: "var(--gem-csharp)" },
];

const SECTIONS = [
  { name: "Leaderboard", path: "/leaderboard", glyph: "#", proc: "leaderboard.sh", description: "Compete with the best coders" },
  { name: "Stack Trace", path: "/underworld",  glyph: "!", proc: "stack_trace.sh", description: "Debug hostile processes for big XP" },
  { name: "Test Suite",  path: "/trivia",      glyph: "?", proc: "test_suite.sh",  description: "Pass the weekly knowledge run" },
];

function ArrowIcon({ className = "" }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function TermDots() {
  return (
    <>
      <span className="term-dot term-dot--red" />
      <span className="term-dot term-dot--yellow" />
      <span className="term-dot term-dot--green" />
    </>
  );
}

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.username || "Adventurer";
  const rankStyle = getRankStyle(user?.rank);

  const [questCounts,    setQuestCounts]    = useState({});
  const [totalLive,      setTotalLive]      = useState(null);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    getQuests().then((quests) => {
      const counts = quests.reduce((acc, q) => {
        acc[q.language] = (acc[q.language] ?? 0) + 1;
        return acc;
      }, {});
      setQuestCounts(counts);
      setTotalLive(quests.length);
    }).catch(() => {});
    getMyProfile()
      .then(data => setCompletedCount(data.completions?.length ?? 0))
      .catch(() => {});
  }, []);

  // XP level math — computed from backend level table
  const totalXP      = user?.total_xp          ?? 0;
  const currentLevel = user?.level              ?? 1;
  const xpIntoLevel  = user?.xp_into_level      ?? 0;
  const xpLevelRange = user?.xp_level_range      ?? 0;
  const xpToNext     = xpLevelRange > 0 ? xpLevelRange - xpIntoLevel : 0;
  const nextLevel    = currentLevel < 100 ? currentLevel + 1 : 100;
  const xpPct        = user?.level_progress_pct  ?? 0;
  const completedPct = totalLive ? Math.round((completedCount / totalLive) * 100) : 0;

  const animatedXP        = useCountUp(totalXP);
  const animatedCompleted = useCountUp(completedCount);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="space-y-14">

      {/* ── Hero — welcome, stat panels, and quick actions in one terminal window ── */}
      <div className="term-window page-enter">
        <div className="term-bar">
          <TermDots />
          <span className="term-title">~/skillforge/dashboard.sh</span>
        </div>
        <div className="term-body">
          <p className="hero-eyebrow">guest@skillforge:~$ whoami --welcome</p>
          <h1
            className="glow-pulse"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(1.9rem, 4.2vw, 2.7rem)",
              fontWeight: 800,
              color: "var(--color-green)",
              marginBottom: "0.6rem",
              lineHeight: 1.15,
            }}
          >
            Welcome back, {displayName}<span aria-hidden="true">_</span>
          </h1>
          <p className="leading-relaxed max-w-[560px]" style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)", marginBottom: "1.75rem" }}>
            Your job queue awaits. Run <code style={{ color: "var(--color-blue)" }}>job --list</code> to see what's next.
          </p>

          {/* Stat panels */}
          <div className="grid sm:grid-cols-[2fr_2fr_1fr] gap-4 mb-7">

            {/* XP */}
            <div className="glass-card p-5">
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700, color: "var(--color-blue)", marginBottom: "0.5rem" }}>
                // experience
              </p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-green)", lineHeight: 1, marginBottom: "0.6rem" }}>
                {animatedXP.toLocaleString()} XP
              </p>
              <ProgressBar value={xpPct} ascii chars={26} />
              <p style={{ fontSize: "0.68rem", color: "var(--color-text-tertiary)", marginTop: "0.4rem" }}>
                {xpPct}% to LV{nextLevel}
              </p>
            </div>

            {/* Quest chronicle */}
            <div className="glass-card p-5">
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700, color: "var(--color-blue)", marginBottom: "0.5rem" }}>
                // job_log
              </p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-green)", lineHeight: 1, marginBottom: "0.6rem" }}>
                {animatedCompleted} / {totalLive !== null ? totalLive : "—"}
              </p>
              <ProgressBar value={completedPct} ascii chars={26} />
              <p style={{ fontSize: "0.68rem", color: "var(--color-text-tertiary)", marginTop: "0.4rem" }}>
                {completedPct}% complete
              </p>
            </div>

            {/* Rank */}
            <div className="glass-card p-5">
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700, color: "var(--color-blue)", marginBottom: "0.5rem" }}>
                // rank
              </p>
              <p
                className="glow-pulse-blue"
                style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: rankStyle.color, lineHeight: 1, marginBottom: "0.6rem" }}
              >
                {user?.rank ?? "Novice"}
              </p>
              <Link
                to="/leaderboard"
                style={{ fontSize: "0.68rem", color: "var(--color-text-tertiary)", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-blue)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
              >
                View leaderboard →
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3">
            <a href="#jobs" className="sf-btn" style={{ width: "auto", minWidth: "160px" }}>
              Run Job
            </a>
            <Link to="/profile" className="sf-btn-secondary" style={{ width: "auto", minWidth: "160px" }}>
              View Profile
            </Link>
            <button onClick={handleLogout} className="sf-btn-ghost" style={{ width: "auto" }}>
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* ── Language Job Cards — per-card terminal chrome, no imagery ── */}
      <div id="jobs">
        <SectionDivider title="Choose Your Job" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LANGUAGES.map((lang) => (
            <Link key={lang.slug} to={`/quests/${lang.slug}`} style={{ textDecoration: "none" }}>
              <div className="group quest-card" style={{ "--card-accent": lang.accentColor }}>
                <div className="quest-card-bar">
                  <TermDots />
                  <span className="term-title">{lang.interpreter}</span>
                </div>
                <div className="quest-card-body">
                  <div className="flex items-start justify-between">
                    <div className="quest-card-glyph">{lang.glyph}</div>
                    <Badge variant="blue">{questCounts[lang.slug] ?? "—"} jobs</Badge>
                  </div>

                  <h3
                    className="font-bold text-base mb-1"
                    style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}
                  >
                    {lang.name}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
                    {lang.description}
                  </p>
                  <div className="quest-card-cta">
                    <span>./begin_job</span>
                    <ArrowIcon />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Explore ── */}
      <div>
        <SectionDivider title="Explore" />
        <div className="grid sm:grid-cols-3 gap-4">
          {SECTIONS.map((section) => (
            <Link key={section.name} to={section.path} style={{ textDecoration: "none" }}>
              <div className="group explore-card">
                <div className="explore-card-bar">
                  <TermDots />
                  <span className="term-title">{section.proc}</span>
                </div>
                <div className="explore-card-body">
                  <div className="flex items-start justify-between">
                    <span
                      style={{
                        fontFamily: "var(--font-brand)",
                        fontWeight: 800,
                        fontSize: "2rem",
                        lineHeight: 1,
                        color: "var(--color-green)",
                        opacity: 0.9,
                        textShadow: "0 0 14px var(--color-green-glow-strong)",
                      }}
                    >
                      {section.glyph}
                    </span>
                    <div className="explore-card-arrow">
                      <ArrowIcon />
                    </div>
                  </div>

                  <div>
                    <h3
                      className="font-semibold text-base"
                      style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}
                    >
                      {section.name}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
