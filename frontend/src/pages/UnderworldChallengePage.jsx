import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { python }     from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java }       from "@codemirror/lang-java";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { useAuth }    from "../context/AuthContext";
import {
  failChallenge,
  failChallengeBeacon,
  getChallenge,
  submitChallenge,
} from "../services/underworldService";

const DIFF_META = {
  warning:  { label: "Warning",  color: "var(--color-amber)" },
  critical: { label: "Critical", color: "#ff8a5c" },
  fatal:    { label: "Fatal",    color: "var(--color-red-bright)" },
};

const LANG_LABELS = {
  python:     "Python",
  javascript: "JavaScript",
  java:       "Java",
  csharp:     "C#",
};

function getLangExtension(language) {
  switch (language) {
    case "python":     return python();
    case "javascript": return javascript({ jsx: false });
    case "java":       return java();
    case "csharp":     return java();   // best approximation available
    default:           return [];
  }
}

// ── Inline markdown renderer ─────────────────────────────────────────────────

function MarkdownContent({ text }) {
  if (!text) return null;
  const lines  = text.split("\n");
  const output = [];
  let i        = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith("```")) {
      const fence    = line.trimStart().match(/^```(\w*)/);
      const lang     = fence ? fence[1] : "";
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      output.push(
        <pre
          key={`code-${i}`}
          style={{
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(220,38,38,0.20)",
            borderRadius: "0.5rem",
            padding: "1rem 1.1rem",
            overflowX: "auto",
            margin: "0.9rem 0",
            fontSize: "0.8rem",
            lineHeight: 1.6,
            fontFamily: "monospace",
            color: "#e5e7eb",
          }}
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Headings
    const h3Match = line.match(/^###\s+(.*)/);
    const h2Match = line.match(/^##\s+(.*)/);
    const h1Match = line.match(/^#\s+(.*)/);
    if (h3Match) {
      output.push(<h3 key={i} style={{ fontFamily: "var(--font-heading)", fontSize: "0.85rem", color: "#fca5a5", letterSpacing: "0.08em", textTransform: "uppercase", margin: "1.2rem 0 0.4rem" }}>{inlineFormat(h3Match[1])}</h3>);
      i++; continue;
    }
    if (h2Match) {
      output.push(<h2 key={i} style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "#f87171", letterSpacing: "0.06em", margin: "1.4rem 0 0.5rem" }}>{inlineFormat(h2Match[1])}</h2>);
      i++; continue;
    }
    if (h1Match) {
      output.push(<h1 key={i} style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", color: "#ef4444", margin: "1.5rem 0 0.6rem" }}>{inlineFormat(h1Match[1])}</h1>);
      i++; continue;
    }

    // Bullet list — collect consecutive bullet lines
    if (line.match(/^[-*]\s+/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      output.push(
        <ul key={`ul-${i}`} style={{ margin: "0.6rem 0 0.6rem 1.25rem", padding: 0, listStyleType: "disc" }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ color: "rgba(255,255,255,0.78)", fontSize: "0.88rem", lineHeight: 1.65, fontFamily: "var(--font-body)" }}>
              {inlineFormat(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line — paragraph break (skip)
    if (!line.trim()) {
      i++; continue;
    }

    // Regular paragraph
    output.push(
      <p key={i} style={{ color: "rgba(255,255,255,0.78)", fontSize: "0.88rem", lineHeight: 1.7, margin: "0.5rem 0", fontFamily: "var(--font-body)" }}>
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return <div>{output}</div>;
}

/** Process **bold**, *italic*, and `inline code` within a line string. */
function inlineFormat(text) {
  const parts  = [];
  // Split on bold (**), italic (*), or inline code (`) patterns
  const regex  = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last     = 0;
  let match;
  let keyIdx   = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={keyIdx++} style={{ color: "#fff", fontWeight: 700 }}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={keyIdx++} style={{ fontStyle: "italic", color: "rgba(255,255,255,0.85)" }}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      parts.push(
        <code
          key={keyIdx++}
          style={{
            background: "rgba(0,0,0,0.50)",
            border: "1px solid rgba(220,38,38,0.18)",
            borderRadius: "0.25rem",
            padding: "0.05rem 0.35rem",
            fontFamily: "monospace",
            fontSize: "0.82em",
            color: "#fca5a5",
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

// ── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) { setValue(0); return; }
    let cancelled = false;
    const t0 = performance.now();
    function tick(now) {
      if (cancelled) return;
      const t    = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    return () => { cancelled = true; };
  }, [target, duration]);
  return value;
}

// ── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({ result, boss }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const diff     = DIFF_META[boss.difficulty] ?? { label: boss.difficulty, color: "var(--color-red-bright)" };
  const isFailed = result.status === "failed";
  const xp       = result.xp_earned ?? 0;
  const maxXp    = boss.max_xp ?? 0;
  const pct      = maxXp > 0 ? Math.round((xp / maxXp) * 100) : 0;
  const animated = useCountUp(xp);

  const glowColor = isFailed
    ? "rgba(220,38,38,0.20)"
    : pct >= 80
    ? "var(--color-green-dim)"
    : "rgba(251,191,36,0.18)";

  const scoreColor = isFailed
    ? "#ef4444"
    : pct >= 80
    ? "var(--color-green)"
    : "#fbbf24";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "3rem 1.5rem 4rem",
        maxWidth: "680px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      {/* Entity glyph */}
      <div
        style={{
          width: "160px",
          height: "160px",
          borderRadius: "12px",
          overflow: "hidden",
          border: `3px solid ${diff.color}`,
          boxShadow: `0 0 32px ${glowColor}`,
          marginBottom: "1.25rem",
          flexShrink: 0,
          "--tier-color": diff.color,
          "--tier-glow": glowColor,
        }}
      >
        <div className="uw-glyph uw-glyph--lg">{boss.glyph}</div>
      </div>

      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.2rem",
          color: "#fff",
          marginBottom: "0.25rem",
        }}
      >
        {boss.name}
      </h2>

      <div
        style={{
          padding: "0.22rem 0.75rem",
          borderRadius: "3px",
          background: "rgba(0,0,0,0.40)",
          border: `1px solid ${diff.color}55`,
          color: diff.color,
          fontFamily: "var(--font-heading)",
          fontSize: "0.6rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "2rem",
        }}
      >
        {diff.label}
      </div>

      {/* Score display */}
      <div
        style={{
          marginBottom: "1.5rem",
          padding: "1.5rem 2.5rem",
          borderRadius: "1rem",
          background: "rgba(0,0,0,0.35)",
          border: `1px solid ${scoreColor}33`,
          boxShadow: `0 0 30px ${glowColor}`,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "3rem",
            fontWeight: 700,
            color: scoreColor,
            lineHeight: 1,
            marginBottom: "0.35rem",
          }}
        >
          {animated}
          <span style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.55)", marginLeft: "0.25rem" }}>
            / {maxXp} XP
          </span>
        </div>

        <div
          style={{
            padding: "0.28rem 0.85rem",
            borderRadius: "3px",
            background: `var(--color-green-dim)`,
            border: "1px solid var(--color-green-border)",
            color: "var(--color-green)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.62rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            display: "inline-block",
          }}
        >
          +{xp} XP Earned
        </div>
      </div>

      {/* Verdict */}
      {result.boss_verdict && (
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderRadius: "0.75rem",
            background: "rgba(127,29,29,0.15)",
            border: "1px solid rgba(220,38,38,0.22)",
            marginBottom: "1.25rem",
            maxWidth: "560px",
            width: "100%",
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontStyle: "italic",
              fontSize: "0.92rem",
              color: "rgba(255,255,255,0.80)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            "{result.boss_verdict}"
          </p>
        </div>
      )}

      {/* Technical feedback (collapsible) */}
      {result.technical_feedback && (
        <div style={{ width: "100%", maxWidth: "560px", marginBottom: "1.5rem" }}>
          <button
            onClick={() => setShowFeedback((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.40)",
              fontFamily: "var(--font-heading)",
              fontSize: "0.62rem",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.3rem 0",
              marginBottom: "0.5rem",
            }}
          >
            <span>{showFeedback ? "▾" : "▸"}</span>
            Technical Feedback
          </button>
          {showFeedback && (
            <div
              style={{
                padding: "1rem 1.1rem",
                borderRadius: "0.5rem",
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                textAlign: "left",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.84rem",
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.65,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.technical_feedback}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Return link */}
      <Link
        to="/underworld"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.55rem 1.5rem",
          borderRadius: "0.5rem",
          border: "1px solid rgba(220,38,38,0.40)",
          background: "rgba(220,38,38,0.10)",
          color: "#fca5a5",
          fontFamily: "var(--font-heading)",
          fontSize: "0.68rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textDecoration: "none",
          transition: "background 0.18s",
        }}
      >
        ← Return to Stack Trace
      </Link>
    </div>
  );
}

// ── Main challenge page ───────────────────────────────────────────────────────

export default function UnderworldChallengePage() {
  const { challengeId } = useParams();
  const location        = useLocation();
  const { updateUser }  = useAuth();

  const [challenge,    setChallenge]    = useState(null);
  const [boss,         setBoss]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const [code,         setCode]         = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [result,       setResult]       = useState(null);   // set after submit or fail

  // Timer state
  const [timeLeft,     setTimeLeft]     = useState(null);   // seconds remaining
  const timerRef      = useRef(null);
  const failedRef     = useRef(false);     // prevent double-fail

  // ── Load challenge ──────────────────────────────────────────────────────

  useEffect(() => {
    const state = location.state;
    if (state?.challenge && state?.boss) {
      initChallenge(state.challenge, state.boss);
      setLoading(false);
    } else {
      getChallenge(challengeId)
        .then(({ challenge: c, boss: b }) => {
          initChallenge(c, b);
        })
        .catch((err) => {
          setError(err?.response?.data?.error ?? "Failed to load challenge");
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  function initChallenge(c, b) {
    setChallenge(c);
    setBoss(b);

    // If already resolved show result immediately
    if (c.status !== "active") {
      setResult(c);
      return;
    }

    const timeSeconds   = (b.time_minutes ?? 5) * 60;
    const startedAtMs   = new Date(c.started_at).getTime();
    const remaining     = Math.floor((startedAtMs + timeSeconds * 1000 - Date.now()) / 1000);

    if (remaining <= 0) {
      // Time already expired — auto-fail immediately
      doFail(c.id);
      return;
    }

    setTimeLeft(remaining);
  }

  // ── Timer tick ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (timeLeft === null || result !== null) return;

    if (timeLeft <= 0) {
      if (!failedRef.current) doFail(challenge?.id);
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, result]);

  // ── beforeunload beacon ───────────────────────────────────────────────────

  useEffect(() => {
    function handleBeforeUnload() {
      if (challenge && challenge.status === "active" && result === null) {
        failChallengeBeacon(challenge.id);
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [challenge, result]);

  // ── Fail handler ──────────────────────────────────────────────────────────

  const doFail = useCallback(async (cid) => {
    if (failedRef.current) return;
    failedRef.current = true;
    clearTimeout(timerRef.current);
    try {
      const data = await failChallenge(cid ?? challengeId);
      setResult({ status: "failed", xp_earned: 0, boss_verdict: null, technical_feedback: null, ...data });
    } catch {
      setResult({ status: "failed", xp_earned: 0 });
    }
  }, [challengeId]);

  // ── Submit handler ────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!code.trim()) return;
    setSubmitting(true);
    clearTimeout(timerRef.current);
    try {
      const data = await submitChallenge(challengeId, code);
      if (data.challenge?.xp_earned) {
        updateUser({ total_xp: undefined }); // trigger re-fetch via context or force refresh
      }
      setResult(data.challenge);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 410) {
        // Time expired according to server
        doFail(challengeId);
      } else {
        alert(err?.response?.data?.error ?? "Failed to submit solution");
        setSubmitting(false);
      }
    }
  }

  // ── Timer display helpers ─────────────────────────────────────────────────

  function formatTime(secs) {
    if (secs == null) return "--:--";
    const m = Math.floor(Math.max(secs, 0) / 60);
    const s = Math.max(secs, 0) % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function timerColor(secs) {
    if (secs == null) return "#fff";
    if (secs < 30)  return "#ef4444";
    if (secs < 60)  return "#f97316";
    if (secs < 180) return "#fb923c";
    return "#fff";
  }

  function timerFlashing(secs) {
    return secs != null && secs < 30;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0" }}>
        <div
          className="sf-spinner"
          style={{
            width: "28px", height: "28px", borderWidth: "3px",
            borderColor: "rgba(220,38,38,0.3)", borderTopColor: "#dc2626",
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <p style={{ color: "#fca5a5", fontFamily: "var(--font-heading)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          {error}
        </p>
        <Link to="/underworld" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textDecoration: "none", fontFamily: "var(--font-heading)", letterSpacing: "0.10em" }}>
          ← Return to Stack Trace
        </Link>
      </div>
    );
  }

  if (!challenge || !boss) return null;

  const diff   = DIFF_META[boss.difficulty] ?? { label: boss.difficulty, color: "var(--color-red-bright)" };

  // Show result screen
  if (result !== null) {
    return <ResultScreen result={result} boss={boss} />;
  }

  const tColor    = timerColor(timeLeft);
  const tFlashing = timerFlashing(timeLeft);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      {/* ── Desktop: two-column; mobile: stacked ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
        className="underworld-challenge-grid"
      >
        {/* ── Left: boss info + challenge text ── */}
        <div
          style={{
            background: "rgba(127,29,29,0.10)",
            border: "1px solid rgba(220,38,38,0.15)",
            borderRadius: "1rem",
            padding: "1.5rem",
            overflowY: "auto",
            maxHeight: "80vh",
          }}
        >
          {/* Boss header */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.25rem" }}>
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "10px",
                overflow: "hidden",
                border: `2px solid ${diff.color}`,
                flexShrink: 0,
                "--tier-color": diff.color,
              }}
            >
              <div className="uw-glyph uw-glyph--md">{boss.glyph}</div>
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1rem",
                  color: "#fff",
                  margin: 0,
                  marginBottom: "0.25rem",
                }}
              >
                {boss.name}
              </h2>
              <div
                style={{
                  display: "inline-block",
                  padding: "0.18rem 0.55rem",
                  borderRadius: "3px",
                  background: "rgba(0,0,0,0.40)",
                  border: `1px solid ${diff.color}55`,
                  color: diff.color,
                  fontFamily: "var(--font-heading)",
                  fontSize: "0.58rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {diff.label}
              </div>
            </div>
          </div>

          {/* Boss taunt */}
          <div
            style={{
              padding: "0.9rem 1.1rem",
              borderRadius: "0.6rem",
              background: "rgba(0,0,0,0.30)",
              border: "1px solid rgba(220,38,38,0.22)",
              marginBottom: "1.5rem",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontStyle: "italic",
                fontSize: "0.82rem",
                color: "rgba(255,200,200,0.85)",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              "{challenge.boss_taunt}"
            </p>
          </div>

          {/* Challenge text */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.60rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.52)",
                marginBottom: "0.75rem",
              }}
            >
              Your Challenge
            </div>
            <MarkdownContent text={challenge.challenge_text} />
          </div>
        </div>

        {/* ── Right: timer + editor + actions ── */}
        <div
          style={{
            position: "sticky",
            top: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Timer */}
          <div
            style={{
              background: "rgba(0,0,0,0.40)",
              border: "1px solid rgba(220,38,38,0.20)",
              borderRadius: "0.75rem",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "0.58rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.52)",
                  marginBottom: "0.3rem",
                }}
              >
                Time Remaining
              </div>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: tColor,
                  letterSpacing: "0.05em",
                  animation: tFlashing ? "uwFlash 0.6s ease-in-out infinite alternate" : "none",
                }}
              >
                {formatTime(timeLeft)}
              </div>
            </div>
            {/* Language badge */}
            <div
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "3px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.50)",
                fontFamily: "var(--font-heading)",
                fontSize: "0.62rem",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >
              {LANG_LABELS[boss.language] ?? boss.language}
            </div>
          </div>

          {/* CodeMirror editor */}
          <div
            style={{
              borderRadius: "0.75rem",
              overflow: "hidden",
              border: "1px solid rgba(220,38,38,0.25)",
              minHeight: "300px",
            }}
          >
            <CodeMirror
              value={code}
              onChange={(val) => setCode(val)}
              theme={vscodeDark}
              extensions={[getLangExtension(boss.language)]}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
              }}
              style={{ minHeight: "300px", fontSize: "0.85rem" }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || !code.trim()}
              style={{
                flex: 1,
                padding: "0.65rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(220,38,38,0.50)",
                background: submitting || !code.trim()
                  ? "rgba(220,38,38,0.06)"
                  : "rgba(220,38,38,0.18)",
                color: submitting || !code.trim() ? "rgba(252,165,165,0.40)" : "#fca5a5",
                fontFamily: "var(--font-heading)",
                fontSize: "0.68rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: submitting || !code.trim() ? "not-allowed" : "pointer",
                transition: "background 0.18s, color 0.18s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {submitting ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px", height: "12px",
                      borderRadius: "50%",
                      border: "2px solid rgba(252,165,165,0.3)",
                      borderTopColor: "#fca5a5",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Evaluating…
                </>
              ) : (
                "Submit to the Stack Trace"
              )}
            </button>

            <button
              onClick={() => doFail(challenge.id)}
              disabled={submitting}
              style={{
                padding: "0.65rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "transparent",
                color: "rgba(255,255,255,0.52)",
                fontFamily: "var(--font-heading)",
                fontSize: "0.62rem",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "color 0.18s, border-color 0.18s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.color = "#fca5a5";
                  e.currentTarget.style.borderColor = "rgba(220,38,38,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.52)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
              }}
            >
              Give Up
            </button>
          </div>
        </div>
      </div>

      {/* Responsive overrides injected as a style tag */}
      <style>{`
        @keyframes uwFlash {
          from { opacity: 1; }
          to   { opacity: 0.35; }
        }
        @media (max-width: 767px) {
          .underworld-challenge-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
