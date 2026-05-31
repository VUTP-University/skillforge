import api from "./api";

export const getBosses = () =>
  api.get("/underworld/bosses").then((r) => r.data);

export const startChallenge = (bossId) =>
  api.post(`/underworld/bosses/${bossId}/challenge`).then((r) => r.data);

export const getChallenge = (challengeId) =>
  api.get(`/underworld/challenges/${challengeId}`).then((r) => r.data);

export const submitChallenge = (challengeId, solution) =>
  api
    .post(`/underworld/challenges/${challengeId}/submit`, { solution })
    .then((r) => r.data);

export const failChallenge = (challengeId) =>
  api.post(`/underworld/challenges/${challengeId}/fail`).then((r) => r.data);

/**
 * Send a fire-and-forget fail beacon using the Beacon API.
 * Used in the beforeunload handler so the request survives page unload.
 */
export function failChallengeBeacon(challengeId) {
  const url  = `/api/underworld/challenges/${challengeId}/fail`;
  const blob = new Blob([JSON.stringify({})], { type: "application/json" });
  navigator.sendBeacon(url, blob);
}
