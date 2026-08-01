import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Users from "./pages/Users";
import AdminDashboard from "./pages/AdminDashboard";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import JobForm from "./pages/JobForm";
import LanguageJobsPage from "./pages/LanguageJobsPage";
import JobSolvePage from "./pages/JobSolvePage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import StackTracePage from "./pages/StackTracePage";
import StackTraceChallengePage from "./pages/StackTraceChallengePage";
import TestSuitePage from "./pages/TestSuitePage";
import TestSuitePlayPage from "./pages/TestSuitePlayPage";
import FAQPage from "./pages/FAQPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

/* Spinner shown while auth state is resolving */
function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
        background: "var(--color-bg)",
      }}
    >
      <div className="sf-spinner" style={{ width: "28px", height: "28px", borderWidth: "3px" }} />
      <p style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-text-tertiary)", fontWeight: 600, fontFamily: "var(--font-heading)" }}>
        Loading…
      </p>
    </div>
  );
}

/* Guards a route — redirects to /login when unauthenticated */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

/* Guards a route by role — redirects home if user lacks the required role */
function RoleRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

/* Guards a public-only route (login/register) — redirects home when already logged in */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

/* Auth layout — full screen, no navbar */
function AuthLayout() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
    </Routes>
  );
}

/* App layout — sticky navbar + scrollable content area */
function AppLayout() {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="page-inner page-enter" key={location.pathname}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:userId"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <RoleRoute roles={["admin"]}>
                  <AdminDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/moderator"
              element={
                <RoleRoute roles={["moderator", "admin"]}>
                  <ModeratorDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/jobs/:language"
              element={
                <ProtectedRoute>
                  <LanguageJobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:language/:jobId"
              element={
                <ProtectedRoute>
                  <JobSolvePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jobs/new"
              element={
                <RoleRoute roles={["admin", "moderator"]}>
                  <JobForm />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/jobs/:id/edit"
              element={
                <RoleRoute roles={["admin", "moderator"]}>
                  <JobForm />
                </RoleRoute>
              }
            />
            <Route
              path="/faq"
              element={
                <ProtectedRoute>
                  <FAQPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stack-trace"
              element={
                <ProtectedRoute>
                  <StackTracePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stack-trace/challenge/:challengeId"
              element={
                <ProtectedRoute>
                  <StackTraceChallengePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-suite"
              element={
                <ProtectedRoute>
                  <TestSuitePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-suite/run"
              element={
                <ProtectedRoute>
                  <TestSuitePlayPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </>
  );
}

function Router() {
  const location = useLocation();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/register";

  return isAuthRoute ? <AuthLayout /> : <AppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
