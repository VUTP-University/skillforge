import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminSubmissionsTable from "../components/AdminSubmissionsTable";
import { deleteQuest, getQuests } from "../services/questService";
import { deleteAdminUser, getAdminUsers, updateUserRole } from "../services/userService";

/* ═══════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════ */

const PAGE_SIZE = 10;

const LANG_LABELS = {
  python: "Python", javascript: "JavaScript", java: "Java", csharp: "C#",
};

const DIFF_META = {
  shallow: { label: "Shallow", color: "#4ade80", border: "rgba(74,222,128,0.30)",  bg: "rgba(74,222,128,0.09)"  },
  cryptic: { label: "Cryptic", color: "#fbbf24", border: "rgba(251,191,36,0.30)",  bg: "rgba(251,191,36,0.09)"  },
  abyssal: { label: "Abyssal", color: "#f87171", border: "rgba(248,113,113,0.30)", bg: "rgba(248,113,113,0.09)" },
};

const ROLE_META = {
  admin:     { label: "Admin",     color: "#f87171", border: "rgba(248,113,113,0.30)", bg: "rgba(248,113,113,0.09)" },
  moderator: { label: "Moderator", color: "#818cf8", border: "rgba(129,140,248,0.30)", bg: "rgba(129,140,248,0.09)" },
  user:      { label: "User",      color: "rgba(255,255,255,0.55)", border: "rgba(255,255,255,0.15)", bg: "rgba(255,255,255,0.05)" },
};

const ALL_ROLES = ["user", "moderator", "admin"];

/* ═══════════════════════════════════════════════════
   SHARED UI HELPERS
   ═══════════════════════════════════════════════════ */

function StatCard({ label, value, icon }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div style={{
        width: "2.25rem", height: "2.25rem", flexShrink: 0,
        borderRadius: "0.65rem",
        background: "rgba(3,233,244,0.10)", border: "1px solid rgba(3,233,244,0.20)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
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
  return <span className="badge" style={{ background: m.bg, borderColor: m.border, color: m.color }}>{m.label}</span>;
}

function RoleBadge({ role }) {
  const m = ROLE_META[role] ?? ROLE_META.user;
  return <span className="badge" style={{ background: m.bg, borderColor: m.border, color: m.color }}>{m.label}</span>;
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", flex: "1 1 220px", maxWidth: "340px" }}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        type="text" className="sf-input" placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)}
        style={{ paddingLeft: "2.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
      />
    </div>
  );
}

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

/* ═══════════════════════════════════════════════════
   MODALS
   ═══════════════════════════════════════════════════ */

function DeleteModal({ title, body, onConfirm, onCancel, busy }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
      onClick={onCancel}>
      <div className="glass-card p-6" style={{ maxWidth: "400px", width: "100%", border: "1px solid rgba(239,68,68,0.20)" }}
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white font-bold text-base mb-2">{title}</h3>
        <p className="text-sub text-sm mb-5">{body}</p>
        <div className="flex gap-3">
          <button className="sf-btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>Cancel</button>
          <button disabled={busy} onClick={onConfirm}
            style={{ flex: 1, padding: "0.6rem 1rem", borderRadius: "0.5rem", cursor: busy ? "not-allowed" : "pointer", border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.10)", color: "#f87171", opacity: busy ? 0.6 : 1, fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.15s" }}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleModal({ target, selectedRole, onRoleSelect, onConfirm, onCancel, busy }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
      onClick={onCancel}>
      <div className="glass-card p-6" style={{ maxWidth: "380px", width: "100%", border: "1px solid rgba(255,255,255,0.10)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* User info */}
        <div className="flex items-center gap-3 mb-5">
          <div className="avatar-initials">{target.username[0].toUpperCase()}</div>
          <div>
            <p className="text-white font-semibold text-sm">{target.username}</p>
            <p className="text-sub text-xs">{target.email}</p>
          </div>
        </div>

        <p className="sf-label mb-3">Assign Role</p>

        {/* Role picker */}
        <div className="flex flex-col gap-2 mb-5">
          {ALL_ROLES.map((role) => {
            const m = ROLE_META[role];
            const active = selectedRole === role;
            return (
              <button key={role} type="button" onClick={() => onRoleSelect(role)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.65rem 0.875rem", borderRadius: "0.5rem", cursor: "pointer",
                  border: active ? `1px solid ${m.border.replace("0.30", "0.60")}` : "1px solid rgba(255,255,255,0.08)",
                  background: active ? m.bg : "rgba(255,255,255,0.02)",
                  transition: "all 0.15s",
                }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: active ? m.color : "rgba(255,255,255,0.45)" }}>
                  {m.label}
                </span>
                {active && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ color: m.color }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button className="sf-btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="sf-btn" disabled={busy || selectedRole === target.role}
            style={{ flex: 1, opacity: (busy || selectedRole === target.role) ? 0.5 : 1 }}
            onClick={onConfirm}>
            {busy ? <><div className="sf-spinner" /> Saving…</> : "Save Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TABLE LAYOUT HELPERS
   ═══════════════════════════════════════════════════ */

const rowStyle    = { display: "flex", alignItems: "center", gap: "1rem", padding: "0 1.25rem" };
const headerLabel = { fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" };

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

export default function AdminDashboard() {
  const { user: self } = useAuth();
  const navigate        = useNavigate();

  /* ── Quest state ── */
  const [quests, setQuests]           = useState([]);
  const [questsLoading, setQL]        = useState(true);
  const [questSearch, setQuestSearch] = useState("");
  const [questPage, setQuestPage]     = useState(1);
  const [deleteQuest_, setDeleteQ]    = useState(null);
  const [deletingQ, setDeletingQ]     = useState(false);

  /* ── User state ── */
  const [users, setUsers]           = useState([]);
  const [usersLoading, setUL]       = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage]     = useState(1);
  const [deleteUser_, setDeleteU]   = useState(null);
  const [deletingU, setDeletingU]   = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);  // { user, selectedRole }
  const [savingRole, setSavingRole] = useState(false);

  /* ── Fetch ── */
  const fetchQuests = useCallback(() => {
    setQL(true);
    getQuests().then(setQuests).catch(() => setQuests([])).finally(() => setQL(false));
  }, []);

  const fetchUsers = useCallback(() => {
    setUL(true);
    getAdminUsers().then(setUsers).catch(() => setUsers([])).finally(() => setUL(false));
  }, []);

  useEffect(() => { fetchQuests(); fetchUsers(); }, [fetchQuests, fetchUsers]);
  useEffect(() => { setQuestPage(1); }, [questSearch]);
  useEffect(() => { setUserPage(1);  }, [userSearch]);

  /* ── Quest filter + pagination ── */
  const qTerm      = questSearch.trim().toLowerCase();
  const filteredQ  = useMemo(() =>
    !qTerm ? quests : quests.filter(q =>
      q.title.toLowerCase().includes(qTerm) ||
      (LANG_LABELS[q.language] ?? q.language).toLowerCase().includes(qTerm) ||
      (DIFF_META[q.difficulty]?.label ?? q.difficulty).toLowerCase().includes(qTerm) ||
      (q.author ?? "").toLowerCase().includes(qTerm)
    ), [quests, qTerm]);
  const qPages   = Math.max(1, Math.ceil(filteredQ.length / PAGE_SIZE));
  const qSafe    = Math.min(questPage, qPages);
  const qSlice   = filteredQ.slice((qSafe - 1) * PAGE_SIZE, qSafe * PAGE_SIZE);

  /* ── User filter + pagination ── */
  const uTerm     = userSearch.trim().toLowerCase();
  const filteredU = useMemo(() =>
    !uTerm ? users : users.filter(u =>
      u.username.toLowerCase().includes(uTerm) ||
      u.email.toLowerCase().includes(uTerm) ||
      (ROLE_META[u.role]?.label ?? u.role).toLowerCase().includes(uTerm)
    ), [users, uTerm]);
  const uPages  = Math.max(1, Math.ceil(filteredU.length / PAGE_SIZE));
  const uSafe   = Math.min(userPage, uPages);
  const uSlice  = filteredU.slice((uSafe - 1) * PAGE_SIZE, uSafe * PAGE_SIZE);

  /* ── Quest delete ── */
  async function confirmQuestDelete() {
    if (!deleteQuest_) return;
    setDeletingQ(true);
    try { await deleteQuest(deleteQuest_.id); setDeleteQ(null); fetchQuests(); }
    finally { setDeletingQ(false); }
  }

  /* ── User delete ── */
  async function confirmUserDelete() {
    if (!deleteUser_) return;
    setDeletingU(true);
    try { await deleteAdminUser(deleteUser_.id); setDeleteU(null); fetchUsers(); }
    finally { setDeletingU(false); }
  }

  /* ── Role change ── */
  async function confirmRoleChange() {
    if (!roleTarget) return;
    setSavingRole(true);
    try {
      await updateUserRole(roleTarget.user.id, roleTarget.selectedRole);
      setRoleTarget(null);
      fetchUsers();
    } finally {
      setSavingRole(false);
    }
  }

  /* ── Derived counts ── */
  const langCounts = quests.reduce((a, q) => { a[q.language] = (a[q.language] ?? 0) + 1; return a; }, {});
  const roleCounts = users.reduce((a, u)  => { a[u.role]     = (a[u.role]     ?? 0) + 1; return a; }, {});

  /* ── Quest column widths ── */
  const QC = { title: { flex: "2 1 0", minWidth: 0 }, language: { flex: "1 0 90px", textAlign: "center" }, difficulty: { flex: "1 0 90px", textAlign: "center" }, xp: { flex: "0 0 52px", textAlign: "center" }, author: { flex: "1 0 90px" }, actions: { flex: "0 0 120px", textAlign: "right" } };

  /* ── User column widths ── */
  const UC = { identity: { flex: "2 1 0", minWidth: 0 }, role: { flex: "1 0 110px", textAlign: "center" }, joined: { flex: "1 0 100px" }, actions: { flex: "0 0 150px", textAlign: "right" } };

  /* ═══════════ RENDER ═══════════ */
  return (
    <>
      {/* ── Quest delete modal ── */}
      {deleteQuest_ && (
        <DeleteModal
          title="Delete Quest?"
          body={<><span className="text-white">"{deleteQuest_.title}"</span> and all its test cases will be permanently removed.</>}
          onConfirm={confirmQuestDelete} onCancel={() => !deletingQ && setDeleteQ(null)} busy={deletingQ}
        />
      )}

      {/* ── User delete modal ── */}
      {deleteUser_ && (
        <DeleteModal
          title="Delete User?"
          body={<>Account <span className="text-white">{deleteUser_.username}</span> will be permanently removed. This cannot be undone.</>}
          onConfirm={confirmUserDelete} onCancel={() => !deletingU && setDeleteU(null)} busy={deletingU}
        />
      )}

      {/* ── Role change modal ── */}
      {roleTarget && (
        <RoleModal
          target={roleTarget.user}
          selectedRole={roleTarget.selectedRole}
          onRoleSelect={(r) => setRoleTarget((prev) => ({ ...prev, selectedRole: r }))}
          onConfirm={confirmRoleChange}
          onCancel={() => !savingRole && setRoleTarget(null)}
          busy={savingRole}
        />
      )}

      <div className="space-y-10">

        {/* ── Page header ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-red">Admin</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Admin Panel</h1>
          <p className="text-sub text-sm">
            Logged in as <span className="text-cyan">{self?.username}</span>.
          </p>
        </div>

        {/* ── Overview ── */}
        <div>
          <div className="section-divider"><h2>Overview</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard label="Total Quests" value={questsLoading ? "…" : quests.length}
              icon={<svg className="w-4 h-4 text-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>} />
            {["python","javascript","java","csharp"].map((lang) => (
              <StatCard key={lang} label={LANG_LABELS[lang]} value={questsLoading ? "…" : (langCounts[lang] ?? 0)}
                icon={<svg className="w-4 h-4 text-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>} />
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            QUEST MANAGEMENT
            ═══════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="section-divider" style={{ flex: 1, minWidth: "180px", marginBottom: 0 }}><h2>Quest Management</h2></div>
            <SearchInput value={questSearch} onChange={setQuestSearch} placeholder="Search quests…" />
            <button className="sf-btn" style={{ width: "auto", flexShrink: 0 }} onClick={() => navigate("/admin/quests/new")}>
              + Create Quest
            </button>
          </div>

          {questsLoading ? (
            <div className="flex items-center justify-center gap-3 py-16"><div className="sf-spinner" /><span className="text-sub text-sm">Loading quests…</span></div>
          ) : filteredQ.length === 0 ? (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-center" style={{ minHeight: "140px" }}>
              <p className="text-sub text-sm">{qTerm ? `No quests match "${questSearch}".` : "No quests yet."}</p>
              {!qTerm && <p className="text-dim text-xs mt-1">Click <span className="text-white/40">+ Create Quest</span> to publish the first one.</p>}
            </div>
          ) : (
            <>
              <div className="glass-card overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Header */}
                <div style={{ ...rowStyle, paddingTop: "0.65rem", paddingBottom: "0.65rem", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
                  <span style={{ ...QC.title,      ...headerLabel }}>Title</span>
                  <span style={{ ...QC.language,   ...headerLabel }}>Language</span>
                  <span style={{ ...QC.difficulty, ...headerLabel }}>Difficulty</span>
                  <span style={{ ...QC.xp,         ...headerLabel }}>XP</span>
                  <span style={{ ...QC.author,     ...headerLabel }}>Author</span>
                  <span style={{ ...QC.actions,    ...headerLabel }}>Actions</span>
                </div>
                {/* Rows */}
                {qSlice.map((quest, i) => (
                  <div key={quest.id} style={{ ...rowStyle, paddingTop: "0.9rem", paddingBottom: "0.9rem", borderBottom: i < qSlice.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ ...QC.title, minWidth: 0 }}>
                      <p className="text-white text-sm font-semibold truncate">{quest.title}</p>
                      <p className="text-dim text-xs mt-0.5">{new Date(quest.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    </div>
                    <div style={QC.language}>
                      <span className="text-xs font-medium" style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.05em", color: "rgba(255,255,255,0.60)" }}>{LANG_LABELS[quest.language] ?? quest.language}</span>
                    </div>
                    <div style={{ ...QC.difficulty, display: "flex", justifyContent: "center" }}>
                      <DiffBadge difficulty={quest.difficulty} />
                    </div>
                    <div style={QC.xp}><span className="text-cyan font-bold text-sm">{quest.xp_reward}</span></div>
                    <div style={{ ...QC.author, minWidth: 0 }}><span className="text-sub text-xs truncate block">{quest.author ?? "—"}</span></div>
                    <div style={{ ...QC.actions, display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button className="sf-btn-ghost" style={{ width: "auto", padding: "0.28rem 0.65rem", fontSize: "0.58rem" }} onClick={() => navigate(`/admin/quests/${quest.id}/edit`)}>Edit</button>
                      <button onClick={() => setDeleteQ({ id: quest.id, title: quest.title })}
                        style={{ padding: "0.28rem 0.65rem", borderRadius: "0.375rem", border: "1px solid rgba(239,68,68,0.22)", background: "transparent", color: "rgba(248,113,113,0.65)", fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.45)"; e.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(248,113,113,0.65)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.22)"; e.currentTarget.style.background = "transparent"; }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                <p className="text-dim text-xs">
                  {filteredQ.length === quests.length ? `${quests.length} quest${quests.length !== 1 ? "s" : ""} total` : `${filteredQ.length} of ${quests.length} quests`}
                  {qPages > 1 && ` · page ${qSafe} of ${qPages}`}
                </p>
                <Pagination page={qSafe} totalPages={qPages} onChange={setQuestPage} />
              </div>
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            USER MANAGEMENT
            ═══════════════════════════════════════════════ */}
        <div>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="section-divider" style={{ flex: 1, minWidth: "180px", marginBottom: 0 }}><h2>User Management</h2></div>
            <SearchInput value={userSearch} onChange={setUserSearch} placeholder="Search users…" />
          </div>

          {/* Mini stats */}
          {!usersLoading && users.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total",      value: users.length,                color: "rgba(255,255,255,0.60)" },
                { label: "Admins",     value: roleCounts.admin     ?? 0,   color: ROLE_META.admin.color     },
                { label: "Moderators", value: roleCounts.moderator ?? 0,   color: ROLE_META.moderator.color },
                { label: "Users",      value: roleCounts.user      ?? 0,   color: ROLE_META.user.color      },
              ].map((s) => (
                <div key={s.label} className="glass-card p-4 text-center">
                  <p className="font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-dim text-xs mt-0.5" style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {usersLoading ? (
            <div className="flex items-center justify-center gap-3 py-16"><div className="sf-spinner" /><span className="text-sub text-sm">Loading users…</span></div>
          ) : filteredU.length === 0 ? (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-center" style={{ minHeight: "140px" }}>
              <p className="text-sub text-sm">{uTerm ? `No users match "${userSearch}".` : "No users found."}</p>
            </div>
          ) : (
            <>
              <div className="glass-card overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Header */}
                <div style={{ ...rowStyle, paddingTop: "0.65rem", paddingBottom: "0.65rem", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
                  <span style={{ ...UC.identity, ...headerLabel }}>User</span>
                  <span style={{ ...UC.role,     ...headerLabel }}>Role</span>
                  <span style={{ ...UC.joined,   ...headerLabel }}>Joined</span>
                  <span style={{ ...UC.actions,  ...headerLabel }}>Actions</span>
                </div>

                {/* Rows */}
                {uSlice.map((u, i) => {
                  const isSelf = u.id === self?.id;
                  return (
                    <div key={u.id}
                      style={{ ...rowStyle, paddingTop: "0.85rem", paddingBottom: "0.85rem", borderBottom: i < uSlice.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

                      {/* Identity */}
                      <div style={{ ...UC.identity, display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                        <div className="avatar-initials" style={{ width: "2rem", height: "2rem", fontSize: "0.75rem", flexShrink: 0 }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p className="text-white text-sm font-semibold truncate">
                            {u.username}
                            {isSelf && <span className="ml-2 text-cyan" style={{ fontSize: "0.65rem", fontFamily: "var(--font-heading)", letterSpacing: "0.06em" }}>(you)</span>}
                          </p>
                          <p className="text-dim text-xs truncate">{u.email}</p>
                        </div>
                      </div>

                      {/* Role */}
                      <div style={{ ...UC.role, display: "flex", justifyContent: "center" }}>
                        <RoleBadge role={u.role} />
                      </div>

                      {/* Joined */}
                      <div style={UC.joined}>
                        <span className="text-sub text-xs">
                          {new Date(u.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ ...UC.actions, display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button
                          disabled={isSelf}
                          onClick={() => !isSelf && setRoleTarget({ user: u, selectedRole: u.role })}
                          className="sf-btn-ghost"
                          style={{ width: "auto", padding: "0.28rem 0.65rem", fontSize: "0.58rem", opacity: isSelf ? 0.3 : 1, cursor: isSelf ? "not-allowed" : "pointer" }}>
                          Change Role
                        </button>
                        <button
                          disabled={isSelf}
                          onClick={() => !isSelf && setDeleteU({ id: u.id, username: u.username })}
                          style={{ padding: "0.28rem 0.65rem", borderRadius: "0.375rem", border: "1px solid rgba(239,68,68,0.22)", background: "transparent", color: "rgba(248,113,113,0.65)", fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.15s", opacity: isSelf ? 0.3 : 1, cursor: isSelf ? "not-allowed" : "pointer" }}
                          onMouseEnter={(e) => { if (!isSelf) { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.45)"; e.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(248,113,113,0.65)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.22)"; e.currentTarget.style.background = "transparent"; }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                <p className="text-dim text-xs">
                  {filteredU.length === users.length ? `${users.length} user${users.length !== 1 ? "s" : ""} total` : `${filteredU.length} of ${users.length} users`}
                  {uPages > 1 && ` · page ${uSafe} of ${uPages}`}
                </p>
                <Pagination page={uSafe} totalPages={uPages} onChange={setUserPage} />
              </div>
            </>
          )}
        </div>

        {/* ── Submissions section ── */}
        <div>
          <AdminSubmissionsTable />
        </div>

      </div>
    </>
  );
}
