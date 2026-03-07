import { authFetch } from './authService';

const USER_API = import.meta.env.VITE_USERS_SERVICE_URL;

export async function getUserById(userId) {
  const res = await authFetch(`${USER_API}/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function getAvatarUrl(userId) {
  const res = await authFetch(`${USER_API}/users/${userId}/avatar`);
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function updateUser(userId, formData) {
  const res = await authFetch(`${USER_API}/update_user/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(formData),
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}
