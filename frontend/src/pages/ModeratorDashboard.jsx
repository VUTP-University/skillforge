import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminSubmissionsTable from "../components/AdminSubmissionsTable";
import { getAdminUsers } from "../services/userService";
import { getReports, updateReport } from "../services/reportService";

const REPORT_STATUS_META = {
  reported:    { label: "Reported",    color: "var(--color-red-bright)", border: "var(--color-red-border)", bg: "var(--color-red-dim)" },
  in_progress: { label: "In Progress", color: "var(--color-amber)", border: "var(--color-amber-border)",  bg: "var(--color-amber-dim)"  },
  solved:      { label: "Solved",      color: "var(--color-green)", border: "var(--color-green-border)",  bg: "var(--color-green-dim)"  },
};

const ROLE_META = {
  admin:     { label: "Admin" },
  moderator: { label: "Moderator" },
  user:      { label: "User" },
};

const rowStyle    = { display: "flex", alignItems: "center", gap: "1rem", padding: "0 1.25rem" };
const headerLabel = { fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-tertiary)" };

function ReportStatusBadge({ status }) {
  const m = REPORT_STATUS_META[status] ?? REPORT_STATUS_META.reported;
  return <span className="badge" style={{ background: m.bg, borderColor: m.border, color: m.color }}>{m.label}</span>;
}

export default function ModeratorDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [reports,  setReports]  = useState([]);
  const [rLoading, setRLoading] = useState(true);
  const [users,    setUsers]    = useState([]);
  const [filter,   setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);
  const [patch,    setPatch]    = useState({});
  const [saving,   setSaving]   = useState(false);

  const fetchReports = useCallback(() => {
    setRLoading(true);
    getReports().then(setReports).catch(() => setReports([])).finally(() => setRLoading(false));
  }, []);

  useEffect(() => {
    fetchReports();
    getAdminUsers().then(setUsers).catch(() => setUsers([]));
  }, [fetchReports]);

  const staffUsers = useMemo(
    () => users.filter((u) => u.role === "admin" || u.role === "moderator"),
    [users]
  );

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const openReport = (report) => {
    setSelected(report);
    setPatch({ status: report.status, assigned_to_id: report.assigned_to_id ?? null });
  };

  const handleSave = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const updated = await updateReport(selected.id, patch);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelected(updated);
    } finally {
      setSaving(false);
    }
  };

  const RC = {
    job:      { flex: "2 1 0", minWidth: 0 },
    reporter: { flex: "1 0 100px" },
    status:   { flex: "1 0 110px", textAlign: "center" },
    date:     { flex: "1 0 90px" },
    actions:  { flex: "0 0 100px", textAlign: "right" },
  };

  return (
    <div className="space-y-10">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="badge" style={{ background: "var(--color-blue-dim)", borderColor: "var(--color-blue-border)", color: "var(--color-blue)" }}>
            Moderator
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Moderator Panel</h1>
        <p className="text-sub text-sm max-w-lg">
          Review reported content, manage job submissions, and support users.
          Logged in as <span className="text-green">{user?.username}</span>.
        </p>
      </div>

      {/* ── Job Reports ── */}
      <div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="section-divider" style={{ flex: 1, minWidth: "180px", marginBottom: 0 }}><h2>Job Reports</h2></div>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {["all", "reported", "in_progress", "solved"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: "0.35rem 0.75rem", borderRadius: "0.375rem", cursor: "pointer",
                  fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.15s",
                  border: filter === f ? "1px solid var(--color-green-border)" : "1px solid rgba(255,255,255,0.10)",
                  background: filter === f ? "var(--color-green-dim)" : "transparent",
                  color: filter === f ? "var(--color-green)" : "rgba(255,255,255,0.40)",
                }}>
                {f === "all" ? "All" : REPORT_STATUS_META[f]?.label ?? f}
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="glass-card p-5 mb-4" style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "0.35rem" }}>Job</p>
                <p className="text-white font-semibold text-sm">{selected.job_title ?? `Job #${selected.job_id}`}</p>
                <p style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", marginTop: "0.15rem" }}>
                  Reported by <span style={{ color: "rgba(255,255,255,0.60)" }}>{selected.reporter}</span> · {new Date(selected.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: "1.25rem", lineHeight: 1, flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.30)")}
              >×</button>
            </div>

            <div style={{ padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "1.25rem" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "0.4rem" }}>Reason</p>
              <p style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.65 }}>{selected.reason}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "0.5rem" }}>Status</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {Object.entries(REPORT_STATUS_META).map(([val, m]) => (
                    <button key={val} onClick={() => setPatch((p) => ({ ...p, status: val }))}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.5rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer",
                        border: patch.status === val ? `1px solid ${m.border.replace("0.30", "0.60")}` : "1px solid rgba(255,255,255,0.08)",
                        background: patch.status === val ? m.bg : "rgba(255,255,255,0.02)", transition: "all 0.15s",
                      }}>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: patch.status === val ? m.color : "rgba(255,255,255,0.45)" }}>{m.label}</span>
                      {patch.status === val && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ color: m.color }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "0.5rem" }}>Assigned To</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <button onClick={() => setPatch((p) => ({ ...p, assigned_to_id: null }))}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.5rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer",
                      border: patch.assigned_to_id === null ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.08)",
                      background: patch.assigned_to_id === null ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)", transition: "all 0.15s",
                    }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: patch.assigned_to_id === null ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.35)" }}>Unassigned</span>
                    {patch.assigned_to_id === null && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ color: "rgba(255,255,255,0.50)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                  {staffUsers.map((u) => (
                    <button key={u.id} onClick={() => setPatch((p) => ({ ...p, assigned_to_id: u.id }))}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.5rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer",
                        border: patch.assigned_to_id === u.id ? "1px solid var(--color-green-border)" : "1px solid rgba(255,255,255,0.08)",
                        background: patch.assigned_to_id === u.id ? "var(--color-green-dim)" : "rgba(255,255,255,0.02)", transition: "all 0.15s",
                      }}>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: patch.assigned_to_id === u.id ? "var(--color-green)" : "rgba(255,255,255,0.45)" }}>
                        {u.username}
                        <span style={{ marginLeft: "0.4rem", fontSize: "0.55rem", opacity: 0.55 }}>({ROLE_META[u.role]?.label})</span>
                      </span>
                      {patch.assigned_to_id === u.id && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ color: "var(--color-green)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button className="sf-btn-ghost" style={{ width: "auto", padding: "0.5rem 1rem" }} onClick={() => setSelected(null)}>Close</button>
              <button className="sf-btn" style={{ width: "auto", padding: "0.5rem 1.25rem", opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
                {saving ? <><div className="sf-spinner" style={{ width: "11px", height: "11px", borderWidth: "2px" }} /> Saving…</> : "Save Changes"}
              </button>
              <button className="sf-btn-ghost" style={{ width: "auto", padding: "0.5rem 1rem", marginLeft: "auto" }} onClick={() => navigate(`/admin/jobs/${selected.job_id}/edit`)}>
                Edit Job →
              </button>
            </div>
          </div>
        )}

        {rLoading ? (
          <div className="flex items-center justify-center gap-3 py-16"><div className="sf-spinner" /><span className="text-sub text-sm">Loading reports…</span></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-10 flex flex-col items-center justify-center text-center" style={{ minHeight: "120px" }}>
            <p className="text-sub text-sm">{filter === "all" ? "No job reports yet." : `No ${REPORT_STATUS_META[filter]?.label.toLowerCase()} reports.`}</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ ...rowStyle, paddingTop: "0.65rem", paddingBottom: "0.65rem", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
              <span style={{ ...RC.job,    ...headerLabel }}>Job</span>
              <span style={{ ...RC.reporter, ...headerLabel }}>Reporter</span>
              <span style={{ ...RC.status,   ...headerLabel }}>Status</span>
              <span style={{ ...RC.date,     ...headerLabel }}>Date</span>
              <span style={{ ...RC.actions,  ...headerLabel }}>Actions</span>
            </div>
            {filtered.map((report, i) => (
              <div key={report.id}
                style={{ ...rowStyle, paddingTop: "0.85rem", paddingBottom: "0.85rem", borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ ...RC.job, minWidth: 0 }}>
                  <p className="text-white text-sm font-semibold truncate">{report.job_title ?? `Job #${report.job_id}`}</p>
                  {report.assigned_to && <p className="text-dim text-xs mt-0.5">Assigned: {report.assigned_to}</p>}
                </div>
                <div style={RC.reporter}><span className="text-sub text-xs">{report.reporter}</span></div>
                <div style={{ ...RC.status, display: "flex", justifyContent: "center" }}><ReportStatusBadge status={report.status} /></div>
                <div style={RC.date}><span className="text-dim text-xs">{new Date(report.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span></div>
                <div style={{ ...RC.actions, display: "flex", justifyContent: "flex-end" }}>
                  <button className="sf-btn-ghost" style={{ width: "auto", padding: "0.28rem 0.65rem", fontSize: "0.58rem" }} onClick={() => openReport(report)}>Review</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submissions */}
      <div>
        <AdminSubmissionsTable />
      </div>

    </div>
  );
}
