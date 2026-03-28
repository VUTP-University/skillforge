import { authFetch } from './authService';

const QUEST_API = import.meta.env.VITE_QUESTS_SERVICE_URL;

export async function getAllQuests() {
  const res = await authFetch(`${QUEST_API}/quests`);
  if (!res.ok) throw new Error('Failed to fetch quests');
  return res.json();
}

export async function getQuestsByLanguage(language) {
  const res = await authFetch(`${QUEST_API}/quests?language=${encodeURIComponent(language)}`);
  if (!res.ok) throw new Error('Failed to fetch quests');
  return res.json();
}

export async function getQuestById(questId) {
  const res = await authFetch(`${QUEST_API}/quests/${questId}`);
  if (!res.ok) throw new Error('Failed to fetch quest');
  return res.json();
}

/** Alias used by the admin edit flow — fetches a quest by ID for editing. */
export async function editQuestById(questId) {
  const res = await authFetch(`${QUEST_API}/quests/${questId}`);
  if (!res.ok) throw new Error('Failed to fetch quest');
  return res.json();
}

export async function getCorrectSolutionsByUserId(userId) {
  if (!userId) return [];
  const res = await authFetch(`${QUEST_API}/solutions/${userId}`);
  if (!res.ok) return [];
  return res.json();
}
