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

export const getJobs        = (params = {})         => api.get("/jobs/", { params }).then(r => r.data);
export const getJobStats    = (params = {})         => api.get("/jobs/stats", { params }).then(r => r.data);
export const getJob         = (id)                   => api.get(`/jobs/${id}`).then(r => r.data);
export const createJob      = (data)                 => api.post("/jobs/", data).then(r => r.data);
export const generateJobWithAI = (data)              => api.post("/jobs/ai-generate", data).then(r => r.data);
export const updateJob      = (id, data)             => api.put(`/jobs/${id}`, data).then(r => r.data);
export const deleteJob      = (id)                   => api.delete(`/jobs/${id}`).then(r => r.data);
export const submitJob      = (id, code)             => api.post(`/jobs/${id}/submit`, { code }).then(r => r.data);

export const getComments    = (jobId)                => api.get(`/jobs/${jobId}/comments`).then(r => r.data);
export const addComment     = (jobId, content)       => api.post(`/jobs/${jobId}/comments`, { content }).then(r => r.data);
export const deleteComment  = (jobId, commentId)     => api.delete(`/jobs/${jobId}/comments/${commentId}`).then(r => r.data);
