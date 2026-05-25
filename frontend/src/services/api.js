import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getHealth = () => api.get("/health");

export const getUsers = () => api.get("/users/");
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post("/users/", data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
