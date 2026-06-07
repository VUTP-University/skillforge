import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { submitTrivia } from "../services/triviaService";

/* ── Constants ──────────────────────────────────────────────────────────── */

const OPTION_LABELS = ["A", "B", "C", "D"];

const DIFF_META = {
  easy:   { label: "Easy",   color: "#4ade80", border: "rgba(74,222,128,0.35)",  bg: "rgba(74,222,128,0.08)"  },
  medium: { label: "Medium", color: "#fbbf24", border: "rgba(251,191,36,0.35)",  bg: "rgba(251,191,36,0.08)"  },
  hard:   { label: "Hard",   color: "#f87171", border: "rgba(248,113,113,0.35)", bg: "rgba(248,113,113,0.08)" },
};

const FEEDBACK_DELAY_CORRECT = 900;
const FEEDBACK_DELAY_WRONG   = 1400;

/* ── Timer ring ─────────────────────────────────────────────────────────── */

const RING_R   = 52;
const RING_C   = 2 * Math.PI * RING_R; // ≈ 326.7

function timerColor(seconds) {
  if (seconds > 120) return "#03e9f4";
  if (seconds > 60)  return "#eab308";
  return "#f87171";
}

function TimerRing({ timeLeft, total = 300 }) {
  const pct    = Math.max(0, timeLeft / total);
  const offset = RING_C * (1 - pct);
  const color  = timerColor(timeLeft);
  const mins   = Math.floor(timeLeft / 60);
  const secs   = timeLeft % 60;

  return (
    <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
      <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx="60" cy="60" r={RING_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        {/* Progress */}
        <circle
          cx="60" cy="60" r={RING_R}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${RING_C} ${RING_C}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.5s ease", filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      {/* Time label */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "0.1rem",
      }}>
        <span style={{
          fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700,
          color, lineHeight: 1, letterSpacing: "0.04em",
          textShadow: timeLeft <= 60 ? `0 0 12px ${color}` : "none",
          animation: timeLeft <= 30 ? "pulse 1s ease-in-out infinite" : "none",
        }}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.42rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
          remaining
        </span>
      </div>
    </div>
  );
}

/* ── Progress gems ──────────────────────────────────────────────────────── */

function ProgressGem({ state }) {
  // state: "pending" | "correct" | "wrong" | "current"
  const colors = {
    pending: { fill: "transparent",  border: "rgba(255,255,255,0.15)" },
    current: { fill: "rgba(3,233,244,0.25)", border: "#03e9f4" },
    correct: { fill: "#4ade80",      border: "#4ade80" },
    wrong:   { fill: "#f87171",      border: "#f87171" },
  };
  const c = colors[state];
  return (
    <div style={{
      width: 10, height: 10, transform: "rotate(45deg)",
      background: c.fill,
      border: `1px solid ${c.border}`,
      borderRadius: "2px",
      boxShadow: state === "current" ? "0 0 8px rgba(3,233,244,0.50)" : state === "correct" ? "0 0 6px rgba(74,222,128,0.50)" : "none",
      transition: "all 0.3s ease",
      flexShrink: 0,
    }} />
  );
}

/* ── Results screen ─────────────────────────────────────────────────────── */

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let cancelled = false;
    const t0 = performance.now();
    const tick = (now) => {
      if (cancelled) return;
      const t    = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => { cancelled = true; };
  }, [target, duration]);
  return val;
}

function ResultsScreen({ data, timedOut }) {
  const { updateUser } = useAuth();
  const animXP = useCountUp(data.xp_earned);

  useEffect(() => {
    if (data.xp_earned > 0) {
      updateUser((prev) => ({ total_xp: (prev?.total_xp ?? 0) + data.xp_earned }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byDiff = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
  data.results.forEach((r) => {
    byDiff[r.difficulty].total++;
    if (r.was_correct) byDiff[r.difficulty].correct++;
  });

  const accuracy = Math.round((data.correct_count / data.total) * 100);

  return (
    <div style={{ maxWidth: "580px", margin: "0 auto", textAlign: "center" }}>
      {/* Icon */}
      <div style={{ margin: "0 auto 1.25rem", width: 72, height: 72, borderRadius: "50%", background: timedOut ? "rgba(248,113,113,0.10)" : "rgba(234,179,8,0.12)", border: `1px solid ${timedOut ? "rgba(248,113,113,0.30)" : "rgba(234,179,8,0.35)"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 32px ${timedOut ? "rgba(248,113,113,0.12)" : "rgba(234,179,8,0.15)"}` }}>
        {timedOut ? (
          <svg style={{ width: 30, height: 30, color: "#f87171" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg style={{ width: 30, height: 30, color: "#eab308" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        )}
      </div>

      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.9rem", fontWeight: 700, color: timedOut ? "#f87171" : "#fde047", marginBottom: "0.4rem", textShadow: `0 0 30px ${timedOut ? "rgba(248,113,113,0.30)" : "rgba(234,179,8,0.40)"}` }}>
        {timedOut ? "Time Expired" : "Trial Complete"}
      </h1>
      <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.40)", marginBottom: "2rem" }}>
        {timedOut ? "The Oracle's hourglass ran out." : "The Oracle acknowledges your knowledge."}
      </p>

      {/* XP counter */}
      <div style={{ marginBottom: "2rem", padding: "1.5rem", borderRadius: "16px", background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "0.5rem" }}>
          XP Earned
        </p>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "3.5rem", fontWeight: 700, color: "#fde047", lineHeight: 1, textShadow: "0 0 50px rgba(234,179,8,0.55), 0 0 20px rgba(234,179,8,0.30)" }}>
          +{animXP}
        </p>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.65rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginTop: "0.4rem" }}>
          {data.correct_count} of {data.total} correct · {accuracy}% accuracy
        </p>
      </div>

      {/* Breakdown by difficulty */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
        {Object.entries(byDiff).map(([diff, { correct, total }]) => {
          const m = DIFF_META[diff];
          return (
            <div key={diff} style={{ padding: "0.85rem", borderRadius: "10px", background: m.bg, border: `1px solid ${m.border}` }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: m.color, lineHeight: 1, marginBottom: "0.25rem" }}>
                {correct}/{total}
              </p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>
                {m.label}
              </p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", color: m.color, marginTop: "0.2rem" }}>
                +{correct * (diff === "easy" ? 10 : diff === "medium" ? 20 : 30)} XP
              </p>
            </div>
          );
        })}
      </div>

      {/* Question review */}
      <div style={{ textAlign: "left", marginBottom: "2rem" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.75rem" }}>
          Answer Review
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "320px", overflowY: "auto", paddingRight: "0.25rem" }}>
          {data.results.map((r, i) => (
            <div key={r.id} style={{ padding: "0.7rem 0.9rem", borderRadius: "9px", background: r.was_correct ? "rgba(74,222,128,0.05)" : "rgba(248,113,113,0.05)", border: `1px solid ${r.was_correct ? "rgba(74,222,128,0.18)" : "rgba(248,113,113,0.18)"}`, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700, color: r.was_correct ? "#4ade80" : "#f87171", flexShrink: 0, marginTop: "1px" }}>
                {r.was_correct ? "✓" : "✗"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.80rem", color: "rgba(255,255,255,0.72)", marginBottom: r.was_correct ? 0 : "0.3rem", lineHeight: 1.5 }}>
                  {i + 1}. {r.question}
                </p>
                {!r.was_correct && (
                  <p style={{ fontSize: "0.73rem", color: "#4ade80" }}>
                    ✓ {r.options[r.correct_index]}
                  </p>
                )}
              </div>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, color: r.was_correct ? "#4ade80" : "rgba(255,255,255,0.22)", flexShrink: 0 }}>
                {r.was_correct ? `+${r.xp}` : "0"} XP
              </span>
            </div>
          ))}
        </div>
      </div>

      <Link
        to="/trivia"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          width: "100%", maxWidth: 320, padding: "0.7rem 1.5rem",
          borderRadius: "10px", border: "1px solid rgba(234,179,8,0.35)",
          background: "rgba(234,179,8,0.09)", color: "#fde047",
          fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700,
          letterSpacing: "0.10em", textTransform: "uppercase",
          textDecoration: "none", margin: "0 auto", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(234,179,8,0.18)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(234,179,8,0.09)")}
      >
        Return to the Sanctum
      </Link>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */

export default function TriviaPlayPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const sessionData = location.state;

  // Redirect to sanctum if arrived without state
  useEffect(() => {
    if (!sessionData?.session_id || !sessionData?.questions) {
      navigate("/trivia", { replace: true });
    }
  }, [sessionData, navigate]);

  if (!sessionData?.session_id) return null;

  return <TriviaPlay sessionData={sessionData} />;
}

function TriviaPlay({ sessionData }) {
  const navigate       = useNavigate();
  const { updateUser } = useAuth();

  const { session_id, expires_at, questions } = sessionData;

  // ── State ─────────────────────────────────────────────────────────────────
  const [qIdx,       setQIdx]       = useState(0);
  const [phase,      setPhase]      = useState("playing");   // "playing"|"feedback"|"submitting"|"results"
  const [selected,   setSelected]   = useState(null);        // chosen option index
  const [answers,    setAnswers]    = useState([]);           // [{id, selected}]
  const [timeLeft,   setTimeLeft]   = useState(300);
  const [gemStates,  setGemStates]  = useState(() => Array(questions.length).fill("pending"));
  const [results,    setResults]    = useState(null);         // backend response
  const [submitErr,  setSubmitErr]  = useState(null);

  const feedbackTimer = useRef(null);
  const submittedRef  = useRef(false);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "submitting" || phase === "results") return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(expires_at) - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && !submittedRef.current) {
        handleAutoSubmit();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expires_at, phase]);

  // Update current gem to "current"
  useEffect(() => {
    if (phase === "playing") {
      setGemStates((prev) => {
        const next = [...prev];
        next[qIdx] = "current";
        return next;
      });
    }
  }, [qIdx, phase]);

  // ── Submit helpers ────────────────────────────────────────────────────────
  const doSubmit = useCallback(async (finalAnswers) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase("submitting");
    try {
      const res = await submitTrivia(session_id, finalAnswers);
      setResults(res);
      setPhase("results");
    } catch (err) {
      setSubmitErr(err?.response?.data?.error ?? "Submission failed.");
      setPhase("playing");
      submittedRef.current = false;
    }
  }, [session_id]);

  const handleAutoSubmit = useCallback(() => {
    doSubmit(answers);
  }, [doSubmit, answers]);

  // ── Answer selection ──────────────────────────────────────────────────────
  const handleSelect = useCallback((optionIdx) => {
    if (phase !== "playing") return;
    clearTimeout(feedbackTimer.current);

    const question   = questions[qIdx];
    const wasCorrect = optionIdx === question.correct_index;
    const delay      = wasCorrect ? FEEDBACK_DELAY_CORRECT : FEEDBACK_DELAY_WRONG;

    setSelected(optionIdx);
    setPhase("feedback");

    // Update gem state
    setGemStates((prev) => {
      const next = [...prev];
      next[qIdx] = wasCorrect ? "correct" : "wrong";
      return next;
    });

    const newAnswer  = { id: question.id, selected: optionIdx };
    const newAnswers = [...answers, newAnswer];

    feedbackTimer.current = setTimeout(() => {
      setSelected(null);

      if (newAnswers.length >= questions.length) {
        doSubmit(newAnswers);
      } else {
        setAnswers(newAnswers);
        setQIdx((prev) => prev + 1);
        setPhase("playing");
      }
    }, delay);
  }, [phase, qIdx, questions, answers, doSubmit]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  // ── Render: results ───────────────────────────────────────────────────────
  if (phase === "results" && results) {
    return (
      <div style={{ width: "100%" }}>
        <ResultsScreen data={results} timedOut={results.timed_out} />
      </div>
    );
  }

  // ── Render: playing / feedback ────────────────────────────────────────────
  const question    = questions[qIdx];
  const diff        = DIFF_META[question.difficulty] ?? DIFF_META.easy;
  const earnedSoFar = answers.reduce((sum, a) => {
    const q = questions.find((qq) => qq.id === a.id);
    return sum + (q && a.selected === q.correct_index ? q.xp : 0);
  }, 0);

  // Option styling in feedback phase
  const getOptionStyle = (idx) => {
    const base = {
      width: "100%", padding: "0.9rem 1rem",
      borderRadius: "11px", border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.03)",
      display: "flex", alignItems: "center", gap: "0.75rem",
      cursor: phase === "playing" ? "pointer" : "default",
      transition: "all 0.15s",
      textAlign: "left",
    };

    if (phase === "feedback") {
      if (idx === question.correct_index) {
        return { ...base, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.45)", cursor: "default" };
      }
      if (idx === selected && idx !== question.correct_index) {
        return { ...base, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.45)", cursor: "default" };
      }
      return { ...base, opacity: 0.45, cursor: "default" };
    }

    return base;
  };

  const getOptionColor = (idx) => {
    if (phase === "feedback") {
      if (idx === question.correct_index) return "#4ade80";
      if (idx === selected && idx !== question.correct_index) return "#f87171";
      return "rgba(255,255,255,0.30)";
    }
    return "rgba(255,255,255,0.75)";
  };

  const getBadgeStyle = (idx) => {
    const base = {
      width: 28, height: 28, borderRadius: "7px", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.05)",
      color: "rgba(255,255,255,0.50)",
      transition: "all 0.15s",
    };

    if (phase === "feedback") {
      if (idx === question.correct_index) {
        return { ...base, background: "rgba(74,222,128,0.20)", border: "1px solid rgba(74,222,128,0.50)", color: "#4ade80" };
      }
      if (idx === selected && idx !== question.correct_index) {
        return { ...base, background: "rgba(248,113,113,0.20)", border: "1px solid rgba(248,113,113,0.50)", color: "#f87171" };
      }
    }
    return base;
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>

      {/* ── Error banner ── */}
      {submitErr && (
        <div style={{ marginBottom: "1rem", padding: "0.7rem 1rem", borderRadius: "9px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: "0.80rem" }}>
          {submitErr}
        </div>
      )}

      {/* ── Top bar: progress gems + xp earned ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", flex: 1 }}>
          {gemStates.map((state, i) => (
            <ProgressGem key={i} state={state} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
            Q {qIdx + 1} / {questions.length}
          </span>
          <span style={{ padding: "0.15rem 0.55rem", borderRadius: "99px", background: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.30)", fontFamily: "var(--font-heading)", fontSize: "0.60rem", fontWeight: 700, color: "#eab308" }}>
            +{earnedSoFar} XP
          </span>
        </div>
      </div>

      {/* ── Timer + question card ── */}
      <div className="glass-card" style={{ padding: "1.75rem", marginBottom: "1.25rem" }}>
        {/* Timer + difficulty + q-header row */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <TimerRing timeLeft={timeLeft} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "0.28rem",
                padding: "0.18rem 0.55rem", borderRadius: "99px",
                border: `1px solid ${diff.border}`, background: diff.bg, color: diff.color,
                fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700,
                letterSpacing: "0.10em", textTransform: "uppercase",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: diff.color, flexShrink: 0 }} />
                {diff.label}
              </span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.60rem", fontWeight: 700, color: diff.color }}>
                +{question.xp} XP
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
              Question
            </p>
          </div>
        </div>

        {/* Question text */}
        <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.92)", lineHeight: 1.65, fontFamily: "var(--font-body)" }}>
          {question.question}
        </p>
      </div>

      {/* ── Answer options ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            style={getOptionStyle(idx)}
            onMouseEnter={(e) => {
              if (phase === "playing") {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)";
              }
            }}
            onMouseLeave={(e) => {
              if (phase === "playing") {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
              }
            }}
          >
            {/* Letter badge */}
            <div style={getBadgeStyle(idx)}>
              {OPTION_LABELS[idx]}
            </div>
            {/* Option text */}
            <span style={{ fontSize: "0.83rem", color: getOptionColor(idx), lineHeight: 1.45, transition: "color 0.15s" }}>
              {opt}
            </span>
            {/* Feedback icon */}
            {phase === "feedback" && idx === question.correct_index && (
              <svg style={{ width: 16, height: 16, color: "#4ade80", marginLeft: "auto", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
            {phase === "feedback" && idx === selected && idx !== question.correct_index && (
              <svg style={{ width: 16, height: 16, color: "#f87171", marginLeft: "auto", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* ── Feedback hint ── */}
      {phase === "feedback" && (
        <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="sf-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.60rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.28)" }}>
            Next question loading…
          </span>
        </div>
      )}

      {/* ── Submitting overlay hint ── */}
      {phase === "submitting" && (
        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
          <div className="sf-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.65rem", letterSpacing: "0.10em", color: "rgba(255,255,255,0.45)" }}>
            Consulting the Oracle…
          </span>
        </div>
      )}

      {/* Pulse keyframe for timer urgency */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
