import { useEffect, useState } from "react";
import { getUsers, deleteUser } from "../services/api";

function AlertIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    getUsers()
      .then((r) => setUsers(r.data))
      .catch(() => setError("Could not load guild members."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    setError("");
    setDeletingId(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError("Failed to remove member. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1.5 text-display">The Guild</h1>
          <p className="text-sub text-sm">All adventurers who have joined the Order</p>
        </div>
        {!loading && (
          <div className="badge badge-cyan" style={{ fontSize: "0.75rem", padding: "0.35rem 0.875rem" }}>
            {users.length} {users.length === 1 ? "member" : "members"}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="sf-error">
          <AlertIcon />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-8">
          <div className="sf-spinner" />
          <span className="text-sub text-sm">Loading guild members…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && users.length === 0 && !error && (
        <div
          className="glass-card text-center py-16"
          style={{ borderStyle: "dashed" }}
        >
          <p className="text-4xl mb-3">⚗</p>
          <p className="text-white font-semibold mb-1">The guild hall is empty</p>
          <p className="text-sub text-sm">No adventurers have joined yet.</p>
        </div>
      )}

      {/* Table (desktop) / Cards (mobile) */}
      {users.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["#", "Username", "Email", "Joined", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: i < users.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-3.5 text-xs text-dim">{u.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="avatar-initials" style={{ width: "1.75rem", height: "1.75rem", fontSize: "0.65rem" }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="text-white text-sm font-medium">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-sub">{u.email}</td>
                    <td className="px-5 py-3.5 text-xs text-dim">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id}
                        className="sf-btn-danger"
                        style={{ width: "auto", padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        {deletingId === u.id ? "Removing…" : "Banish"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="glass-card p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="avatar-initials flex-shrink-0">
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{u.username}</p>
                    <p className="text-sub text-xs truncate">{u.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(u.id)}
                  disabled={deletingId === u.id}
                  className="sf-btn-danger flex-shrink-0"
                  style={{ width: "auto", padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                >
                  {deletingId === u.id ? "…" : "Banish"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
