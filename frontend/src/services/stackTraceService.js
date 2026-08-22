import api from "./api";

export const getProcesses = () =>
  api.get("/stack-trace/processes").then((r) => r.data);

export const startChallenge = (processId) =>
  api.post(`/stack-trace/processes/${processId}/challenge`).then((r) => r.data);

export const getChallenge = (challengeId) =>
  api.get(`/stack-trace/challenges/${challengeId}`).then((r) => r.data);

export const submitChallenge = (challengeId, solution) =>
  api
    .post(`/stack-trace/challenges/${challengeId}/submit`, { solution })
    .then((r) => r.data);

export const failChallenge = (challengeId) =>
  api.post(`/stack-trace/challenges/${challengeId}/fail`).then((r) => r.data);

/**
 * Send a fire-and-forget fail beacon using the Beacon API.
 * Used in the beforeunload handler so the request survives page unload.
 */
export function failChallengeBeacon(challengeId) {
  const url  = `/api/stack-trace/challenges/${challengeId}/fail`;
  const blob = new Blob([JSON.stringify({})], { type: "application/json" });
  navigator.sendBeacon(url, blob);
}
