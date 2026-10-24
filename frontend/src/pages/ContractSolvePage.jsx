import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { python } from "@codemirror/lang-python";
import { useAuth } from "../context/AuthContext";
import {
  getContract, runContract, submitContract,
  getContractComments, addContractComment, deleteContractComment,
} from "../services/contractService";
import ContractTestResults from "../components/ContractTestResults";
import Avatar from "../components/Avatar";

/* ── Config ──────────────────────────────────────────────────────────────── */

const DIFF_META = {
  junior: { label: "Junior", color: "var(--color-green)",      border: "var(--color-green-border)", bg: "var(--color-green-dim)" },
  mid:    { label: "Mid",    color: "var(--color-amber)",      border: "var(--color-amber-border)", bg: "var(--color-amber-dim)" },
  senior: { label: "Senior", color: "var(--color-red-bright)", border: "var(--color-red-border)",   bg: "var(--color-red-dim)"   },
};

const LANG_EXT = {
  python: () => [python()],
};

const DRAFT_KEY = (id) => `sf-contract-draft-${id}`;

const labelStyle = {
  fontFamily: "var(--font-heading)", fontSize: "0.692rem", fontWeight: 700,
  letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-tertiary)",
};

const editorSetup = {
  lineNumbers: true,
  foldGutter: false,
  dropCursor: false,
  allowMultipleSelections: false,
  autocompletion: true,
  highlightActiveLine: true,
  highlightSelectionMatches: true,
};

function readDraft(id) {
  try {
    return localStorage.getItem(DRAFT_KEY(id));
  } catch {
    return null;
  }
}

function writeDraft(id, code) {
  try {
    localStorage.setItem(DRAFT_KEY(id), code);
  } catch {
    // storage unavailable (private mode etc.) — drafts are a convenience only
  }
}

function clearDraft(id) {
  try {
    localStorage.removeItem(DRAFT_KEY(id));
  } catch {
    // ignore
  }
}

function formatRelative(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function DiffBadge({ difficulty }) {
  const m = DIFF_META[difficulty] ?? DIFF_META.junior;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.28rem",
        padding: "0.2rem 0.6rem", borderRadius: "3px",
        border: `1px solid ${m.border}`, background: m.bg, color: m.color,
        fontFamily: "var(--font-heading)", fontSize: "0.705rem", fontWeight: 700,
        letterSpacing: "0.10em", textTransform: "uppercase", flexShrink: 0,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.color }} />
      {m.label}
    </span>
  );
}

function Chip({ children }) {
  return (
    <span
      style={{
        padding: "0.15rem 0.55rem", borderRadius: "3px",
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
        fontFamily: "var(--font-heading)", fontSize: "0.705rem", fontWeight: 700,
        color: "rgba(255,255,255,0.66)",
      }}
    >
      {children}
    </span>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...labelStyle,
        padding: "0.35rem 0.75rem", borderRadius: "6px", cursor: "pointer",
        border: active ? "1px solid var(--color-green-border)" : "1px solid transparent",
        background: active ? "var(--color-green-dim)" : "transparent",
        color: active ? "var(--color-green)" : "var(--color-text-tertiary)",
      }}
    >
      {children}
    </button>
  );
}

function ContractComments({ contractId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [draft,    setDraft]    = useState("");
  const [posting,  setPosting]  = useState(false);
  const [postErr,  setPostErr]  = useState(null);

  useEffect(() => {
    setLoading(true);
    getContractComments(contractId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [contractId]);

  const handlePost = async () => {
    if (posting || !draft.trim()) return;
    setPosting(true);
    setPostErr(null);
    try {
      const comment = await addContractComment(contractId, draft.trim());
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
      await deleteContractComment(contractId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silently ignore — comment list stays intact
    }
  };

  const canDelete = (c) =>
    currentUser && (currentUser.id === c.user_id || ["admin", "moderator"].includes(currentUser.role));

  return (
    <div style={{ marginTop: "2.5rem" }}>
      <p style={{ ...labelStyle, marginBottom: "1.25rem" }}>
        Discussion {!loading && `(${comments.length})`}
      </p>

      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <div className="sf-spinner" style={{ width: "14px", height: "14px" }} />
          <span className="text-sub" style={{ fontSize: "0.822rem" }}>Loading comments…</span>
        </div>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: "0.835rem", color: "var(--color-text-faint)", fontStyle: "italic", marginBottom: "1.25rem" }}>
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
          {comments.map((c) => (
            <div key={c.id} className="glass-card" style={{ padding: "0.9rem 1rem", display: "flex", gap: "0.85rem" }}>
              <Avatar src={c.avatar_url} username={c.username} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                  <Link to={`/users/${c.user_id}`} style={{ fontFamily: "var(--font-heading)", fontSize: "0.757rem", fontWeight: 700, color: "rgba(255,255,255,0.80)", textDecoration: "none" }}>
                    {c.username}
                  </Link>
                  <span style={{ fontSize: "0.738rem", color: "var(--color-text-faint)" }}>{formatRelative(c.created_at)}</span>
                  {canDelete(c) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "0.718rem", color: "var(--color-red-bright)", fontFamily: "var(--font-heading)", letterSpacing: "0.06em", textTransform: "uppercase" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: "0.861rem", color: "rgba(255,255,255,0.736)", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentUser && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share your approach, ask a question, or help others…"
            rows={3}
            maxLength={2000}
            className="sf-input"
            style={{ resize: "vertical", lineHeight: 1.6 }}
          />
          {postErr && <p className="sf-error">{postErr}</p>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.718rem", color: "var(--color-text-faint)", fontFamily: "var(--font-heading)" }}>
              {draft.length} / 2000
            </span>
            <button className="sf-btn" style={{ width: "auto" }} onClick={handlePost} disabled={posting || !draft.trim()}>
              {posting ? "Posting…" : "Post Comment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ContractSolvePage() {
  const { contractId } = useParams();
  const navigate       = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const isPrivileged = !!currentUser && ["admin", "moderator"].includes(currentUser.role);

  const [contract, setContract] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("problem");
  const [code,     setCode]     = useState("");
  const [busy,     setBusy]     = useState(null);   // "run" | "submit" | null
  const [results,  setResults]  = useState(null);
  const [mode,     setMode]     = useState(null);   // which action produced `results`
  const [error,    setError]    = useState(null);
  const [xpBanner, setXpBanner] = useState(null);
  const xpTimerRef = useRef(null);

  // Same anti-copy/paste stance as Jobs: privileged users author contracts and need both.
  const blockCopy  = useCallback((e) => { if (!isPrivileged) e.preventDefault(); }, [isPrivileged]);
  const blockPaste = useCallback((e) => {
    if (!isPrivileged) { e.preventDefault(); e.stopPropagation(); }
  }, [isPrivileged]);

  useEffect(() => {
    setLoading(true);
    getContract(contractId)
      .then((c) => {
        setContract(c);
        setCode(readDraft(c.id) ?? c.starter_code);
      })
      .catch(() => navigate("/contracts", { replace: true }))
      .finally(() => setLoading(false));
  }, [contractId, navigate]);

  useEffect(() => () => clearTimeout(xpTimerRef.current), []);

  const handleCodeChange = (value) => {
    setCode(value);
    if (contract) writeDraft(contract.id, value);
  };

  const handleReset = () => {
    setCode(contract.starter_code);
    clearDraft(contract.id);
  };

  const execute = async (action) => {
    if (busy || !code.trim()) return;
    setBusy(action);
    setError(null);
    try {
      const res = action === "run"
        ? await runContract(contractId, code)
        : await submitContract(contractId, code);
      setResults(res);
      setMode(action);
      if (res.first_completion) {
        setContract((c) => ({ ...c, solved: true }));
        setXpBanner(res.xp_earned);
        updateUser({ total_xp: (currentUser?.total_xp ?? 0) + res.xp_earned });
        clearTimeout(xpTimerRef.current);
        xpTimerRef.current = setTimeout(() => setXpBanner(null), 6000);
      }
    } catch (err) {
      setError(err?.response?.data?.error ?? "Execution failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-32">
        <div className="sf-spinner" style={{ width: "22px", height: "22px" }} />
        <span className="text-sub text-sm">Loading contract…</span>
      </div>
    );
  }

  if (!contract) return null;

  const langExt   = LANG_EXT[contract.language] ?? (() => []);
  const allPassed = mode === "submit" && results?.status === "ok" && results.total > 0 && results.passed === results.total;

  return (
    <div style={{ width: "100%" }}>

      {xpBanner && (
        <div className="sf-success" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, letterSpacing: "0.06em" }}>
            +{xpBanner} XP earned — contract fulfilled!
          </span>
          <button onClick={() => setXpBanner(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1rem" }}>
            ×
          </button>
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <Link
        to="/contracts"
        className="text-sub text-xs flex items-center gap-1.5 mb-5 w-fit"
        style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none" }}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Contracts
      </Link>

      {/* ── Header ── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <DiffBadge difficulty={contract.difficulty} />
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.757rem", fontWeight: 700, color: "var(--color-green)" }}>
            {contract.xp_reward} XP
          </span>
          {contract.topic && <Chip>{contract.topic}</Chip>}
          {contract.solved && (
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.705rem", fontWeight: 700, color: "var(--color-green)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              ✓ Fulfilled
            </span>
          )}
          {contract.author && contract.author_id && (
            <Link to={`/users/${contract.author_id}`} style={{ fontSize: "0.757rem", color: "var(--color-text-tertiary)", fontStyle: "italic", textDecoration: "none" }}>
              by {contract.author}
            </Link>
          )}
        </div>
        <h1 style={{ fontSize: "clamp(1.3rem, 5vw, 1.9rem)", fontWeight: 700, color: "rgba(255,255,255,0.95)", fontFamily: "var(--font-heading)", lineHeight: 1.2 }}>
          {contract.title}
        </h1>
      </div>

      {/* ── Two-panel layout ── */}
      <div className="flex flex-col lg:flex-row gap-5" style={{ alignItems: "flex-start" }}>

        {/* ── LEFT: spec ── */}
        <div className="lg:w-2/5 w-full" style={{ flexShrink: 0, minWidth: 0 }}>
          <div
            className="glass-card job-desc-sticky"
            style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", userSelect: isPrivileged ? undefined : "none" }}
            onCopy={blockCopy}
            onCut={blockCopy}
          >
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>Spec</TabButton>
              <TabButton active={tab === "tests"} onClick={() => setTab("tests")}>Public tests</TabButton>
            </div>

            {tab === "problem" ? (
              <div className="job-desc-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{contract.description}</ReactMarkdown>
              </div>
            ) : (
              <div>
                <p className="text-xs text-dim mb-2" style={{ fontFamily: "var(--font-body)" }}>
                  These run on <b>Run tests</b>. <b>Submit</b> also runs hidden tests — you&apos;ll see their names and
                  pass/fail, but not their assertions.
                </p>
                <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <CodeMirror
                    value={contract.public_tests}
                    theme={vscodeDark}
                    extensions={langExt()}
                    editable={false}
                    style={{ fontSize: "0.79rem" }}
                    basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
                  />
                </div>
              </div>
            )}

            <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ ...labelStyle, fontSize: "0.672rem", color: "var(--color-text-faint)" }}>Limits</span>
              <Chip>{contract.time_limit_ms} ms / test</Chip>
              <Chip>{contract.memory_limit_mb} MB / test</Chip>
              <Chip>Python</Chip>
            </div>
          </div>
        </div>

        {/* ── RIGHT: editor + results ── */}
        <div className="flex-1 flex flex-col gap-4 w-full" style={{ minWidth: 0 }}>
          <span style={labelStyle}>solution.py</span>

          <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)" }} onPasteCapture={blockPaste}>
            <CodeMirror
              value={code}
              onChange={handleCodeChange}
              theme={vscodeDark}
              extensions={langExt()}
              minHeight="360px"
              style={{ fontSize: "0.855rem" }}
              basicSetup={editorSetup}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            <button className="sf-btn-ghost" style={{ width: "auto", flexShrink: 0 }} onClick={handleReset} disabled={!!busy}>
              Reset
            </button>
            <button className="sf-btn-secondary" style={{ flex: "1 0 140px" }} onClick={() => execute("run")} disabled={!!busy || !code.trim()}>
              {busy === "run" ? "Running…" : "Run tests"}
            </button>
            <button className="sf-btn" style={{ flex: "1 0 160px" }} onClick={() => execute("submit")} disabled={!!busy || !code.trim()}>
              {busy === "submit" ? "Grading…" : "Submit"}
            </button>
          </div>

          {error && <div className="sf-error">{error}</div>}

          {results && (
            <ContractTestResults
              result={results}
              title={mode === "run" ? "Public test run" : "Submission"}
            />
          )}
          {allPassed && !xpBanner && (
            <p style={{ fontSize: "0.802rem", color: "var(--color-green)", fontFamily: "var(--font-heading)", letterSpacing: "0.04em" }}>
              All tests passed — contract fulfilled.
            </p>
          )}
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "2rem 0" }} />
      <ContractComments contractId={contractId} currentUser={currentUser} />
    </div>
  );
}
