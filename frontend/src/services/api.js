import axios from "axios";

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const api = axios.create({ baseURL: "/api", withCredentials: true });

// Flask-JWT-Extended's double-submit CSRF check (enabled in production) requires
// every state-changing request to echo back the value of a readable CSRF
// cookie in a header. /auth/refresh is authenticated by the refresh token, so
// it checks the refresh cookie's CSRF value; every other mutation is
// authenticated by the access token and checks that one instead.
api.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (!["get", "head", "options"].includes(method)) {
    const isRefresh  = (config.url || "").endsWith("/auth/refresh");
    const csrfCookie = isRefresh ? "csrf_refresh_token" : "csrf_access_token";
    const csrfToken  = getCookie(csrfCookie);
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers["X-CSRF-TOKEN"] = csrfToken;
    }
  }
  return config;
});

// When the access token expires (15 min), silently refresh it and retry once.
// Auth endpoints are excluded to avoid retry loops on a failed login/refresh.
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const url = err.config?.url ?? "";
    const isAuthEndpoint = url.startsWith("/auth/");
    if (err.response?.status === 401 && !err.config._retry && !isAuthEndpoint) {
      err.config._retry = true;
      try {
        await api.post("/auth/refresh");
        return api(err.config);
      } catch {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const getHealth = () => api.get("/health");

export const getUsers = () => api.get("/users/");
export const getUser = (id) => api.get(`/users/${id}`);
