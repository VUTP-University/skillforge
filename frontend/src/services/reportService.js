import api from "./api";

export const createReport = (jobId, reason) =>
  api.post("/reports/", { job_id: jobId, reason }).then((r) => r.data);

export const getReports = (status) =>
  api.get("/reports/", { params: status ? { status } : {} }).then((r) => r.data);

export const updateReport = (reportId, patch) =>
  api.patch(`/reports/${reportId}`, patch).then((r) => r.data);
