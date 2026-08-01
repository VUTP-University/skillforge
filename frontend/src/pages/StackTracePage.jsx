import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProcesses, startChallenge } from "../services/stackTraceService";

const DIFF_META = {
  warning:  { label: "Warning",  color: "var(--color-amber)",      dimBorder: "rgba(255,204,102,0.20)", hotBorder: "rgba(255,204,102,0.65)", glow: "rgba(255,204,102,0.25)", bg: "rgba(255,204,102,0.10)" },
  critical: { label: "Critical", color: "#ff8a5c",                 dimBorder: "rgba(255,138,92,0.20)",  hotBorder: "rgba(255,138,92,0.65)",  glow: "rgba(255,138,92,0.25)",  bg: "rgba(255,138,92,0.10)"  },
  fatal:    { label: "Fatal",    color: "var(--color-red-bright)", dimBorder: "rgba(255,95,86,0.20)",   hotBorder: "rgba(255,95,86,0.65)",   glow: "rgba(255,95,86,0.25)",   bg: "rgba(255,95,86,0.10)"   },
};

const LANG_LABELS = { python: "Python", javascript: "JavaScript", java: "Java", csharp: "C#" };
const LANG_TABS   = ["all", "python", "javascript", "java", "csharp"];

function formatReset(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ── Icons ──────────────────────────────────────────────────── */

function IconChevron({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function IconCheck({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

/* ── Process card (landscape layout) ───────────────────────────── */

function ProcessCard({ process, onChallenge, isStarting }) {
  const [hovered, setHovered] = useState(false);
  const diff = DIFF_META[process.difficulty] ?? DIFF_META.warning;

  return (
    <div
      className="st-process-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "linear-gradient(135deg, rgba(18,2,2,0.97) 0%, rgba(7,0,0,0.99) 100%)",
        border: hovered ? `1px solid ${diff.hotBorder}` : `1px solid ${diff.dimBorder}`,
        boxShadow: hovered
          ? `0 0 56px ${diff.glow}, 0 12px 48px rgba(0,0,0,0.90), inset 0 1px 0 rgba(255,80,80,0.06)`
          : `0 2px 20px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.025)`,
        transition: "border-color 0.25s, box-shadow 0.25s",
        cursor: "default",
      }}
    >
      {/* ── Glyph panel ── */}
      <div className="st-process-portrait" style={{ "--tier-color": diff.color, "--tier-glow": diff.glow }}>
        <div className="st-glyph st-glyph--lg">{process.glyph}</div>

        {/* Difficulty badge */}
        <div style={{
          position: "absolute", top: "0.6rem", left: "0.6rem",
          padding: "0.20rem 0.60rem", borderRadius: "3px",
          background: "rgba(0,0,0,0.85)",
          border: `1px solid ${diff.dimBorder}`,
          color: diff.color,
          fontFamily: "var(--font-heading)", fontSize: "0.54rem",
          letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700,
        }}>
          {diff.label}
        </div>
      </div>

      {/* ── Info panel ── */}
      <div style={{
        flex: 1, minWidth: 0,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "1.1rem 1.15rem",
        gap: "0.6rem",
      }}>
        {/* Name + language + lore + specialty */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
            <h3 style={{
              fontFamily: "var(--font-heading)", fontWeight: 700,
              fontSize: "1.05rem", letterSpacing: "0.02em", lineHeight: 1.2, margin: 0,
              color: hovered ? diff.color : "rgba(255,220,220,0.96)",
              textShadow: hovered ? `0 0 20px ${diff.glow}` : "none",
              transition: "color 0.22s, text-shadow 0.22s",
            }}>
              {process.name}
            </h3>
            <span style={{
              flexShrink: 0, padding: "0.18rem 0.55rem", borderRadius: "3px",
              background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,215,215,0.65)",
              fontFamily: "var(--font-heading)", fontSize: "0.53rem",
              letterSpacing: "0.10em", textTransform: "uppercase",
            }}>
              {LANG_LABELS[process.language] ?? process.language}
            </span>
          </div>

          <p style={{
            fontFamily: "var(--font-heading)", fontStyle: "italic",
            fontSize: "0.64rem", letterSpacing: "0.03em", lineHeight: 1.5,
            color: "rgba(255,180,180,0.60)", margin: 0,
          }}>
            "{process.lore}"
          </p>

          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.73rem", lineHeight: 1.5,
            color: "rgba(255,210,210,0.65)", margin: 0,
          }}>
            {process.specialty}
          </p>
        </div>

        {/* Stats + button */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          <div style={{
            height: "1px",
            background: `linear-gradient(to right, ${diff.dimBorder}, transparent 70%)`,
          }}/>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.30rem", color: "rgba(255,195,195,0.60)" }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 2"/>
              </svg>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.57rem", letterSpacing: "0.07em" }}>
                {process.time_minutes}m
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.30rem", color: diff.color }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
              </svg>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.57rem", letterSpacing: "0.07em", fontWeight: 700 }}>
                {process.max_xp} XP
              </span>
            </div>
          </div>

          {process.on_cooldown ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              padding: "0.52rem 1rem", borderRadius: "8px",
              background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <IconCheck size={13} color="rgba(255,255,255,0.48)" />
              <span style={{
                fontFamily: "var(--font-heading)", fontSize: "0.59rem",
                letterSpacing: "0.10em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.48)",
              }}>
                Resolved · Resets {formatReset(process.cooldown_resets_at)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => onChallenge(process)}
              disabled={isStarting}
              style={{
                width: "100%", padding: "0.60rem 1rem", borderRadius: "8px",
                border: hovered ? `1px solid ${diff.hotBorder}` : `1px solid ${diff.dimBorder}`,
                background: hovered ? diff.bg : "rgba(80,0,0,0.20)",
                color: isStarting ? "rgba(252,165,165,0.55)" : (hovered ? diff.color : "rgba(252,165,165,0.80)"),
                fontFamily: "var(--font-heading)", fontSize: "0.65rem",
                letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700,
                cursor: isStarting ? "not-allowed" : "pointer",
                transition: "all 0.22s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                boxShadow: hovered ? `0 0 28px ${diff.glow}` : "none",
              }}
            >
              {isStarting ? (
                <>
                  <div style={{
                    width: 11, height: 11, borderRadius: "50%",
                    border: "2px solid rgba(252,165,165,0.20)", borderTopColor: "#fca5a5",
                    animation: "spin 0.7s linear infinite",
                  }}/>
                  Connecting…
                </>
              ) : (
                <>
                  <IconChevron size={13} color={hovered ? diff.color : "rgba(252,165,165,0.60)"}/>
                  Debug
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function StackTracePage() {
  const navigate = useNavigate();

  const [processes,     setProcesses]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [langFilter, setLangFilter] = useState("all");
  const [starting,   setStarting]   = useState(null);

  useEffect(() => {
    getProcesses()
      .then((data) => setProcesses(data.processes))
      .catch((err)  => setError(err?.response?.data?.error ?? "Failed to load the Stack Trace"))
      .finally(()   => setLoading(false));
  }, []);

  async function handleChallenge(process) {
    setStarting(process.id);
    try {
      const data = await startChallenge(process.id);
      navigate(`/stack-trace/challenge/${data.challenge.id}`, {
        state: { challenge: data.challenge, process: data.process },
      });
    } catch (err) {
      alert(err?.response?.data?.error ?? "Failed to start challenge");
    } finally {
      setStarting(null);
    }
  }

  const filtered = langFilter === "all" ? processes : processes.filter((b) => b.language === langFilter);

  return (
    <div>

      {/* ── HERO ── */}
      <div style={{ textAlign: "center", paddingBottom: "3rem", paddingTop: "0.5rem" }}>

        <h1 style={{
          fontFamily: "var(--font-brand)", fontWeight: 800,
          fontSize: "clamp(2.4rem, 6vw, 4rem)",
          color: "#fff", lineHeight: 1.1, margin: 0, marginBottom: "0.6rem",
          textShadow: "0 0 120px rgba(220,38,38,0.90), 0 0 50px rgba(249,115,22,0.55), 0 0 15px rgba(239,68,68,0.45)",
          letterSpacing: "0.04em",
        }}>
          The Stack Trace
        </h1>

        <p style={{
          fontFamily: "var(--font-heading)", fontSize: "0.68rem",
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: "rgba(252,165,165,0.58)", marginBottom: "1.8rem",
        }}>
          Debug the hostile processes lurking in the deepest frames
        </p>

        {/* Red ornate divider */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{ width: 70, height: 1, background: "linear-gradient(to right, transparent, rgba(220,38,38,0.70))" }}/>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(220,38,38,0.55)", boxShadow: "0 0 6px rgba(220,38,38,0.70)" }}/>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#b91c1c", boxShadow: "0 0 14px rgba(185,28,28,1.0)" }}/>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(220,38,38,0.55)", boxShadow: "0 0 6px rgba(220,38,38,0.70)" }}/>
          <div style={{ width: 70, height: 1, background: "linear-gradient(to left,  transparent, rgba(220,38,38,0.70))" }}/>
        </div>

        {!loading && processes.length > 0 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.65rem",
            padding: "0.58rem 1.3rem", borderRadius: "8px",
            background: "rgba(60,0,0,0.55)", border: "1px solid rgba(180,30,30,0.22)",
            color: "rgba(252,165,165,0.58)",
            fontFamily: "var(--font-heading)", fontSize: "0.63rem",
            letterSpacing: "0.10em", textTransform: "uppercase",
          }}>
            <svg style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            {processes.length} hostile processes detected · one trace per process per day
          </div>
        )}
      </div>

      {/* ── Language filter ── */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "2.5rem" }}>
        {LANG_TABS.map((tab) => {
          const active = tab === langFilter;
          return (
            <button
              key={tab}
              onClick={() => setLangFilter(tab)}
              style={{
                padding: "0.40rem 1.10rem", borderRadius: "4px", cursor: "pointer",
                border:     active ? "1px solid rgba(220,38,38,0.60)" : "1px solid rgba(255,255,255,0.08)",
                background: active ? "rgba(180,0,0,0.22)"             : "rgba(10,0,0,0.35)",
                color:      active ? "#fca5a5"                         : "rgba(255,255,255,0.52)",
                fontFamily: "var(--font-heading)", fontSize: "0.63rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                transition: "all 0.18s",
                boxShadow: active ? "0 0 16px rgba(220,38,38,0.22)" : "none",
              }}
            >
              {tab === "all" ? "All Processes" : LANG_LABELS[tab] ?? tab}
            </button>
          );
        })}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "3px solid rgba(220,38,38,0.18)", borderTopColor: "#dc2626",
            animation: "spin 0.85s linear infinite",
          }}/>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          textAlign: "center", padding: "4rem 1rem",
          fontFamily: "var(--font-heading)", fontSize: "0.78rem",
          letterSpacing: "0.08em", color: "#f87171",
        }}>
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{
          textAlign: "center", padding: "4rem 1rem",
          color: "rgba(252,165,165,0.52)", fontFamily: "var(--font-heading)",
          fontSize: "0.75rem", letterSpacing: "0.10em",
        }}>
          No processes match this filter.
        </div>
      )}

      {/* ── Process grid ── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1.25rem",
        }}>
          {filtered.map((process) => (
            <ProcessCard
              key={process.id}
              process={process}
              onChallenge={handleChallenge}
              isStarting={starting === process.id}
            />
          ))}
        </div>
      )}

      </div>
  );
}
