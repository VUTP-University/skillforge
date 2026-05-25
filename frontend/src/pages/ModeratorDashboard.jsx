import { useAuth } from "../context/AuthContext";

export default function ModeratorDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-10">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="badge"
            style={{
              background: "rgba(100,126,255,0.12)",
              borderColor: "rgba(100,126,255,0.30)",
              color: "var(--color-indigo-2)",
            }}
          >
            Moderator
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Moderator Panel
        </h1>
        <p className="text-sub text-sm max-w-lg">
          Review reported content, manage quest submissions, and support users.
          Logged in as <span className="text-cyan">{user?.username}</span>.
        </p>
      </div>

      {/* Placeholder */}
      <div>
        <div className="section-divider">
          <h2>Moderation Queue</h2>
        </div>
        <div
          className="glass-card p-10 flex flex-col items-center justify-center text-center"
          style={{ minHeight: "200px" }}
        >
          <svg className="w-10 h-10 mb-3" style={{ color: "rgba(255,255,255,0.12)" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <p className="text-sub text-sm">The moderation queue is coming soon.</p>
          <p className="text-dim text-xs mt-1">Flagged content, quest approvals, and user reports will appear here.</p>
        </div>
      </div>

    </div>
  );
}
