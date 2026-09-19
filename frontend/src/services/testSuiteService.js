import api from "./api";

export const getTestSuiteStatus = ()                => api.get("/test-suite/status").then(r => r.data);
export const startRun           = (language)        => api.post("/test-suite/start", { language }).then(r => r.data);
export const submitRun          = (runId, answers)  => api.post(`/test-suite/${runId}/submit`, { answers }).then(r => r.data);
