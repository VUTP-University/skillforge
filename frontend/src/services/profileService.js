import api from "./api";

export const getMyProfile       = ()                        => api.get("/profile/me").then(r => r.data);
export const getProfile         = (userId)                  => api.get(`/profile/${userId}`).then(r => r.data);
export const updateEmail        = (email)                   => api.patch("/profile/me/email", { email }).then(r => r.data);
export const deleteAvatar       = ()                        => api.delete("/profile/me/avatar").then(r => r.data);
export const getMySubmissions    = (page = 1, perPage = 20, filters = {})          => api.get("/profile/me/submissions", { params: { page, per_page: perPage, ...filters } }).then(r => r.data);
export const getSubmissionDetail = (id)                              => api.get(`/profile/me/submissions/${id}`).then(r => r.data);
export const getUserSubmissions  = (userId, page = 1, perPage = 20, filters = {}) => api.get(`/profile/${userId}/submissions`, { params: { page, per_page: perPage, ...filters } }).then(r => r.data);

export function uploadAvatar(file) {
  const form = new FormData();
  form.append("file", file);
  return api.post("/profile/me/avatar", form).then(r => r.data);
}
