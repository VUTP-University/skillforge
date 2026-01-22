import { checkValidToken } from "./authService";

const QUESTS_API = import.meta.env.VITE_QUESTS_SERVICE_URL;

// Get all quests from the Quests Service
export const getAllQuests = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${QUESTS_API}/quests`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  const isTokenValid = await checkValidToken(res.status);

  if (isTokenValid && res.ok) {
    const data = await res.json();
    return data;
  } else {
    throw new Error(data.message || "Failed to fetch quests");
  }
};

// Get all quests by language from the Quests Service
export const getQuestsByLanguage = async (language) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${QUESTS_API}/quests/${language}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  const isTokenValid = await checkValidToken(res.status);

  if (isTokenValid && res.ok) {
    const data = await res.json();
    return data;
  } else {
    throw new Error(data.message || "Failed to fetch quests");
  }
};

// Get a single quest by ID from the Quests Service
export const getQuestById = async (questId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${QUESTS_API}/quest/${questId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  const isTokenValid = await checkValidToken(res.status);

  if (isTokenValid && res.ok) {
    const data = await res.json();
    return data;
  } else {
    throw new Error(data.message || "Failed to fetch quest");
  }
};


// Get a single quest by ID from the Quests Service for Edit Quest Page in Admin Dashboard
export const editQuestById = async (questId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${QUESTS_API}/edit_quest/${questId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  const isTokenValid = await checkValidToken(res.status);

  if (isTokenValid && res.ok) {
    const data = await res.json();
    return data;
  } else {
    throw new Error(data.message || "Failed to fetch quest");
  }
};

// Get all solutions for a user
export const getSolvedQuestsByUserId = async (userId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${QUESTS_API}/solutions/${userId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  const isTokenValid = await checkValidToken(res.status);

  if (isTokenValid && res.ok) {
    const data = await res.json();
    return data;
  } else {
    throw new Error(data.message || "Failed to fetch solved quests");
  }
};

// Get all correct solutions for a user
export const getCorrectSolutionsByUserId = async (userId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${QUESTS_API}/correct_solutions/${userId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  const isTokenValid = await checkValidToken(res.status);

  if (isTokenValid && res.ok) {
    const data = await res.json();
    return data;
  } else {
    throw new Error(data.message || "Failed to fetch correct solutions");
  }
};