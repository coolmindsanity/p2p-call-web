const USER_ID_KEY = 'p2p-user-id';

/**
 * A simple RFC4122 version 4 compliant UUID generator.
 * This is used to create a unique anonymous ID for each user without
 * requiring external dependencies.
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Retrieves the unique user ID from localStorage. If it doesn't exist,
 * it generates a new one, saves it, and then returns it.
 * This ensures the user has a persistent identity across sessions.
 * @returns {string} The user's unique ID.
 */
export const getUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};
