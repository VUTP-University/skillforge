import axios from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true });

// When the access token expires (15 min), silently refresh it and retry once.
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

export const getQuests   = (params = {}) => api.get("/quests/", { params }).then(r => r.data);
export const getQuest    = (id)          => api.get(`/quests/${id}`).then(r => r.data);
export const createQuest = (data)        => api.post("/quests/", data).then(r => r.data);
export const updateQuest = (id, data)    => api.put(`/quests/${id}`, data).then(r => r.data);
export const deleteQuest = (id)          => api.delete(`/quests/${id}`).then(r => r.data);
export const submitQuest = (id, code)    => api.post(`/quests/${id}/submit`, { code }).then(r => r.data);
