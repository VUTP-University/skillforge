import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers, deleteUser } from "../services/api";
import Badge from "../components/Badge";
import Avatar from "../components/Avatar";

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
      .catch(() => setError("Could not load users."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    setError("");
    setDeletingId(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError("Failed to remove user. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="hero-eyebrow">ls ./users</p>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
              fontWeight: 700,
              color: "var(--color-text)",
              lineHeight: 1.2,
              marginBottom: "0.4rem",
            }}
          >
            Users
          </h1>
          <p className="text-sub" style={{ fontSize: "1rem" }}>All registered users on SkillForge</p>
        </div>
        {!loading && (
          <Badge variant="green" className="text-sm" style={{ fontSize: "0.783rem", padding: "0.35rem 0.875rem" }}>
            {users.length} {users.length === 1 ? "user" : "users"}
          </Badge>
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
          <span className="text-sub text-sm">Loading users…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && users.length === 0 && !error && (
        <div
          className="glass-card text-center py-16"
          style={{ borderStyle: "dashed" }}
        >
          <svg style={{ width: 40, height: 40, margin: "0 auto 1rem", color: "var(--color-text-faint)" }} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <p className="font-semibold mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>No users yet</p>
          <p className="text-sub" style={{ fontSize: "0.95rem" }}>No one has registered yet.</p>
        </div>
      )}

      {/* Table (desktop) / Cards (mobile) */}
      {users.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border-2)" }}>
                  {["#", "Username", "Email", "Joined", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left"
                      style={{
                        color: "var(--color-text-faint)",
                        fontFamily: "var(--font-heading)",
                        fontSize: "0.692rem",
                        fontWeight: 700,
                      }}
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
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(77,255,143,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-3.5 text-xs text-dim">{u.id}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/users/${u.id}`} style={{ textDecoration: "none" }}>
                        <div className="flex items-center gap-2.5" style={{ width: "fit-content" }}>
                          <Avatar src={u.avatar_url} username={u.username} size={28} />
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--color-text)", transition: "color 0.12s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-green)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                          >{u.username}</span>
                        </div>
                      </Link>
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
                        style={{ width: "auto", padding: "0.3rem 0.75rem", fontSize: "0.835rem" }}
                      >
                        {deletingId === u.id ? "Removing…" : "Remove"}
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
                <Link to={`/users/${u.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: 1 }}>
                  <Avatar src={u.avatar_url} username={u.username} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>{u.username}</p>
                    <p className="text-sub text-xs truncate">{u.email}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(u.id)}
                  disabled={deletingId === u.id}
                  className="sf-btn-danger flex-shrink-0"
                  style={{ width: "auto", padding: "0.3rem 0.75rem", fontSize: "0.835rem" }}
                >
                  {deletingId === u.id ? "…" : "Remove"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
