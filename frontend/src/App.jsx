import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/Profilepage";
import LanguageQuestsPage from "./pages/LanguageQuestsPage";
import QuestPage from "./pages/QuestPage";
import AdminPanel from "./pages/AdminPanel";
import EditQuestPage from "./components/Admin/EditQuestPage";
import UnderworldPage from "./pages/Underworld/Underworld";
import BossChallengePage from "./pages/Underworld/BossChallenge";
import LoadingSpinner from "./components/Layout/LoadingSpinner";

/**
 * Redirect to login if the user is not authenticated.
 * Shows a spinner while the auth state is being resolved on first load.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

/**
 * Redirect to dashboard if the user is already authenticated.
 * Prevents authenticated users from seeing the login/signup pages.
 * Shows a spinner while auth state is resolving to avoid a flash of the form.
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes — redirect to dashboard if already authenticated */}
          <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/quests/:language" element={<ProtectedRoute><LanguageQuestsPage /></ProtectedRoute>} />
          <Route path="/quest/:questId" element={<ProtectedRoute><QuestPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/edit_quest/:questId" element={<ProtectedRoute><EditQuestPage /></ProtectedRoute>} />
          <Route path="/underworld" element={<ProtectedRoute><UnderworldPage /></ProtectedRoute>} />
          <Route path="/underworld/challenge/:bossId" element={<ProtectedRoute><BossChallengePage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
