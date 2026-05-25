import axios from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true });

export const getQuests  = (params = {}) => api.get("/quests/", { params }).then(r => r.data);
export const getQuest   = (id)           => api.get(`/quests/${id}`).then(r => r.data);
export const createQuest = (data)        => api.post("/quests/", data).then(r => r.data);
export const updateQuest = (id, data)    => api.put(`/quests/${id}`, data).then(r => r.data);
export const deleteQuest = (id)          => api.delete(`/quests/${id}`).then(r => r.data);
