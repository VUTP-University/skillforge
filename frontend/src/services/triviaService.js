import axios from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true });

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
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

export const getTriviaStatus  = ()                    => api.get("/trivia/status").then(r => r.data);
export const startTrivia      = (language)            => api.post("/trivia/start", { language }).then(r => r.data);
export const submitTrivia     = (sessionId, answers)  => api.post(`/trivia/${sessionId}/submit`, { answers }).then(r => r.data);
