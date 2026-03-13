import { authFetch } from './authService';

const UNDERWORLD_API = import.meta.env.VITE_UNDERWORLD_SERVICE_URL;

export async function getAllBosses() {
  const res = await authFetch(`${UNDERWORLD_API}/bosses`);
  if (!res.ok) throw new Error('Failed to fetch bosses');
  return res.json();
}

export async function getBossById(bossId) {
  const res = await authFetch(`${UNDERWORLD_API}/bosses/${bossId}`);
  if (!res.ok) throw new Error('Failed to fetch boss');
  return res.json();
}

export async function generateChallenge(bossId) {
  const res = await authFetch(`${UNDERWORLD_API}/bosses/${bossId}/challenge`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to generate challenge');
  const data = await res.json();
  // Return the challenge text directly, handling both { challenge: "..." } and plain string
  return data?.challenge ?? data;
}
