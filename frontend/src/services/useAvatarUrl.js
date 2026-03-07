import { authFetch } from './authService';

/**
 * Fetch the user's avatar and return a local object URL for rendering.
 * The token parameter is kept for backward-compatibility but is no longer
 * used — the JWT cookie is sent automatically via authFetch.
 */
export async function getAvatarUrl(userId, _token, apiBase) {
  if (!userId || !apiBase) return null;
  try {
    const res = await authFetch(`${apiBase}/users/${userId}/avatar`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
