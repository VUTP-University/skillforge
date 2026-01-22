import { checkValidToken } from "./authService";

const UNDERWORLD_API_URL = import.meta.env.VITE_UNDERWORLD_SERVICE_URL;

// Get all boses from the Underworld Service
export const getAllBosses = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${UNDERWORLD_API_URL}/bosses`, {
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
    throw new Error(data.message || "Failed to fetch bosses");
  }
};

// Get a single boss by ID from the Underworld Service
export const getBossById = async (bossId) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${UNDERWORLD_API_URL}/bosses/${bossId}`, {
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
    throw new Error(data.message || "Failed to fetch boss");
  }
};

// Create a new boss in the Underworld Service (as Admin)
export const createBoss = async (formData) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${UNDERWORLD_API_URL}/bosses`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  const isTokenValid = await checkValidToken(res.status);

  if (isTokenValid && res.ok) {
    const data = await res.json();
    return data;
  } else {
    throw new Error(data.message || "Failed to create boss");
  }
};

// Generate new Underworld Challenge
export const generateChallenge = async (bossId, challengeData) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${UNDERWORLD_API_URL}/bosses/${bossId}/challenge`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(challengeData),
  });

  const isTokenValid = await checkValidToken(res.status);

  if (isTokenValid && res.ok) {
    const data = await res.json();
    return data;
  } else {
    throw new Error(data.message || "Failed to generate challenge");
  }
};