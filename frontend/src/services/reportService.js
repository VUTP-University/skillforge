import axios from "axios";

const api = axios.create({ withCredentials: true });

export const createReport = (questId, reason) =>
  api.post("/api/reports/", { quest_id: questId, reason }).then((r) => r.data);

export const getReports = (status) =>
  api.get("/api/reports/", { params: status ? { status } : {} }).then((r) => r.data);

export const updateReport = (reportId, patch) =>
  api.patch(`/api/reports/${reportId}`, patch).then((r) => r.data);
