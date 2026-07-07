import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { getQuest, submitQuest, getComments, addComment, deleteComment } from "../services/questService";
import { createReport } from "../services/reportService";

/* ── Config ──────────────────────────────────────────────────────────────── */

const DIFF_META = {
  shallow: { label: "Shallow", color: "#4ade80", border: "rgba(74,222,128,0.35)",  bg: "rgba(74,222,128,0.09)"  },
  cryptic: { label: "Cryptic", color: "#fbbf24", border: "rgba(251,191,36,0.35)",  bg: "rgba(251,191,36,0.09)"  },
  abyssal: { label: "Abyssal", color: "#f87171", border: "rgba(248,113,113,0.35)", bg: "rgba(248,113,113,0.09)" },
};

const LANG_LABEL = {
  python:     "Python",
  javascript: "JavaScript",
  java:       "Java",
  csharp:     "C#",
};

const LANG_EXT = {
  python:     () => [python()],
  javascript: () => [javascript({ jsx: false })],
  java:       () => [java()],
  csharp:     () => [java()],   // rough structural match
};

const STARTER = {
  python: `# Each input value is on its own line — read with input()
# Single value:   n = int(input())
# Multiple lines: a = int(input()); b = int(input())
# Space-separated: a, b = map(int, input().split())

`,
  javascript: `// Each input value is on its own line
const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');
// const a = parseInt(lines[0]);
// const b = parseInt(lines[1]);

// your solution here
`,
  java: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // int a = sc.nextInt();
        // int b = sc.nextInt();
        // your solution here
    }
}
`,
  csharp: `using System;

class Solution {
    static void Main() {
        // int a = int.Parse(Console.ReadLine());
        // int b = int.Parse(Console.ReadLine());
        // your solution here
    }
}
`,
};

/* ── Sub-components ──────────────────────────────────────────────────────── */

function DiffBadge({ difficulty }) {
  const m = DIFF_META[difficulty] ?? DIFF_META.shallow;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.28rem",
        padding: "0.2rem 0.6rem", borderRadius: "99px",
        border: `1px solid ${m.border}`, background: m.bg, color: m.color,
        fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700,
        letterSpacing: "0.10em", textTransform: "uppercase", flexShrink: 0,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function MonoBlock({ label, value }) {
  return (
    <div>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "0.3rem" }}>
        {label}
      </p>
      <pre
        style={{
          margin: 0, padding: "0.6rem 0.85rem",
          borderRadius: "8px",
          background: "rgba(0,0,0,0.30)",
          border: "1px solid rgba(255,255,255,0.07)",
          fontFamily: "monospace", fontSize: "0.78rem",
          color: "rgba(255,255,255,0.75)",
          whiteSpace: "pre-wrap", wordBreak: "break-all",
        }}
      >
        {value || <span style={{ color: "rgba(255,255,255,0.25)" }}>(empty)</span>}
      </pre>
    </div>
  );
}

/* Zero test: full collapsible detail (input/expected/actual visible) */
function ExampleTestRow({ result }) {
  const [open, setOpen] = useState(true);
  const m = result.passed
    ? { bg: "rgba(74,222,128,0.06)",  border: "rgba(74,222,128,0.20)",  color: "#4ade80" }
    : { bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.20)", color: "#f87171" };

  return (
    <div style={{ borderRadius: "10px", border: `1px solid ${m.border}`, background: m.bg, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.6rem 0.9rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        {result.passed ? (
          <svg style={{ width: 16, height: 16, color: "#4ade80", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg style={{ width: 16, height: 16, color: "#f87171", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: m.color }}>
          Test 1 — Example
        </span>
        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.30)", marginLeft: "auto" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 0.9rem 0.9rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          <MonoBlock label="Input" value={result.input} />
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "0.55rem" }}>
            <MonoBlock label="Expected" value={result.expected} />
            <MonoBlock
              label="Got"
              value={result.error && !result.actual ? `[Error] ${result.error}` : (result.actual ?? "(no output)")}
            />
          </div>
          {result.error && (
            <MonoBlock label={result.error === "Time limit exceeded" ? "Status" : "Error"} value={result.error} />
          )}
        </div>
      )}
    </div>
  );
}

/* Hidden tests 1-N: pass/fail only — inputs never revealed */
function HiddenTestRow({ result, n }) {
  const m = result.passed
    ? { bg: "rgba(74,222,128,0.06)",  border: "rgba(74,222,128,0.20)",  color: "#4ade80" }
    : { bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.20)", color: "#f87171" };

  return (
    <div
      style={{
        borderRadius: "10px", border: `1px solid ${m.border}`, background: m.bg,
        display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.6rem 0.9rem",
      }}
    >
      {result.passed ? (
        <svg style={{ width: 16, height: 16, color: "#4ade80", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg style={{ width: 16, height: 16, color: "#f87171", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: m.color }}>
        Test {n}
      </span>
      <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.22)", marginLeft: "auto", fontStyle: "italic" }}>
        hidden
      </span>
    </div>
  );
}

/* ── Comments ────────────────────────────────────────────────────────────── */

function formatRelative(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function CommentAvatar({ username, avatarUrl }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.12)" }}
      />
    );
  }
  return (
    <div
      style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: "rgba(3,233,244,0.12)", border: "1px solid rgba(3,233,244,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700,
        color: "var(--color-cyan)",
      }}
    >
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function QuestComments({ questId, currentUser }) {
  const [comments, setComments]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [draft,    setDraft]      = useState("");
  const [posting,  setPosting]    = useState(false);
  const [postErr,  setPostErr]    = useState(null);

  useEffect(() => {
    setLoading(true);
    getComments(questId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [questId]);

  const handlePost = async () => {
    if (posting || !draft.trim()) return;
    setPosting(true);
    setPostErr(null);
    try {
      const comment = await addComment(questId, draft.trim());
      setComments((prev) => [...prev, comment]);
      setDraft("");
    } catch (err) {
      setPostErr(err?.response?.data?.error ?? "Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(questId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silently ignore — comment list stays intact
    }
  };

  const canDelete = (comment) =>
    currentUser && (currentUser.id === comment.user_id || ["admin", "moderator"].includes(currentUser.role));

  return (
    <div style={{ marginTop: "2.5rem" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "1.25rem" }}>
        <span
          style={{
            fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.30)",
          }}
        >
          Discussion
        </span>
        {!loading && (
          <span
            style={{
              padding: "0.1rem 0.5rem", borderRadius: "99px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
              fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <div className="sf-spinner" style={{ width: "14px", height: "14px" }} />
          <span className="text-sub" style={{ fontSize: "0.78rem" }}>Loading comments…</span>
        </div>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: "0.80rem", color: "rgba(255,255,255,0.25)", fontStyle: "italic", marginBottom: "1.25rem" }}>
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
          {comments.map((c) => (
            <div
              key={c.id}
              className="glass-card"
              style={{ padding: "0.9rem 1rem", display: "flex", gap: "0.85rem" }}
            >
              <CommentAvatar username={c.username} avatarUrl={c.avatar_url} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                  <Link
                    to={`/users/${c.user_id}`}
                    style={{
                      fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700,
                      color: "rgba(255,255,255,0.80)", textDecoration: "none", transition: "color 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-cyan)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.80)")}
                  >
                    {c.username}
                  </Link>
                  <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>
                    {formatRelative(c.created_at)}
                  </span>
                  {canDelete(c) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                        fontSize: "0.62rem", color: "rgba(248,113,113,0.45)",
                        fontFamily: "var(--font-heading)", letterSpacing: "0.06em", textTransform: "uppercase",
                        transition: "color 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(248,113,113,0.45)")}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: "0.84rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post form */}
      {currentUser ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share your approach, ask a question, or help others…"
            rows={3}
            maxLength={2000}
            style={{
              width: "100%", resize: "vertical",
              padding: "0.75rem 0.9rem", borderRadius: "10px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.85)", fontSize: "0.84rem", lineHeight: 1.6,
              fontFamily: "var(--font-body)",
              outline: "none", transition: "border-color 0.15s",
              boxSizing: "border-box",
            }}
            onFocus={(e)  => (e.currentTarget.style.borderColor = "rgba(3,233,244,0.40)")}
            onBlur={(e)   => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
          />
          {postErr && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#f87171" }}>{postErr}</p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-heading)" }}>
              {draft.length} / 2000
            </span>
            <button
              onClick={handlePost}
              disabled={posting || !draft.trim()}
              style={{
                display: "flex", alignItems: "center", gap: "0.45rem",
                padding: "0.5rem 1.1rem", borderRadius: "8px",
                border: "1px solid rgba(3,233,244,0.30)",
                background: posting ? "rgba(3,233,244,0.06)" : "rgba(3,233,244,0.10)",
                color: posting ? "rgba(3,233,244,0.50)" : "var(--color-cyan)",
                fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
                letterSpacing: "0.10em", textTransform: "uppercase",
                cursor: posting || !draft.trim() ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!posting && draft.trim()) e.currentTarget.style.background = "rgba(3,233,244,0.16)"; }}
              onMouseLeave={(e) => { if (!posting) e.currentTarget.style.background = "rgba(3,233,244,0.10)"; }}
            >
              {posting ? (
                <>
                  <div className="sf-spinner" style={{ width: "11px", height: "11px", borderWidth: "2px" }} />
                  Posting…
                </>
              ) : (
                "Post Comment"
              )}
            </button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: "0.80rem", color: "rgba(255,255,255,0.28)" }}>
          <Link
            to="/login"
            style={{ color: "var(--color-cyan)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Sign in
          </Link>
          {" "}to leave a comment.
        </p>
      )}
    </div>
  );
}

/* ── Report Modal ────────────────────────────────────────────────────────── */

function ReportModal({ questId, onClose }) {
  const [reason,     setReason]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState(null);
  const MAX = 500;

  const handleSubmit = async () => {
    if (submitting || !reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createReport(questId, reason.trim());
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.80)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: "480px", width: "100%", padding: "1.75rem",
          background: "rgba(10, 12, 20, 0.97)",
          border: "1px solid rgba(248,113,113,0.25)",
          borderRadius: "0.875rem",
          boxShadow: "0 24px 64px rgba(0,0,0,0.60)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg style={{ width: 14, height: 14, color: "#f87171" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.80rem", fontWeight: 700, letterSpacing: "0.06em", color: "#fff", margin: 0 }}>Report Quest</h3>
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>Help us improve by flagging issues</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.30)", fontSize: "1.25rem", lineHeight: 1, padding: "0.1rem" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.30)")}
          >×</button>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <svg style={{ width: 36, height: 36, color: "#4ade80", margin: "0 auto 0.75rem" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.80rem", fontWeight: 700, color: "#4ade80", marginBottom: "0.35rem" }}>Report submitted</p>
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.40)", marginBottom: "1.25rem" }}>Our moderators will review this quest shortly.</p>
            <button className="sf-btn-ghost" onClick={onClose} style={{ width: "auto", padding: "0.5rem 1.5rem" }}>Close</button>
          </div>
        ) : (
          <>
            <label style={{ display: "block", fontFamily: "var(--font-heading)", fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)", marginBottom: "0.5rem" }}>
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, MAX))}
              placeholder="Describe the issue — e.g. incorrect test cases, unclear description, wrong expected output…"
              rows={5}
              style={{
                width: "100%", resize: "vertical", marginBottom: "0.5rem",
                padding: "0.75rem 0.9rem", borderRadius: "10px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.85)", fontSize: "0.84rem", lineHeight: 1.6,
                fontFamily: "var(--font-body)", outline: "none", transition: "border-color 0.15s",
                boxSizing: "border-box",
              }}
              onFocus={(e)  => (e.currentTarget.style.borderColor = "rgba(248,113,113,0.40)")}
              onBlur={(e)   => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.62rem", color: reason.length > MAX * 0.9 ? "#fbbf24" : "rgba(255,255,255,0.22)", fontFamily: "var(--font-heading)" }}>
                {reason.length} / {MAX}
              </span>
              {error && <span style={{ fontSize: "0.72rem", color: "#f87171" }}>{error}</span>}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="sf-btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={submitting}>Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !reason.trim()}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
                  padding: "0.6rem 1rem", borderRadius: "0.5rem",
                  border: "1px solid rgba(248,113,113,0.35)",
                  background: submitting || !reason.trim() ? "rgba(248,113,113,0.04)" : "rgba(248,113,113,0.10)",
                  color: submitting || !reason.trim() ? "rgba(248,113,113,0.40)" : "#f87171",
                  fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: submitting || !reason.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!submitting && reason.trim()) e.currentTarget.style.background = "rgba(248,113,113,0.16)"; }}
                onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = reason.trim() ? "rgba(248,113,113,0.10)" : "rgba(248,113,113,0.04)"; }}
              >
                {submitting ? <><div className="sf-spinner" style={{ width: "11px", height: "11px", borderWidth: "2px" }} /> Submitting…</> : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function QuestSolvePage() {
  const { language, questId } = useParams();
  const navigate              = useNavigate();
  const { user: currentUser, updateUser } = useAuth();

  const [quest,       setQuest]      = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [code,        setCode]       = useState(STARTER[language] ?? "");
  const [submitting,  setSubmitting] = useState(false);
  const [results,     setResults]    = useState(null);   // { passed, total, results, ... }
  const [submitErr,   setSubmitErr]  = useState(null);
  const [xpBanner,    setXpBanner]   = useState(null);  // { xp_earned } or null
  const [reportOpen,  setReportOpen] = useState(false);
  const xpTimerRef                   = useRef(null);

  useEffect(() => {
    setLoading(true);
    setResults(null);
    setSubmitErr(null);
    getQuest(questId)
      .then((q) => {
        setQuest(q);
        setCode(STARTER[q.language] ?? "");
      })
      .catch(() => navigate("/", { replace: true }))
      .finally(() => setLoading(false));
  }, [questId, navigate]);

  const handleSubmit = useCallback(async () => {
    if (submitting || !code.trim()) return;
    setSubmitting(true);
    setResults(null);
    setSubmitErr(null);
    try {
      const res = await submitQuest(questId, code);
      setResults(res);
      if (res.first_completion) {
        setXpBanner({ xp: res.xp_earned });
        updateUser({ total_xp: (currentUser?.total_xp ?? 0) + res.xp_earned });
        clearTimeout(xpTimerRef.current);
        xpTimerRef.current = setTimeout(() => setXpBanner(null), 6000);
      }
    } catch (err) {
      const msg = err?.response?.data?.error ?? "Submission failed. Please try again.";
      setSubmitErr(msg);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, code, questId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-32">
        <div className="sf-spinner" style={{ width: "22px", height: "22px" }} />
        <span className="text-sub text-sm">Loading quest…</span>
      </div>
    );
  }

  if (!quest) return null;

  const exampleTc  = quest.test_cases?.find((tc) => tc.index === 0);
  const diff       = DIFF_META[quest.difficulty] ?? DIFF_META.shallow;
  const langExt    = LANG_EXT[quest.language] ?? (() => []);
  const langLabel  = LANG_LABEL[quest.language] ?? quest.language;

  const allPassed  = results && results.passed === results.total;
  const nonePassed = results && results.passed === 0;
  const barColor   = allPassed ? "#4ade80" : nonePassed ? "#f87171" : "#fbbf24";
  const barPct     = results ? Math.round((results.passed / results.total) * 100) : 0;

  return (
    <div style={{ width: "100%" }}>

      {/* ── Report modal ── */}
      {reportOpen && (
        <ReportModal questId={questId} onClose={() => setReportOpen(false)} />
      )}

      {/* ── XP earned banner ── */}
      {xpBanner && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            padding: "0.65rem 1rem", borderRadius: "10px", marginBottom: "1rem",
            background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.30)",
            color: "#4ade80",
          }}
        >
          <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em" }}>
            +{xpBanner.xp} XP earned — quest complete!
          </span>
          <button
            onClick={() => setXpBanner(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(74,222,128,0.60)", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <Link
        to={`/quests/${quest.language}`}
        className="text-sub text-xs flex items-center gap-1.5 mb-5 w-fit"
        style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", transition: "color 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.70)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "")}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        {langLabel} Quests
      </Link>

      {/* ── Quest header ── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <DiffBadge difficulty={quest.difficulty} />
          <div className="flex items-center gap-1.5">
            <svg style={{ width: 13, height: 13, color: "var(--color-cyan)" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700, color: "var(--color-cyan)" }}>
              {quest.xp_reward} XP
            </span>
          </div>
          {quest.author && quest.author_id && (
            <Link
              to={`/users/${quest.author_id}`}
              style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.30)", fontStyle: "italic", textDecoration: "none", transition: "color 0.12s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.30)")}
            >
              by {quest.author}
            </Link>
          )}
        </div>
        <h1 style={{ fontSize: "clamp(1.3rem, 5vw, 1.9rem)", fontWeight: 700, color: "rgba(255,255,255,0.95)", fontFamily: "var(--font-heading)", lineHeight: 1.2 }}>
          {quest.title}
        </h1>
      </div>

      {/* ── Two-panel layout ── */}
      <div className="flex flex-col lg:flex-row gap-5" style={{ alignItems: "flex-start" }}>

        {/* ── LEFT: Problem description ── */}
        <div className="lg:w-2/5" style={{ flexShrink: 0, minWidth: 0 }}>
          <div
            className="glass-card quest-desc-sticky"
            style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {/* Description */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)", marginBottom: "0.65rem",
                }}
              >
                Problem
              </p>
              <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {quest.description}
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

            {/* Example test case */}
            {exampleTc && (
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.28)", marginBottom: "0.75rem",
                  }}
                >
                  Example
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  <MonoBlock label="Input" value={exampleTc.input} />
                  <MonoBlock label="Expected Output" value={exampleTc.output} />
                </div>
              </div>
            )}

            {/* Language tag */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.25rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700,
                  letterSpacing: "0.10em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                Language
              </span>
              <span
                style={{
                  padding: "0.15rem 0.55rem", borderRadius: "99px",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
                  fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {langLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Editor + submit + results ── */}
        <div className="flex-1 flex flex-col gap-4" style={{ minWidth: 0 }}>

          {/* Editor header */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.10em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.30)", marginRight: "auto",
              }}
            >
              Your Solution
            </span>
          </div>

          {/* CodeMirror editor */}
          <div
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <CodeMirror
              value={code}
              onChange={setCode}
              theme={vscodeDark}
              extensions={langExt()}
              minHeight="320px"
              style={{ fontSize: "0.83rem" }}
              basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                dropCursor: false,
                allowMultipleSelections: false,
                autocompletion: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
              }}
            />
          </div>

          {/* ── Action bar: Reset · Report · Submit ── */}
          {/* Single flex-wrap row. Reset/Report are fixed-width; Submit has flex-basis:180px
              so it wraps to a full-width second row on narrow screens. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>

            {/* Reset */}
            <button
              onClick={() => setCode(STARTER[quest.language] ?? "")}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0,
                padding: "0.7rem 1rem", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.50)",
                fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
                letterSpacing: "0.09em", textTransform: "uppercase",
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.80)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.50)"; }}
            >
              <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Reset
            </button>

            {/* Report */}
            {currentUser && (
              <button
                onClick={() => setReportOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0,
                  padding: "0.7rem 1rem", borderRadius: "10px",
                  border: "1px solid rgba(248,113,113,0.22)",
                  background: "rgba(248,113,113,0.06)",
                  color: "rgba(248,113,113,0.60)",
                  fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
                  letterSpacing: "0.09em", textTransform: "uppercase",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.12)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.40)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.06)"; e.currentTarget.style.color = "rgba(248,113,113,0.60)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.22)"; }}
              >
                <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Report
              </button>
            )}

            {/* Submit Solution — grows to fill the row; wraps to full width when tight */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !code.trim()}
              style={{
                flex: "1 0 180px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.55rem",
                padding: "0.75rem 1.25rem", borderRadius: "10px",
                border: "1px solid rgba(3,233,244,0.35)",
                background: submitting ? "rgba(3,233,244,0.06)" : "rgba(3,233,244,0.12)",
                color: submitting ? "rgba(3,233,244,0.45)" : "var(--color-cyan)",
                fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                cursor: submitting || !code.trim() ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!submitting && code.trim()) e.currentTarget.style.background = "rgba(3,233,244,0.18)"; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = "rgba(3,233,244,0.12)"; }}
            >
              {submitting ? (
                <>
                  <div className="sf-spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
                  Running tests…
                </>
              ) : (
                <>
                  <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                  </svg>
                  Submit Solution
                </>
              )}
            </button>
          </div>

          {/* Submission error (unsupported language, network, etc.) */}
          {submitErr && (
            <div
              style={{
                padding: "0.75rem 1rem", borderRadius: "10px",
                background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
                color: "#f87171", fontSize: "0.78rem",
              }}
            >
              {submitErr}
            </div>
          )}

          {/* ── Results ── */}
          {results && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

              {/* Summary banner */}
              <div className="glass-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                    Results
                  </span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", fontWeight: 700, color: barColor }}>
                    {results.passed} / {results.total} passed
                  </span>
                </div>
                <div style={{ height: "5px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "99px", width: `${barPct}%`, background: barColor, transition: "width 0.4s ease" }} />
                </div>
                {allPassed && (
                  <p style={{ marginTop: "0.65rem", fontSize: "0.75rem", color: "#4ade80", fontFamily: "var(--font-heading)", letterSpacing: "0.04em" }}>
                    All tests passed — quest complete!
                  </p>
                )}
              </div>

              {/* Compile error */}
              {results.compile_error && (
                <div style={{ borderRadius: "10px", border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.06)", overflow: "hidden" }}>
                  <div style={{ padding: "0.55rem 0.9rem", borderBottom: "1px solid rgba(248,113,113,0.15)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg style={{ width: 14, height: 14, color: "#f87171", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "#f87171" }}>
                      Compile Error
                    </span>
                  </div>
                  <pre style={{ margin: 0, padding: "0.75rem 0.9rem", fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,200,200,0.85)", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6 }}>
                    {results.compile_error}
                  </pre>
                </div>
              )}

              {/* Example test (test 0) — full detail */}
              {results.zero_test && (
                <ExampleTestRow result={results.zero_test} />
              )}

              {/* Hidden tests 1-N — pass/fail only */}
              {results.results.filter((r) => r.index > 0).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {results.results
                    .filter((r) => r.index > 0)
                    .map((r, i) => (
                      <HiddenTestRow key={r.index} result={r} n={r.index + 1} />
                    ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Comments ── */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "2rem 0" }} />
      <QuestComments questId={questId} currentUser={currentUser} />

    </div>
  );
}
