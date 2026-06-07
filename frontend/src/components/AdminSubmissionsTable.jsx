import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminSubmission, getAdminSubmissions } from "../services/userService";

/* ── Constants ────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 20;

const LANG_LABELS = {
  python: "Python", javascript: "JavaScript", java: "Java", csharp: "C#",
};
const LANG_COLORS = {
  python: "#4ade80", javascript: "#fbbf24", java: "#f87171", csharp: "#818cf8",
};
const DIFF_META = {
  shallow: { label: "Shallow", color: "#4ade80" },
  cryptic: { label: "Cryptic", color: "#fbbf24" },
  abyssal: { label: "Abyssal", color: "#f87171" },
};

const LANG_OPTIONS = [
  { value: "", label: "All Languages" },
  { value: "python",     label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "java",       label: "Java" },
  { value: "csharp",     label: "C#" },
];

/* ── Pagination ───────────────────────────────────────────────────────────── */

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const left  = Math.max(1, page - 2);
  const right = Math.min(totalPages, page + 2);
  if (left > 1) pages.push(1);
  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("…");
  if (right < totalPages) pages.push(totalPages);

  const base = {
    minWidth: "2rem", height: "2rem", padding: "0 0.5rem",
    borderRadius: "0.375rem", fontFamily: "var(--font-heading)",
    fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em",
    cursor: "pointer", transition: "all 0.15s", border: "1px solid",
  };
  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}
        style={{ ...base, borderColor: "rgba(255,255,255,0.10)", background: "transparent", color: page === 1 ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.50)", cursor: page === 1 ? "not-allowed" : "pointer" }}>←</button>
      {pages.map((p, i) =>
        p === "…"
          ? <span key={`e${i}`} style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem", padding: "0 0.25rem" }}>…</span>
          : <button key={p} onClick={() => onChange(p)} style={{ ...base, borderColor: p === page ? "rgba(3,233,244,0.40)" : "rgba(255,255,255,0.08)", background: p === page ? "rgba(3,233,244,0.10)" : "transparent", color: p === page ? "var(--color-cyan)" : "rgba(255,255,255,0.45)" }}>{p}</button>
      )}
      <button disabled={page === totalPages} onClick={() => onChange(page + 1)}
        style={{ ...base, borderColor: "rgba(255,255,255,0.10)", background: "transparent", color: page === totalPages ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.50)", cursor: page === totalPages ? "not-allowed" : "pointer" }}>→</button>
    </div>
  );
}

/* ── Solution modal ───────────────────────────────────────────────────────── */

function SolutionModal({ submissionId, onClose }) {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAdminSubmission(submissionId)
      .then(setDetail)
      .catch(() => setError("Could not load submission."))
      .finally(() => setLoading(false));
  }, [submissionId]);

  const diff = detail ? (DIFF_META[detail.difficulty] ?? DIFF_META.shallow) : null;
  const lang = detail?.language;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{ width: "100%", maxWidth: "820px", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "1rem 1.4rem 0.9rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {detail ? (
            <>
              {/* User link */}
              <Link
                to={`/users/${detail.user_id}`}
                onClick={onClose}
                style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-cyan)", textDecoration: "none", flexShrink: 0 }}
              >
                {detail.username}
              </Link>
              <span style={{ color: "rgba(255,255,255,0.20)", fontSize: "0.8rem", flexShrink: 0 }}>→</span>
              {/* Quest link */}
              <Link
                to={`/quests/${detail.language}/${detail.quest_id}`}
                onClick={onClose}
                style={{ fontFamily: "var(--font-heading)", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.88)", textDecoration: "none", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {detail.quest_title}
              </Link>
              {/* Language */}
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: LANG_COLORS[lang] ?? "#fff" }} />
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                  {LANG_LABELS[lang] ?? lang}
                </span>
              </span>
              {/* Difficulty */}
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.08em", color: diff?.color, textTransform: "uppercase", flexShrink: 0 }}>
                {diff?.label}
              </span>
              {/* Status pill */}
              <span style={{
                padding: "0.18rem 0.5rem", borderRadius: "4px", flexShrink: 0,
                fontFamily: "var(--font-heading)", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                background: detail.all_passed ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.10)",
                color:      detail.all_passed ? "#4ade80"               : "#f87171",
                border:     `1px solid ${detail.all_passed ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.20)"}`,
              }}>
                {detail.all_passed ? "Passed" : "Failed"}
              </span>
            </>
          ) : (
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", flex: 1 }}>
              Loading…
            </span>
          )}
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.32)", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, padding: "0.2rem 0.4rem", borderRadius: "4px", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.72)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.32)")}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.30)", fontFamily: "var(--font-heading)", fontSize: "0.72rem" }}>
            Loading submission…
          </div>
        ) : error ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#f87171", fontSize: "0.8rem" }}>{error}</div>
        ) : (
          <div style={{ overflowY: "auto", flex: 1 }}>
            {/* Test results bar */}
            {detail.test_results && (
              <div style={{ padding: "0.8rem 1.4rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                  Tests
                </span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.78rem", fontWeight: 700, color: detail.all_passed ? "#4ade80" : "#f87171" }}>
                  {detail.test_results.passed}/{detail.test_results.total} passed
                </span>
                <div style={{ display: "flex", gap: "0.28rem", flexWrap: "wrap", flex: 1 }}>
                  {(detail.test_results.results ?? []).map((r, idx) => (
                    <span
                      key={idx}
                      title={`Test ${idx + 1}: ${r.passed ? "passed" : "failed"}`}
                      style={{
                        width: "1.05rem", height: "1.05rem", borderRadius: "3px",
                        background: r.passed ? "rgba(74,222,128,0.18)" : "rgba(248,113,113,0.15)",
                        border: `1px solid ${r.passed ? "rgba(74,222,128,0.45)" : "rgba(248,113,113,0.40)"}`,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.48rem", color: r.passed ? "#4ade80" : "#f87171",
                      }}
                    >
                      {r.passed ? "✓" : "✗"}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.22)", flexShrink: 0 }}>
                  {new Date(detail.submitted_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}

            {/* Code */}
            <div style={{ padding: "0.85rem 1.4rem 1.2rem" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.55rem" }}>
                Submitted Code
              </p>
              <pre style={{
                margin: 0, padding: "1rem 1.1rem",
                background: "rgba(0,0,0,0.48)", borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "'Courier New', Courier, monospace", fontSize: "0.77rem",
                color: "rgba(255,255,255,0.80)", lineHeight: 1.7,
                overflowX: "auto", whiteSpace: "pre", tabSize: 4,
              }}>
                {detail.solution_code}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export default function AdminSubmissionsTable() {
  const [data,        setData]        = useState(null);   // paginated response
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [language,    setLanguage]    = useState("");
  const [statusFilter, setStatusFilter] = useState("");   // "" | "true" | "false"
  const [modalId,     setModalId]     = useState(null);   // submission id for the open modal

  // Debounced search to avoid a request on every keystroke
  const searchRef  = useRef(search);
  const debounceTimer = useRef(null);

  function applySearch(value) {
    searchRef.current = value;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearch(searchRef.current);
      setPage(1);
    }, 350);
  }

  useEffect(() => {
    setLoading(true);
    const params = { page, per_page: PAGE_SIZE };
    if (search)       params.search    = search;
    if (language)     params.language  = language;
    if (statusFilter) params.all_passed = statusFilter;

    let cancelled = false;
    getAdminSubmissions(params)
      .then(d  => { if (!cancelled) setData(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, search, language, statusFilter]);

  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const items = data?.items ?? [];

  return (
    <>
      {/* Section header + filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="section-divider" style={{ flex: 1, minWidth: "200px", marginBottom: 0 }}>
          <h2>All Submissions</h2>
        </div>
        <p className="text-dim text-xs" style={{ flexShrink: 0 }}>
          {total.toLocaleString()} run{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: "320px" }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text" className="sf-input" placeholder="Search user or quest…"
            defaultValue={search}
            onChange={(e) => applySearch(e.target.value)}
            style={{ paddingLeft: "2.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
          />
        </div>

        {/* Language filter */}
        <select
          value={language}
          onChange={(e) => { setLanguage(e.target.value); setPage(1); }}
          className="sf-input"
          style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", minWidth: "130px" }}
        >
          {LANG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Status toggle */}
        <div className="flex gap-1">
          {[["", "All"], ["true", "Passed"], ["false", "Failed"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setStatusFilter(val); setPage(1); }}
              style={{
                fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700,
                letterSpacing: "0.07em", textTransform: "uppercase",
                padding: "0.38rem 0.75rem", borderRadius: "6px",
                border: "1px solid",
                borderColor: statusFilter === val
                  ? (val === "true" ? "rgba(74,222,128,0.4)" : val === "false" ? "rgba(248,113,113,0.4)" : "rgba(3,233,244,0.35)")
                  : "rgba(255,255,255,0.10)",
                background: statusFilter === val
                  ? (val === "true" ? "rgba(74,222,128,0.10)" : val === "false" ? "rgba(248,113,113,0.10)" : "rgba(3,233,244,0.08)")
                  : "transparent",
                color: statusFilter === val
                  ? (val === "true" ? "#4ade80" : val === "false" ? "#f87171" : "var(--color-cyan)")
                  : "rgba(255,255,255,0.40)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.4fr) minmax(0,2fr) 90px 90px 80px 110px 72px",
          gap: "0.5rem", padding: "0.5rem 1rem 0.5rem 1.1rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          {["User", "Quest", "Language", "Score", "Status", "Date", ""].map((h, i) => (
            <span key={i} style={{ fontFamily: "var(--font-heading)", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              {h}
            </span>
          ))}
        </div>

        {/* Body */}
        {loading && !data ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="sf-spinner" />
            <span className="text-sub text-sm">Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sub text-sm">No submissions match your filters.</p>
          </div>
        ) : items.map((s, i) => {
          const lang       = s.language;
          const diff       = DIFF_META[s.difficulty] ?? DIFF_META.shallow;
          const passed     = s.passed ?? 0;
          const total      = s.total  ?? 0;
          const scoreColor = s.all_passed ? "#4ade80" : (passed > 0 ? "#fb923c" : "#f87171");

          return (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1.4fr) minmax(0,2fr) 90px 90px 80px 110px 72px",
                gap: "0.5rem", alignItems: "center",
                padding: "0.55rem 1rem 0.55rem 0",
                paddingLeft: "0",
                borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
                borderLeft: `3px solid ${s.all_passed ? "rgba(74,222,128,0.45)" : "rgba(248,113,113,0.30)"}`,
                paddingLeft: "0.85rem",
                transition: "background 0.10s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.018)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {/* User link */}
              <Link
                to={`/users/${s.user_id}`}
                style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-cyan)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {s.username}
              </Link>

              {/* Quest link */}
              <Link
                to={`/quests/${lang}/${s.quest_id}`}
                style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.72)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.95)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.72)")}
              >
                {s.quest_title}
              </Link>

              {/* Language */}
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: LANG_COLORS[lang] ?? "#fff", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.07em", color: "rgba(255,255,255,0.30)", textTransform: "uppercase" }}>
                  {LANG_LABELS[lang] ?? lang}
                </span>
              </span>

              {/* Score */}
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700, color: scoreColor }}>
                {total > 0 ? `${passed}/${total}` : "—"}
              </span>

              {/* Status */}
              <span style={{
                display: "inline-flex", alignItems: "center",
                padding: "0.15rem 0.45rem", borderRadius: "4px",
                fontFamily: "var(--font-heading)", fontSize: "0.46rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                background: s.all_passed ? "rgba(74,222,128,0.10)" : "rgba(248,113,113,0.09)",
                color:      s.all_passed ? "#4ade80"               : "#f87171",
                border:     `1px solid ${s.all_passed ? "rgba(74,222,128,0.22)" : "rgba(248,113,113,0.18)"}`,
              }}>
                {s.all_passed ? "Passed" : "Failed"}
              </span>

              {/* Date */}
              <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.22)" }}>
                {new Date(s.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>

              {/* View button */}
              <button
                onClick={() => setModalId(s.id)}
                style={{
                  fontFamily: "var(--font-heading)", fontSize: "0.52rem", fontWeight: 700,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  padding: "0.28rem 0.6rem", borderRadius: "5px",
                  border: "1px solid rgba(3,233,244,0.25)",
                  background: "rgba(3,233,244,0.06)", color: "var(--color-cyan)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(3,233,244,0.12)"; e.currentTarget.style.borderColor = "rgba(3,233,244,0.45)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(3,233,244,0.06)"; e.currentTarget.style.borderColor = "rgba(3,233,244,0.25)"; }}
              >
                View
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
        <p className="text-dim text-xs">
          {total > 0
            ? `Showing ${((page - 1) * PAGE_SIZE + 1).toLocaleString()}–${Math.min(page * PAGE_SIZE, total).toLocaleString()} of ${total.toLocaleString()}`
            : "No results"}
          {pages > 1 && ` · page ${page} of ${pages}`}
        </p>
        <Pagination page={page} totalPages={pages} onChange={setPage} />
      </div>

      {/* Solution modal */}
      {modalId && (
        <SolutionModal submissionId={modalId} onClose={() => setModalId(null)} />
      )}
    </>
  );
}
