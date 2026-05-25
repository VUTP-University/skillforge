import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteQuest, getQuests } from "../services/questService";

/* ── Constants ──────────────────────────────────────────────────────────── */

const PAGE_SIZE = 10;

const LANG_LABELS = {
  python:     "Python",
  javascript: "JavaScript",
  java:       "Java",
  csharp:     "C#",
};

const DIFF_META = {
  shallow: { label: "Shallow", color: "#4ade80", border: "rgba(74,222,128,0.30)",  bg: "rgba(74,222,128,0.09)"  },
  cryptic: { label: "Cryptic", color: "#fbbf24", border: "rgba(251,191,36,0.30)",  bg: "rgba(251,191,36,0.09)"  },
  abyssal: { label: "Abyssal", color: "#f87171", border: "rgba(248,113,113,0.30)", bg: "rgba(248,113,113,0.09)" },
};

/* ── Small helpers ──────────────────────────────────────────────────────── */

function StatCard({ label, value, icon }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div
        style={{
          width: "2.25rem", height: "2.25rem", flexShrink: 0,
          borderRadius: "0.65rem",
          background: "rgba(3,233,244,0.10)",
          border: "1px solid rgba(3,233,244,0.20)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sub text-xs" style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </p>
        <p className="text-white font-bold text-xl mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function DiffBadge({ difficulty }) {
  const m = DIFF_META[difficulty] ?? DIFF_META.shallow;
  return (
    <span className="badge" style={{ background: m.bg, borderColor: m.border, color: m.color }}>
      {m.label}
    </span>
  );
}

function ConfirmDelete({ questTitle, onConfirm, onCancel, busy }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem",
      }}
      onClick={onCancel}
    >
      <div
        className="glass-card p-6"
        style={{ maxWidth: "400px", width: "100%", border: "1px solid rgba(239,68,68,0.20)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-base mb-2">Delete Quest?</h3>
        <p className="text-sub text-sm mb-5">
          <span className="text-white">"{questTitle}"</span> and all its test cases will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button className="sf-btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={onConfirm}
            style={{
              flex: 1, padding: "0.6rem 1rem", borderRadius: "0.5rem", cursor: busy ? "not-allowed" : "pointer",
              border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.10)",
              color: "#f87171", opacity: busy ? 0.6 : 1,
              fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.15s",
            }}
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left  = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  if (left > 1) pages.push(1);
  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("…");
  if (right < totalPages) pages.push(totalPages);

  const btnBase = {
    minWidth: "2rem", height: "2rem", padding: "0 0.5rem",
    borderRadius: "0.375rem", fontFamily: "var(--font-heading)",
    fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em",
    cursor: "pointer", transition: "all 0.15s", border: "1px solid",
  };

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button
        style={{
          ...btnBase,
          borderColor: "rgba(255,255,255,0.10)",
          background: "transparent",
          color: page === 1 ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.50)",
          cursor: page === 1 ? "not-allowed" : "pointer",
        }}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem", padding: "0 0.25rem" }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              ...btnBase,
              borderColor: p === page ? "rgba(3,233,244,0.40)" : "rgba(255,255,255,0.08)",
              background:  p === page ? "rgba(3,233,244,0.10)" : "transparent",
              color:       p === page ? "var(--color-cyan)"    : "rgba(255,255,255,0.45)",
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        style={{
          ...btnBase,
          borderColor: "rgba(255,255,255,0.10)",
          background: "transparent",
          color: page === totalPages ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.50)",
          cursor: page === totalPages ? "not-allowed" : "pointer",
        }}
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        →
      </button>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quests, setQuests]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [pendingDelete, setPending] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const fetchQuests = useCallback(() => {
    setLoading(true);
    getQuests()
      .then(setQuests)
      .catch(() => setQuests([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchQuests(); }, [fetchQuests]);

  /* Reset to page 1 on search change */
  useEffect(() => { setPage(1); }, [search]);

  /* Filtered + paginated data */
  const term = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!term) return quests;
    return quests.filter((q) =>
      q.title.toLowerCase().includes(term) ||
      (LANG_LABELS[q.language] ?? q.language).toLowerCase().includes(term) ||
      (DIFF_META[q.difficulty]?.label ?? q.difficulty).toLowerCase().includes(term) ||
      (q.author ?? "").toLowerCase().includes(term)
    );
  }, [quests, term]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const pageSlice   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* Counts for stat cards */
  const langCounts = quests.reduce((acc, q) => {
    acc[q.language] = (acc[q.language] ?? 0) + 1;
    return acc;
  }, {});

  /* Delete */
  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteQuest(pendingDelete.id);
      setPending(null);
      fetchQuests();
    } finally {
      setDeleting(false);
    }
  }

  /* Column definition — drives both header and row cells */
  const COL_STYLE = {
    title:      { flex: "2 1 0", minWidth: 0 },
    language:   { flex: "1 0 90px", textAlign: "center" },
    difficulty: { flex: "1 0 90px", textAlign: "center" },
    xp:         { flex: "0 0 52px", textAlign: "center" },
    author:     { flex: "1 0 90px" },
    actions:    { flex: "0 0 120px", textAlign: "right" },
  };

  const rowStyle = {
    display: "flex", alignItems: "center",
    gap: "1rem", padding: "0 1.25rem",
  };

  const headerLabelStyle = {
    fontFamily: "var(--font-heading)",
    fontSize: "0.58rem", fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase",
    color: "rgba(255,255,255,0.28)",
  };

  return (
    <>
      {pendingDelete && (
        <ConfirmDelete
          questTitle={pendingDelete.title}
          onConfirm={confirmDelete}
          onCancel={() => !deleting && setPending(null)}
          busy={deleting}
        />
      )}

      <div className="space-y-10">

        {/* ── Header ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-red">Admin</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Admin Panel</h1>
          <p className="text-sub text-sm">
            Logged in as <span className="text-cyan">{user?.username}</span>.
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div>
          <div className="section-divider"><h2>Overview</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard
              label="Total Quests"
              value={loading ? "…" : quests.length}
              icon={
                <svg className="w-4 h-4 text-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              }
            />
            {["python","javascript","java","csharp"].map((lang) => (
              <StatCard
                key={lang}
                label={LANG_LABELS[lang]}
                value={loading ? "…" : (langCounts[lang] ?? 0)}
                icon={
                  <svg className="w-4 h-4 text-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                }
              />
            ))}
          </div>
        </div>

        {/* ── Quest Management ── */}
        <div>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="section-divider" style={{ flex: 1, minWidth: "180px", marginBottom: 0 }}>
              <h2>Quest Management</h2>
            </div>

            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 220px", maxWidth: "340px" }}>
              <svg
                className="w-3.5 h-3.5"
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                className="sf-input"
                placeholder="Search quests…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
              />
            </div>

            <button
              className="sf-btn"
              style={{ width: "auto", flexShrink: 0 }}
              onClick={() => navigate("/admin/quests/new")}
            >
              + Create Quest
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <div className="sf-spinner" />
              <span className="text-sub text-sm">Loading quests…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-center" style={{ minHeight: "140px" }}>
              <p className="text-sub text-sm">
                {term ? `No quests match "${search}".` : "No quests yet."}
              </p>
              {!term && (
                <p className="text-dim text-xs mt-1">
                  Click <span className="text-white/40">+ Create Quest</span> to publish the first one.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="glass-card overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>

                {/* Header row */}
                <div
                  style={{
                    ...rowStyle,
                    paddingTop: "0.65rem", paddingBottom: "0.65rem",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    background: "rgba(255,255,255,0.015)",
                  }}
                >
                  <span style={{ ...COL_STYLE.title,      ...headerLabelStyle }}>Title</span>
                  <span style={{ ...COL_STYLE.language,   ...headerLabelStyle }}>Language</span>
                  <span style={{ ...COL_STYLE.difficulty, ...headerLabelStyle }}>Difficulty</span>
                  <span style={{ ...COL_STYLE.xp,         ...headerLabelStyle }}>XP</span>
                  <span style={{ ...COL_STYLE.author,     ...headerLabelStyle }}>Author</span>
                  <span style={{ ...COL_STYLE.actions,    ...headerLabelStyle }}>Actions</span>
                </div>

                {/* Data rows */}
                {pageSlice.map((quest, i) => (
                  <div
                    key={quest.id}
                    style={{
                      ...rowStyle,
                      paddingTop: "0.9rem", paddingBottom: "0.9rem",
                      borderBottom: i < pageSlice.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Title + date */}
                    <div style={{ ...COL_STYLE.title, minWidth: 0 }}>
                      <p className="text-white text-sm font-semibold truncate">{quest.title}</p>
                      <p className="text-dim text-xs mt-0.5">
                        {new Date(quest.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Language */}
                    <div style={{ ...COL_STYLE.language }}>
                      <span
                        className="text-xs font-medium"
                        style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.05em", color: "rgba(255,255,255,0.60)" }}
                      >
                        {LANG_LABELS[quest.language] ?? quest.language}
                      </span>
                    </div>

                    {/* Difficulty */}
                    <div style={{ ...COL_STYLE.difficulty, display: "flex", justifyContent: "center" }}>
                      <DiffBadge difficulty={quest.difficulty} />
                    </div>

                    {/* XP */}
                    <div style={{ ...COL_STYLE.xp }}>
                      <span className="text-cyan font-bold text-sm">{quest.xp_reward}</span>
                    </div>

                    {/* Author */}
                    <div style={{ ...COL_STYLE.author, minWidth: 0 }}>
                      <span className="text-sub text-xs truncate block">{quest.author ?? "—"}</span>
                    </div>

                    {/* Actions */}
                    <div style={{ ...COL_STYLE.actions, display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button
                        className="sf-btn-ghost"
                        style={{ width: "auto", padding: "0.28rem 0.65rem", fontSize: "0.58rem" }}
                        onClick={() => navigate(`/admin/quests/${quest.id}/edit`)}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          padding: "0.28rem 0.65rem", borderRadius: "0.375rem",
                          border: "1px solid rgba(239,68,68,0.22)",
                          background: "transparent", color: "rgba(248,113,113,0.65)",
                          fontFamily: "var(--font-heading)", fontSize: "0.58rem",
                          fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.45)"; e.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(248,113,113,0.65)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.22)"; e.currentTarget.style.background = "transparent"; }}
                        onClick={() => setPending({ id: quest.id, title: quest.title })}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination + count */}
              <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                <p className="text-dim text-xs">
                  {filtered.length === quests.length
                    ? `${quests.length} quest${quests.length !== 1 ? "s" : ""} total`
                    : `${filtered.length} of ${quests.length} quests`}
                  {totalPages > 1 && ` · page ${safePage} of ${totalPages}`}
                </p>
                <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
              </div>
            </>
          )}
        </div>

        {/* ── User Management placeholder ── */}
        <div>
          <div className="section-divider"><h2>User Management</h2></div>
          <div className="glass-card p-10 flex flex-col items-center justify-center text-center" style={{ minHeight: "140px" }}>
            <svg className="w-8 h-8 mb-3" style={{ color: "rgba(255,255,255,0.10)" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-sub text-sm">User management is coming soon.</p>
            <p className="text-dim text-xs mt-1">Role assignment and audit logs will appear here.</p>
          </div>
        </div>

      </div>
    </>
  );
}
