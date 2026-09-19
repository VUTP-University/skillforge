import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Refresh-and-retry on 401 — skip auth endpoints to avoid infinite loops
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const url = err.config?.url ?? "";
    const isAuthEndpoint = url.startsWith("/auth/");
    if (err.response?.status === 401 && !err.config._retry && !isAuthEndpoint) {
      err.config._retry = true;
      try {
        await axios.post("/api/auth/refresh", {}, { withCredentials: true });
        return api(err.config);
      } catch {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export async function register(username, email, password) {
  const { data } = await api.post("/auth/register", { username, email, password });
  return data.user;
}

export async function login(identifier, password) {
  const { data } = await api.post("/auth/login", { identifier, password });
  return data.user;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.patch("/auth/password", { token, password });
  return data;
}

export async function authFetch(url, options = {}) {
  const { data } = await api.request({ url, ...options });
  return data;
}
