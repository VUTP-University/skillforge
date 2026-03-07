const API_BASE = '/api';

/**
 * Read the CSRF token for the access token from the non-HttpOnly cookie
 * set by flask-jwt-extended. Required on state-changing requests that use
 * @jwt_required() on the backend.
 */
function getCsrfToken() {
  const match = document.cookie.match(/csrf_access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Read the CSRF token for the refresh token from the non-HttpOnly cookie.
 * Required when calling the /api/refresh endpoint.
 */
function getCsrfRefreshToken() {
  const match = document.cookie.match(/csrf_refresh_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Log in with email/username + password.
 * The backend sets HttpOnly access_token_cookie and refresh_token_cookie.
 * Returns the user object from the response body.
 */
export async function login(credentials) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      // Support both "email" (from the login form field) and "identifier"
      identifier: credentials.identifier ?? credentials.email,
      password: credentials.password,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.msg || 'Login failed');
  }
  return data; // { msg, user: { id, username, email } }
}

/**
 * Register a new account.
 * Returns { success: true } or { success: false, message }.
 */
export async function signup(formData) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { success: false, message: data.error || data.msg || 'Signup failed' };
  }
  return { success: true };
}

/**
 * Log out. Asks the backend to clear the JWT cookies.
 */
export async function logout() {
  await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
}

/**
 * Fetch the currently authenticated user from the backend.
 * Returns the user object or null if not authenticated.
 */
export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/me`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json(); // { id, username, email }
}

/**
 * Use the refresh token cookie to get a new access token cookie.
 * Returns true if the refresh succeeded, false otherwise.
 */
export async function refreshToken() {
  const csrfRefresh = getCsrfRefreshToken();
  const res = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfRefresh && { 'X-CSRF-TOKEN': csrfRefresh }),
    },
    credentials: 'include',
  });
  return res.ok;
}

/**
 * Helper for protected fetch calls: if the response is 401 try to refresh
 * and redirect to login if that also fails.
 * Returns true if the caller may proceed, false if the user was redirected.
 */
export async function checkValidToken(status) {
  if (status === 401) {
    const refreshed = await refreshToken();
    if (!refreshed) {
      window.location.href = '/';
      return false;
    }
  }
  return true;
}

/**
 * Convenience wrapper for authenticated fetch calls.
 * Automatically includes credentials and the CSRF token header for
 * state-changing methods (POST, PUT, PATCH, DELETE).
 */
export function authFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const csrfToken = needsCsrf ? getCsrfToken() : null;

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
      ...options.headers,
    },
  });
}
