import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTriviaStatus, startTrivia } from "../services/triviaService";
import oracleImg from "../assets/img/Oracle.jpg";

/* ── Constants ──────────────────────────────────────────────────────────── */

const G   = "var(--color-amber)";
const GL  = "var(--color-amber)";
const GR  = "255,204,102";
const MAX_XP = 7 * 10 + 8 * 20 + 5 * 30; // 380

const LANG_CARDS = [
  {
    key:      "python",
    glyph:    "py",
    title:    "Python Trial",
    label:    "Python",
    desc:     "Data structures, algorithms, and language internals",
    color:    "var(--gem-python)",
    colorRgb: "94,200,255",
    cta:      "Start Trial",
  },
  {
    key:      "javascript",
    glyph:    "js",
    title:    "JavaScript Trial",
    label:    "JavaScript",
    desc:     "DOM, async patterns, and modern web fundamentals",
    color:    "var(--gem-javascript)",
    colorRgb: "255,204,102",
    cta:      "Start Trial",
  },
  {
    key:      "java",
    glyph:    "jv",
    title:    "Java Trial",
    label:    "Java",
    desc:     "OOP, enterprise patterns, and the JVM ecosystem",
    color:    "var(--gem-java)",
    colorRgb: "255,143,163",
    cta:      "Start Trial",
  },
  {
    key:      "csharp",
    glyph:    "c#",
    title:    "C# Trial",
    label:    "C#",
    desc:     "Games, desktop apps, and systems programming",
    color:    "var(--gem-csharp)",
    colorRgb: "177,140,255",
    cta:      "Start Trial",
  },
];

const LANG_LABEL = {
  python: "Python", javascript: "JavaScript", java: "Java", csharp: "C#", mix: "All Paths",
};

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
      <span style={{ color: `rgba(${GR},0.60)`, fontSize: "0.8rem" }}>◆</span>
      <div style={{ flex: 1, height: "1px", background: `rgba(${GR},0.20)` }} />
    </div>
  );
}

function LangCard({ card, canPlay, activeSession, starting, onStart }) {
  const [hovered, setHovered] = useState(false);
  const isStarting = starting === card.key;
  const disabled   = !canPlay || !!activeSession || isStarting;
  const active     = hovered && !disabled;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { if (!disabled) onStart(card.key); }}
      style={{
        position: "relative",
        borderRadius: "6px",
        overflow: "hidden",
        height: "230px",
        cursor: disabled ? "default" : "pointer",
        border: `1px solid ${active ? `rgba(${card.colorRgb},0.55)` : "var(--color-border-2)"}`,
        background: "rgba(0,0,0,0.30)",
        boxShadow: active
          ? `0 0 36px rgba(${card.colorRgb},0.15), 0 8px 40px rgba(0,0,0,0.55)`
          : "0 4px 20px rgba(0,0,0,0.40)",
        transition: "border 0.25s, box-shadow 0.25s, transform 0.22s",
        transform: active ? "translateY(-4px)" : "translateY(0)",
        opacity: disabled && !canPlay ? 0.55 : 1,
        padding: "1rem 1.15rem 1.1rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Thin colored accent stripe at top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(
          to right,
          transparent,
          rgba(${card.colorRgb},0.80) 30%,
          rgba(${card.colorRgb},0.80) 70%,
          transparent
        )`,
        opacity: active ? 1 : 0.40,
        transition: "opacity 0.25s",
      }} />

      {/* Top-left: language badge */}
      <div style={{
        position: "absolute", top: "0.9rem", left: "0.9rem",
        padding: "0.22rem 0.55rem",
        borderRadius: "3px",
        background: "rgba(0,0,0,0.50)",
        border: `1px solid rgba(${card.colorRgb},0.38)`,
        fontFamily: "var(--font-heading)",
        fontSize: "0.56rem", fontWeight: 700,
        color: card.color,
      }}>
        {card.label}
      </div>

      {/* Big glyph */}
      <div style={{
        fontFamily: "var(--font-brand)",
        fontWeight: 800,
        fontSize: "2.6rem",
        lineHeight: 1,
        color: card.color,
        textShadow: `0 0 16px rgba(${card.colorRgb},0.45)`,
        opacity: 0.9,
        marginBottom: "0.35rem",
      }}>
        {card.glyph}
      </div>

      <h3 style={{
        fontFamily: "var(--font-heading)",
        fontSize: "1.0rem", fontWeight: 700,
        color: "var(--color-text)",
        marginBottom: "0.28rem",
        lineHeight: 1.2,
      }}>
        {card.title}
      </h3>
      <p style={{
        fontSize: "0.70rem",
        color: "var(--color-text-tertiary)",
        marginBottom: "0.85rem",
        lineHeight: 1.45,
      }}>
        {card.desc}
      </p>

      <button
        onClick={(e) => { e.stopPropagation(); if (!disabled) onStart(card.key); }}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "0.52rem 0.75rem",
          borderRadius: "4px",
          border: `1px solid ${disabled ? "var(--color-border-2)" : `rgba(${card.colorRgb},0.42)`}`,
          background: disabled
            ? "rgba(0,0,0,0.45)"
            : active
            ? `rgba(${card.colorRgb},0.20)`
            : `rgba(${card.colorRgb},0.10)`,
          color: disabled ? "var(--color-text-faint)" : card.color,
          fontFamily: "var(--font-heading)",
          fontSize: "0.60rem", fontWeight: 700,
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.16s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
        }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          if (!disabled) e.currentTarget.style.background = `rgba(${card.colorRgb},0.25)`;
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          if (!disabled) e.currentTarget.style.background = `rgba(${card.colorRgb},0.10)`;
        }}
      >
        {isStarting ? (
          <>
            <div className="sf-spinner" style={{ width: 11, height: 11, borderWidth: 2 }} />
            Starting…
          </>
        ) : !canPlay ? (
          activeSession ? "Trial Active" : "Unavailable"
        ) : (
          `${card.cta} →`
        )}
      </button>
    </div>
  );
}

function MixCard({ canPlay, activeSession, starting, onStart }) {
  const [hovered, setHovered] = useState(false);
  const isStarting = starting === "mix";
  const disabled   = !canPlay || !!activeSession || isStarting;
  const active     = hovered && !disabled;
  const rgb        = "77,255,143";
  const color      = "var(--color-green)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { if (!disabled) onStart("mix"); }}
      style={{
        position: "relative",
        borderRadius: "6px",
        border: `1px solid ${active ? `rgba(${rgb},0.38)` : "var(--color-border-2)"}`,
        background: active ? "var(--color-green-dim)" : "rgba(255,255,255,0.02)",
        padding: "1.4rem 1.75rem",
        display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap",
        overflow: "hidden",
        transition: "all 0.25s ease",
        boxShadow: active ? `0 0 44px rgba(${rgb},0.08)` : "none",
        opacity: disabled && !isStarting ? 0.55 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {/* Accent line — top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(to right, #5ec8ff, #ffcc66, #ff8fa3, #b18cff)",
        opacity: active ? 0.65 : 0.18,
        transition: "opacity 0.25s",
      }} />

      {/* Glyph */}
      <div style={{
        width: 64, height: 64, borderRadius: "6px", flexShrink: 0,
        border: `1px solid rgba(${rgb},0.28)`,
        background: `rgba(${rgb},0.05)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-brand)",
        fontWeight: 800,
        fontSize: "1.9rem", lineHeight: 1,
        color,
        boxShadow: active ? `0 0 20px rgba(${rgb},0.20)` : "none",
        transition: "box-shadow 0.25s",
      }}>
        **
      </div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
          <span style={{
            fontFamily: "var(--font-heading)", fontSize: "0.56rem", fontWeight: 700,
            color,
            padding: "0.18rem 0.5rem", borderRadius: "3px",
            background: `rgba(${rgb},0.08)`, border: `1px solid rgba(${rgb},0.22)`,
          }}>
            All Paths
          </span>
          <span style={{
            fontFamily: "var(--font-heading)", fontSize: "0.50rem",
            color: "var(--color-text-faint)",
          }}>
            mixed difficulty
          </span>
        </div>
        <h3 style={{
          fontFamily: "var(--font-heading)", fontSize: "1.0rem", fontWeight: 700,
          color: "var(--color-text)", marginBottom: "0.25rem", lineHeight: 1.2,
        }}>
          The Grand Mix
        </h3>
        <p style={{ fontSize: "0.73rem", color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
          Questions drawn from all four languages — Python, JavaScript, Java, and C#.
          The ultimate all-rounder trial.
        </p>
      </div>

      {/* Stats + button */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", flexShrink: 0, alignItems: "flex-end" }}>
        <div style={{ display: "flex", gap: "1.25rem" }}>
          {[["20", "Questions"], ["380 XP", "Max Reward"], ["5 min", "Limit"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-text-secondary)", lineHeight: 1 }}>{v}</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.48rem", color: "var(--color-text-faint)", marginTop: "0.2rem" }}>{l}</p>
            </div>
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); if (!disabled) onStart("mix"); }}
          disabled={disabled}
          style={{
            padding: "0.55rem 1.5rem", borderRadius: "4px",
            border: `1px solid ${disabled ? "var(--color-border-2)" : `rgba(${rgb},0.35)`}`,
            background: disabled ? "rgba(255,255,255,0.04)" : `rgba(${rgb},0.08)`,
            color: disabled ? "var(--color-text-faint)" : color,
            fontFamily: "var(--font-heading)", fontSize: "0.60rem", fontWeight: 700,
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            display: "flex", alignItems: "center", gap: "0.4rem",
          }}
          onMouseEnter={(e) => { e.stopPropagation(); if (!disabled) e.currentTarget.style.background = `rgba(${rgb},0.16)`; }}
          onMouseLeave={(e) => { e.stopPropagation(); if (!disabled) e.currentTarget.style.background = `rgba(${rgb},0.08)`; }}
        >
          {isStarting ? (
            <>
              <div className="sf-spinner" style={{ width: 11, height: 11, borderWidth: 2 }} />
              Starting…
            </>
          ) : !canPlay ? (
            activeSession ? "Trial Active" : "Unavailable"
          ) : (
            "Start Mix Trial →"
          )}
        </button>
      </div>
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
      .catch(() => setError("Failed to load trivia status."))
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
        <span className="text-sub text-sm">Loading trivia…</span>
      </div>
    );
  }

  const canPlay       = status?.can_play ?? false;
  const activeSession = status?.active_session ?? null;
  const lastSession   = status?.last_session ?? null;
  const nextAt        = status?.next_available_at ?? null;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>

        <div style={{ position: "relative", display: "inline-block", marginBottom: "1.5rem" }}>
          <div style={{
            position: "absolute", inset: -8, borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${GR},0.20) 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <div style={{
            width: 96, height: 96, borderRadius: "8px", overflow: "hidden",
            border: `2px solid rgba(${GR},0.50)`,
            boxShadow: `0 0 0 4px rgba(${GR},0.10), 0 0 40px rgba(${GR},0.25)`,
          }}>
            <img
              src={oracleImg}
              alt="Trivia"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </div>

        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700,
          color: GL, marginBottom: "0.5rem",
          textShadow: `0 0 50px rgba(${GR},0.35)`,
        }}>
          Weekly Trivia
        </h1>
        <p style={{ fontSize: "0.92rem", color: "var(--color-text-secondary)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
          Once per week, a 20-question trial unlocks. Pick your language and answer fast — 5 minutes is all you get.
        </p>

        <OrnamentDivider />

        <div style={{ display: "flex", justifyContent: "center", gap: "2.5rem", flexWrap: "wrap" }}>
          {[
            ["20",           "Questions"],
            ["5 min",        "Time Limit"],
            [`${MAX_XP} XP`, "Max Reward"],
            ["Weekly",       "Reset"],
          ].map(([val, lbl]) => (
            <div key={lbl} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700, color: G, lineHeight: 1 }}>{val}</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", color: "var(--color-text-tertiary)", marginTop: "0.25rem" }}>{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", borderRadius: "4px", background: "var(--color-red-dim)", border: "1px solid var(--color-red-border)", color: "var(--color-red-bright)", fontSize: "0.82rem" }}>
          {error}
        </div>
      )}

      {/* ── Active session resume ── */}
      {activeSession && (
        <div style={{ marginBottom: "1.75rem", padding: "1.1rem 1.25rem", borderRadius: "6px", background: `rgba(${GR},0.07)`, border: `1px solid rgba(${GR},0.30)`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700, color: G, marginBottom: "0.2rem" }}>
              Trial In Progress
            </p>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
              You have an active {LANG_LABEL[activeSession.language] ?? activeSession.language} trial. Return before time runs out.
            </p>
          </div>
          <button
            onClick={handleResume}
            style={{
              padding: "0.55rem 1.25rem", borderRadius: "4px",
              border: `1px solid rgba(${GR},0.50)`,
              background: `rgba(${GR},0.12)`, color: GL,
              fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
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
        <div style={{ marginBottom: "1.75rem", padding: "1.1rem 1.25rem", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border-2)", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <svg style={{ width: 20, height: 20, color: "var(--color-text-tertiary)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.15rem" }}>
              Weekly Trial Complete
            </p>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
              Next trial available in{" "}
              <strong style={{ color: "var(--color-text)" }}>{formatCountdown(nextAt)}</strong>.
            </p>
          </div>
          {lastSession && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, color: G }}>
                {lastSession.score_xp} XP
              </p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", color: "var(--color-text-tertiary)" }}>
                {lastSession.correct_count}/{lastSession.total_questions} correct
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Section header + XP legend ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <p style={{
          fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
          color: "var(--color-text-tertiary)",
        }}>
          // choose_your_path
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[["Easy", "10 XP", "var(--color-green)"], ["Medium", "20 XP", "var(--color-amber)"], ["Hard", "30 XP", "var(--color-red-bright)"]].map(([d, xp, c]) => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <div style={{ width: 6, height: 6, borderRadius: "1px", background: c, flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", color: "var(--color-text-secondary)" }}>
                {d} · {xp}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2 × 2 Language cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1rem",
        marginBottom: "1rem",
      }}>
        {LANG_CARDS.map((card) => (
          <LangCard
            key={card.key}
            card={card}
            canPlay={canPlay}
            activeSession={activeSession}
            starting={starting}
            onStart={handleStart}
          />
        ))}
      </div>

      {/* ── Mix card (full width) ── */}
      <MixCard
        canPlay={canPlay}
        activeSession={activeSession}
        starting={starting}
        onStart={handleStart}
      />

    </div>
  );
}
