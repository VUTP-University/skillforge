import api from "./api";

export const getAdminUsers        = (params = {})    => api.get("/admin/users", { params }).then(r => r.data);
export const updateUserRole       = (id, role)        => api.patch(`/admin/users/${id}/role`, { role }).then(r => r.data);
export const deleteAdminUser      = (id)              => api.delete(`/admin/users/${id}`).then(r => r.data);
export const banUser              = (id, reason)      => api.patch(`/admin/users/${id}/ban`, { banned: true, reason }).then(r => r.data);
export const unbanUser            = (id)              => api.patch(`/admin/users/${id}/ban`, { banned: false }).then(r => r.data);
export const getAdminSubmissions  = (params)          => api.get("/admin/submissions", { params }).then(r => r.data);
export const getAdminSubmission   = (id)              => api.get(`/admin/submissions/${id}`).then(r => r.data);
