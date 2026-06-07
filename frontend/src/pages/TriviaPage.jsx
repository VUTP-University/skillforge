import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTriviaStatus, startTrivia } from "../services/triviaService";
import oracleImg from "../assets/img/Oracle.jpg";

/* ── Constants ──────────────────────────────────────────────────────────── */

// Oracle theme gold — matches Oracle.jpg palette
const G  = "#eab308";          // primary gold  (yellow-500)
const GL = "#fde047";          // light gold    (yellow-300)
const GR = "234,179,8";        // gold as rgb triplet for rgba()

const LANG_META = {
  python:     { label: "Python",     glyph: "Py", color: "#4ade80", border: "rgba(74,222,128,0.25)",  bg: "rgba(74,222,128,0.06)",  desc: "Scripting, data, automation"    },
  javascript: { label: "JavaScript", glyph: "JS", color: "#fbbf24", border: "rgba(251,191,36,0.25)",  bg: "rgba(251,191,36,0.06)",  desc: "The language of the web"        },
  java:       { label: "Java",       glyph: "Jv", color: "#f97316", border: "rgba(249,115,22,0.25)",  bg: "rgba(249,115,22,0.06)",  desc: "Enterprise & Android"           },
  csharp:     { label: "C#",         glyph: "C#", color: "#a78bfa", border: "rgba(167,139,250,0.25)", bg: "rgba(167,139,250,0.06)", desc: "Games, cloud & apps"            },
  mix:        { label: "All Paths",  glyph: "∞",  color: "#03e9f4", border: "rgba(3,233,244,0.25)",   bg: "rgba(3,233,244,0.06)",   desc: "Questions from all 4 languages" },
};

// Map each language color hex to its rgb triplet for inline rgba() strings
const COLOR_RGB = {
  "#03e9f4": "3,233,244",
  "#4ade80": "74,222,128",
  "#fbbf24": "251,191,36",
  "#f97316": "249,115,22",
  "#a78bfa": "167,139,250",
};

const MAX_XP = 7 * 10 + 8 * 20 + 5 * 30; // 380

function formatCountdown(isoString) {
  const ms = new Date(isoString) - Date.now();
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0)   return `${h}h ${m}m`;
  return `${m}m`;
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function OrnamentDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "2rem 0" }}>
      <div style={{ flex: 1, height: "1px", background: `rgba(${GR},0.20)` }} />
      <span style={{ color: `rgba(${GR},0.60)`, fontSize: "0.8rem", letterSpacing: "0.2em" }}>✦</span>
      <div style={{ flex: 1, height: "1px", background: `rgba(${GR},0.20)` }} />
    </div>
  );
}

function XpLegend() {
  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {[["Easy", "10 XP", "#4ade80"], ["Medium", "20 XP", "#fbbf24"], ["Hard", "30 XP", "#f87171"]].map(([d, xp, c]) => (
        <div key={d} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 7, height: 7, borderRadius: "2px", background: c, transform: "rotate(45deg)" }} />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", letterSpacing: "0.10em", color: "rgba(255,255,255,0.40)" }}>
            {d} · {xp}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */

export default function TriviaPage() {
  const navigate = useNavigate();

  const [status,   setStatus]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [starting, setStarting] = useState(null);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    getTriviaStatus()
      .then(setStatus)
      .catch(() => setError("Failed to load the Oracle's Sanctum."))
      .finally(() => setLoading(false));
  }, []);

  async function handleStart(language) {
    setStarting(language);
    setError(null);
    try {
      const data = await startTrivia(language);
      navigate("/trivia/play", { state: data });
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to start the trial.");
    } finally {
      setStarting(null);
    }
  }

  function handleResume() {
    if (!status?.active_session) return;
    const { active_session } = status;
    navigate("/trivia/play", {
      state: {
        session_id: active_session.id,
        expires_at: active_session.expires_at,
        questions:  active_session.questions,
        resumed:    true,
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-32">
        <div className="sf-spinner" style={{ width: 22, height: 22 }} />
        <span className="text-sub text-sm">Entering the Sanctum…</span>
      </div>
    );
  }

  const canPlay       = status?.can_play ?? false;
  const activeSession = status?.active_session ?? null;
  const lastSession   = status?.last_session ?? null;
  const nextAt        = status?.next_available_at ?? null;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>

      {/* ── Hero header ── */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>

        {/* Oracle image ring */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: "1.5rem" }}>
          {/* Outer glow ring */}
          <div style={{
            position: "absolute", inset: -8, borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${GR},0.20) 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <div style={{
            width: 96, height: 96, borderRadius: "50%", overflow: "hidden",
            border: `2px solid rgba(${GR},0.50)`,
            boxShadow: `0 0 0 4px rgba(${GR},0.10), 0 0 40px rgba(${GR},0.25)`,
          }}>
            <img
              src={oracleImg}
              alt="The Oracle"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </div>

        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "2.4rem", fontWeight: 700,
          color: GL, letterSpacing: "0.04em", marginBottom: "0.5rem",
          textShadow: `0 0 60px rgba(${GR},0.50), 0 0 20px rgba(${GR},0.25)`,
        }}>
          The Oracle's Trial
        </h1>
        <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.45)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
          Once per week, the Oracle grants a trial of 20 questions. Choose your path,
          answer swiftly — 5 minutes is all you are given.
        </p>

        <OrnamentDivider />

        {/* Stats row */}
        <div style={{ display: "flex", justifyContent: "center", gap: "2.5rem", flexWrap: "wrap" }}>
          {[
            ["20",        "Questions"],
            ["5 min",     "Time Limit"],
            [`${MAX_XP} XP`, "Max Reward"],
            ["Weekly",    "Reset"],
          ].map(([val, lbl]) => (
            <div key={lbl} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700, color: G, lineHeight: 1 }}>{val}</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginTop: "0.25rem" }}>{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", borderRadius: "10px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: "0.82rem" }}>
          {error}
        </div>
      )}

      {/* ── Active session resume ── */}
      {activeSession && (
        <div style={{ marginBottom: "1.75rem", padding: "1.1rem 1.25rem", borderRadius: "12px", background: `rgba(${GR},0.07)`, border: `1px solid rgba(${GR},0.30)`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: G, marginBottom: "0.2rem" }}>
              Trial In Progress
            </p>
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)" }}>
              You have an active {LANG_META[activeSession.language]?.label ?? activeSession.language} trial. Return before time runs out.
            </p>
          </div>
          <button
            onClick={handleResume}
            style={{
              padding: "0.55rem 1.25rem", borderRadius: "8px", border: `1px solid rgba(${GR},0.50)`,
              background: `rgba(${GR},0.12)`, color: GL,
              fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase",
              cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `rgba(${GR},0.22)`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = `rgba(${GR},0.12)`)}
          >
            Resume Trial →
          </button>
        </div>
      )}

      {/* ── Cooldown banner ── */}
      {!canPlay && !activeSession && nextAt && (
        <div style={{ marginBottom: "1.75rem", padding: "1.1rem 1.25rem", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <svg style={{ width: 20, height: 20, color: "rgba(255,255,255,0.30)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)", marginBottom: "0.15rem" }}>
              Weekly Trial Complete
            </p>
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.40)" }}>
              The Oracle rests. Next trial available in <strong style={{ color: "rgba(255,255,255,0.70)" }}>{formatCountdown(nextAt)}</strong>.
            </p>
          </div>
          {lastSession && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, color: G }}>
                {lastSession.score_xp} XP
              </p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                {lastSession.correct_count}/{lastSession.total_questions} correct
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── XP legend ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <XpLegend />
      </div>

      {/* ── Language cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
        {Object.entries(LANG_META).map(([lang, meta]) => {
          const isStarting = starting === lang;
          const disabled   = !canPlay || !!activeSession || isStarting;
          const rgb        = COLOR_RGB[meta.color] ?? "255,255,255";

          return (
            <div
              key={lang}
              style={{
                borderRadius: "14px",
                border: `1px solid ${disabled ? "rgba(255,255,255,0.07)" : meta.border}`,
                background: disabled ? "rgba(255,255,255,0.02)" : meta.bg,
                padding: "1.4rem",
                display: "flex", flexDirection: "column", gap: "1rem",
                opacity: disabled && !canPlay ? 0.5 : 1,
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.boxShadow = `0 0 24px ${meta.bg}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Glyph + label */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "10px", flexShrink: 0,
                  border: `1px solid ${meta.border}`,
                  background: `rgba(${rgb},0.12)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-heading)", fontSize: "0.78rem", fontWeight: 700,
                  color: meta.color,
                }}>
                  {meta.glyph}
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.90)", marginBottom: "0.1rem" }}>
                    {meta.label}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                    {meta.desc}
                  </p>
                </div>
              </div>

              {/* Info row */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[["30", "Questions"], ["380", "Max XP"], ["5 min", "Limit"]].map(([v, l]) => (
                  <div key={l} style={{ flex: 1, padding: "0.35rem 0.5rem", borderRadius: "7px", background: "rgba(255,255,255,0.04)", textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.70)" }}>{v}</p>
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>{l}</p>
                  </div>
                ))}
              </div>

              {/* Start button */}
              <button
                onClick={() => handleStart(lang)}
                disabled={disabled}
                style={{
                  width: "100%", padding: "0.6rem",
                  borderRadius: "9px",
                  border: `1px solid ${disabled ? "rgba(255,255,255,0.08)" : meta.border}`,
                  background: disabled ? "rgba(255,255,255,0.04)" : `rgba(${rgb},0.10)`,
                  color: disabled ? "rgba(255,255,255,0.22)" : meta.color,
                  fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
                  letterSpacing: "0.10em", textTransform: "uppercase",
                  cursor: disabled ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = `rgba(${rgb},0.18)`; }}
                onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = `rgba(${rgb},0.10)`; }}
              >
                {isStarting ? (
                  <>
                    <div className="sf-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                    Beginning…
                  </>
                ) : canPlay ? (
                  "Begin Trial →"
                ) : (
                  activeSession ? "Trial Active" : "Unavailable"
                )}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
