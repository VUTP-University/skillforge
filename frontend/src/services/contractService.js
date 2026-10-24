import api from "./api";

export const getContracts       = (params = {})          => api.get("/contracts/", { params }).then(r => r.data);
export const getContractTopics  = ()                     => api.get("/contracts/topics").then(r => r.data);
export const getContract        = (id)                   => api.get(`/contracts/${id}`).then(r => r.data);
export const createContract     = (data)                 => api.post("/contracts/", data).then(r => r.data);
export const updateContract     = (id, data)             => api.put(`/contracts/${id}`, data).then(r => r.data);
export const deleteContract     = (id)                   => api.delete(`/contracts/${id}`).then(r => r.data);
export const verifyContract     = (data)                 => api.post("/contracts/verify", data).then(r => r.data);
export const runContract        = (id, code)             => api.post(`/contracts/${id}/run`, { code }).then(r => r.data);
export const submitContract     = (id, code)             => api.post(`/contracts/${id}/submit`, { code }).then(r => r.data);

export const getContractComments   = (id)                => api.get(`/contracts/${id}/comments`).then(r => r.data);
export const addContractComment    = (id, content)       => api.post(`/contracts/${id}/comments`, { content }).then(r => r.data);
export const deleteContractComment = (id, commentId)     => api.delete(`/contracts/${id}/comments/${commentId}`).then(r => r.data);
