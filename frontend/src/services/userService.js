import axios from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true });

export const getAdminUsers   = ()            => api.get("/admin/users").then(r => r.data);
export const updateUserRole  = (id, role)    => api.patch(`/admin/users/${id}/role`, { role }).then(r => r.data);
export const deleteAdminUser = (id)          => api.delete(`/admin/users/${id}`).then(r => r.data);
