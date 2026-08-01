import axios from "axios";

const api = axios.create({ withCredentials: true });

export const createReport = (jobId, reason) =>
  api.post("/api/reports/", { job_id: jobId, reason }).then((r) => r.data);

export const getReports = (status) =>
  api.get("/api/reports/", { params: status ? { status } : {} }).then((r) => r.data);

export const updateReport = (reportId, patch) =>
  api.patch(`/api/reports/${reportId}`, patch).then((r) => r.data);
