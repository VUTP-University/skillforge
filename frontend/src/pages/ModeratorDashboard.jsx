import { useAuth } from "../context/AuthContext";
import AdminSubmissionsTable from "../components/AdminSubmissionsTable";

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

      {/* Submissions */}
      <div>
        <AdminSubmissionsTable />
      </div>

    </div>
  );
}
