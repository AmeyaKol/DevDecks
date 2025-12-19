/**
 * Session Manager Utility
 * Manages session-based flags using sessionStorage
 * Used for showing landing page on first visit of each browser session
 */

const SESSION_KEY = 'devdecks_visited';

/**
 * Check if user has visited this session
 * @returns {boolean} - True if user has already visited, false otherwise
 */
export const hasVisitedThisSession = () => {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
};

/**
 * Mark the current session as visited
 * Called when user navigates away from landing page
 */
export const markSessionVisited = () => {
  sessionStorage.setItem(SESSION_KEY, 'true');
};

/**
 * Clear the session flag (for testing purposes)
 */
export const clearSessionFlag = () => {
  sessionStorage.removeItem(SESSION_KEY);
};



