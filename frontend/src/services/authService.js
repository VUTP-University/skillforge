import api from "./api";

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

export async function authFetch(url, options = {}) {
  const { data } = await api.request({ url, ...options });
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.patch("/auth/password", { token, password });
  return data;
}
