import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTriviaStatus, startTrivia } from "../services/triviaService";
import oracleImg  from "../assets/img/Oracle.jpg";
import pythonImg  from "../assets/img/trivia/Python-Trivia.jpg";
import jsImg      from "../assets/img/trivia/JS-Trivia.jpg";
import javaImg    from "../assets/img/trivia/Java-Trivia.jpg";
import csharpImg  from "../assets/img/trivia/CSharp-Trivia.jpg";

/* ── Constants ──────────────────────────────────────────────────────────── */

const G   = "#eab308";
const GL  = "#fde047";
const GR  = "234,179,8";
const MAX_XP = 7 * 10 + 8 * 20 + 5 * 30; // 380

const LANG_CARDS = [
  {
    key:      "python",
    image:    pythonImg,
    title:    "Serpent's Trial",
    epithet:  "Path of the Serpent",
    label:    "Python",
    desc:     "Ancient wisdom coils through the enchanted grove",
    color:    "#2dd4bf",
    colorRgb: "45,212,191",
    cta:      "Enter the Grove",
  },
  {
    key:      "javascript",
    image:    jsImg,
    title:    "Crystal Codex",
    epithet:  "Path of Lightning",
    label:    "JavaScript",
    desc:     "Power forged in the alchemist's golden flame",
    color:    "#fbbf24",
    colorRgb: "251,191,36",
    cta:      "Ignite the Crystal",
  },
  {
    key:      "java",
    image:    javaImg,
    title:    "Brewer's Sanctum",
    epithet:  "Path of the Scholar",
    label:    "Java",
    desc:     "Ancient tomes steeped in centuries of arcane lore",
    color:    "#fb923c",
    colorRgb: "251,146,60",
    cta:      "Open the Sanctum",
  },
  {
    key:      "csharp",
    image:    csharpImg,
    title:    "Void Ascendancy",
    epithet:  "Path of Shadows",
    label:    "C#",
    desc:     "Dark magic crystallized beyond the castle's keep",
    color:    "#a78bfa",
    colorRgb: "167,139,250",
    cta:      "Pierce the Void",
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
      <span style={{ color: `rgba(${GR},0.60)`, fontSize: "0.8rem", letterSpacing: "0.2em" }}>✦</span>
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
        borderRadius: "16px",
        overflow: "hidden",
        height: "310px",
        cursor: disabled ? "default" : "pointer",
        border: `1px solid ${active ? `rgba(${card.colorRgb},0.55)` : "rgba(255,255,255,0.08)"}`,
        boxShadow: active
          ? `0 0 36px rgba(${card.colorRgb},0.18), 0 8px 40px rgba(0,0,0,0.55)`
          : "0 4px 20px rgba(0,0,0,0.40)",
        transition: "border 0.25s, box-shadow 0.25s, transform 0.22s",
        transform: active ? "translateY(-4px)" : "translateY(0)",
        opacity: disabled && !canPlay ? 0.55 : 1,
      }}
    >
      {/* Full-bleed image */}
      <img
        src={card.image}
        alt={card.label}
        draggable={false}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          transform: active ? "scale(1.07)" : "scale(1.01)",
          transition: "transform 0.45s ease, filter 0.28s",
          filter: disabled
            ? "brightness(0.50) saturate(0.45)"
            : active ? "brightness(0.95)" : "brightness(0.75)",
        }}
      />

      {/* Gradient overlay — heavy at bottom, light at top */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(
          to top,
          rgba(3,3,14,0.98) 25%,
          rgba(3,3,14,0.60) 55%,
          rgba(3,3,14,0.12) 100%
        )`,
      }} />

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
        borderRadius: "5px",
        background: "rgba(0,0,0,0.60)",
        border: `1px solid rgba(${card.colorRgb},0.38)`,
        backdropFilter: "blur(8px)",
        fontFamily: "var(--font-heading)",
        fontSize: "0.56rem", fontWeight: 700,
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: card.color,
      }}>
        {card.label}
      </div>

      {/* Top-right: epithet */}
      <div style={{
        position: "absolute", top: "1rem", right: "0.9rem",
        fontFamily: "var(--font-heading)",
        fontSize: "0.50rem", fontWeight: 600,
        letterSpacing: "0.10em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.28)",
        textAlign: "right",
        maxWidth: "110px",
        lineHeight: 1.3,
      }}>
        {card.epithet}
      </div>

      {/* Bottom content */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "1rem 1.15rem 1.1rem",
      }}>
        <h3 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.0rem", fontWeight: 700,
          color: "#fff",
          marginBottom: "0.28rem",
          lineHeight: 1.2,
          textShadow: "0 1px 8px rgba(0,0,0,0.95)",
        }}>
          {card.title}
        </h3>
        <p style={{
          fontSize: "0.70rem",
          color: "rgba(255,255,255,0.40)",
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
            borderRadius: "8px",
            border: `1px solid ${disabled ? "rgba(255,255,255,0.10)" : `rgba(${card.colorRgb},0.42)`}`,
            background: disabled
              ? "rgba(0,0,0,0.45)"
              : active
              ? `rgba(${card.colorRgb},0.20)`
              : `rgba(${card.colorRgb},0.10)`,
            color: disabled ? "rgba(255,255,255,0.22)" : card.color,
            fontFamily: "var(--font-heading)",
            fontSize: "0.60rem", fontWeight: 700,
            letterSpacing: "0.10em", textTransform: "uppercase",
            cursor: disabled ? "not-allowed" : "pointer",
            backdropFilter: "blur(6px)",
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
              Beginning…
            </>
          ) : !canPlay ? (
            activeSession ? "Trial Active" : "Unavailable"
          ) : (
            `${card.cta} →`
          )}
        </button>
      </div>
    </div>
  );
}

function MixCard({ canPlay, activeSession, starting, onStart }) {
  const [hovered, setHovered] = useState(false);
  const isStarting = starting === "mix";
  const disabled   = !canPlay || !!activeSession || isStarting;
  const active     = hovered && !disabled;
  const rgb        = "3,233,244";
  const color      = "#03e9f4";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { if (!disabled) onStart("mix"); }}
      style={{
        position: "relative",
        borderRadius: "16px",
        border: `1px solid ${active ? `rgba(${rgb},0.38)` : "rgba(255,255,255,0.07)"}`,
        background: active ? "rgba(3,233,244,0.04)" : "rgba(255,255,255,0.02)",
        padding: "1.4rem 1.75rem",
        display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap",
        overflow: "hidden",
        transition: "all 0.25s ease",
        boxShadow: active ? `0 0 44px rgba(${rgb},0.08)` : "none",
        opacity: disabled && !isStarting ? 0.55 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {/* Rainbow accent line — top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(to right, #2dd4bf, #fbbf24, #fb923c, #a78bfa)",
        opacity: active ? 0.65 : 0.18,
        transition: "opacity 0.25s",
      }} />

      {/* ∞ emblem */}
      <div style={{
        width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
        border: `1px solid rgba(${rgb},0.28)`,
        background: `rgba(${rgb},0.05)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.75rem", lineHeight: 1,
        color,
        boxShadow: active ? `0 0 20px rgba(${rgb},0.20)` : "none",
        transition: "box-shadow 0.25s",
      }}>
        ∞
      </div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
          <span style={{
            fontFamily: "var(--font-heading)", fontSize: "0.56rem", fontWeight: 700,
            letterSpacing: "0.14em", textTransform: "uppercase", color,
            padding: "0.18rem 0.5rem", borderRadius: "4px",
            background: `rgba(${rgb},0.08)`, border: `1px solid rgba(${rgb},0.22)`,
          }}>
            All Paths
          </span>
          <span style={{
            fontFamily: "var(--font-heading)", fontSize: "0.50rem",
            letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase",
          }}>
            Grand Confluence
          </span>
        </div>
        <h3 style={{
          fontFamily: "var(--font-heading)", fontSize: "1.0rem", fontWeight: 700,
          color: "#fff", marginBottom: "0.25rem", lineHeight: 1.2,
        }}>
          The Grand Confluence
        </h3>
        <p style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
          Questions drawn from all four realms — Python, JavaScript, Java, and C#.
          Face every discipline as one. The ultimate ordeal.
        </p>
      </div>

      {/* Stats + button */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", flexShrink: 0, alignItems: "flex-end" }}>
        <div style={{ display: "flex", gap: "1.25rem" }}>
          {[["20", "Questions"], ["380 XP", "Max Reward"], ["5 min", "Limit"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.72)", lineHeight: 1 }}>{v}</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.48rem", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginTop: "0.2rem" }}>{l}</p>
            </div>
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); if (!disabled) onStart("mix"); }}
          disabled={disabled}
          style={{
            padding: "0.55rem 1.5rem", borderRadius: "8px",
            border: `1px solid ${disabled ? "rgba(255,255,255,0.10)" : `rgba(${rgb},0.35)`}`,
            background: disabled ? "rgba(255,255,255,0.04)" : `rgba(${rgb},0.08)`,
            color: disabled ? "rgba(255,255,255,0.22)" : color,
            fontFamily: "var(--font-heading)", fontSize: "0.60rem", fontWeight: 700,
            letterSpacing: "0.10em", textTransform: "uppercase",
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
              Beginning…
            </>
          ) : !canPlay ? (
            activeSession ? "Trial Active" : "Unavailable"
          ) : (
            "Enter Confluence →"
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

      {/* ── Hero ── */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>

        <div style={{ position: "relative", display: "inline-block", marginBottom: "1.5rem" }}>
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

        <div style={{ display: "flex", justifyContent: "center", gap: "2.5rem", flexWrap: "wrap" }}>
          {[
            ["20",           "Questions"],
            ["5 min",        "Time Limit"],
            [`${MAX_XP} XP`, "Max Reward"],
            ["Weekly",       "Reset"],
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
              You have an active {LANG_LABEL[activeSession.language] ?? activeSession.language} trial. Return before time runs out.
            </p>
          </div>
          <button
            onClick={handleResume}
            style={{
              padding: "0.55rem 1.25rem", borderRadius: "8px",
              border: `1px solid rgba(${GR},0.50)`,
              background: `rgba(${GR},0.12)`, color: GL,
              fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
              letterSpacing: "0.10em", textTransform: "uppercase",
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
              The Oracle rests. Next trial available in{" "}
              <strong style={{ color: "rgba(255,255,255,0.70)" }}>{formatCountdown(nextAt)}</strong>.
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

      {/* ── Section header + XP legend ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <p style={{
          fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700,
          letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.26)",
        }}>
          Choose Your Path
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[["Easy", "10 XP", "#4ade80"], ["Medium", "20 XP", "#fbbf24"], ["Hard", "30 XP", "#f87171"]].map(([d, xp, c]) => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <div style={{ width: 6, height: 6, borderRadius: "1.5px", background: c, transform: "rotate(45deg)", flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", letterSpacing: "0.10em", color: "rgba(255,255,255,0.35)" }}>
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

      {/* ── Mix / Confluence card (full width) ── */}
      <MixCard
        canPlay={canPlay}
        activeSession={activeSession}
        starting={starting}
        onStart={handleStart}
      />

    </div>
  );
}
