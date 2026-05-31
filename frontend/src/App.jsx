import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Users from "./pages/Users";
import AdminDashboard from "./pages/AdminDashboard";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import QuestForm from "./pages/QuestForm";
import LanguageQuestsPage from "./pages/LanguageQuestsPage";
import QuestSolvePage from "./pages/QuestSolvePage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import UnderworldPage from "./pages/UnderworldPage";
import UnderworldChallengePage from "./pages/UnderworldChallengePage";
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
      <p style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
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
  return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="page-inner">
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
              path="/quests/:language"
              element={
                <ProtectedRoute>
                  <LanguageQuestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quests/:language/:questId"
              element={
                <ProtectedRoute>
                  <QuestSolvePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quests/new"
              element={
                <RoleRoute roles={["admin", "moderator"]}>
                  <QuestForm />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/quests/:id/edit"
              element={
                <RoleRoute roles={["admin", "moderator"]}>
                  <QuestForm />
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
              path="/underworld"
              element={
                <ProtectedRoute>
                  <UnderworldPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/underworld/challenge/:challengeId"
              element={
                <ProtectedRoute>
                  <UnderworldChallengePage />
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
