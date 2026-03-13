import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, logout as logoutService } from '../services/authService';

const AuthContext = createContext(null);

/**
 * Wrap your app with <AuthProvider> to make auth state available everywhere.
 *
 * On mount it calls GET /api/me using the existing HttpOnly JWT cookie.
 * If the cookie is valid the user is set; otherwise the user stays null
 * (i.e. the person is not logged in).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUser(u))
      .finally(() => setLoading(false));
  }, []);

  /** Call this after a successful login to store the user in context. */
  const login = (userData) => setUser(userData);

  /** Clears the server-side cookies and resets local state. */
  const logout = async () => {
    await logoutService();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Access auth state from any component. */
export function useAuth() {
  return useContext(AuthContext);
}
