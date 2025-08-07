/**
 * Utility functions for handling GRE mode detection and navigation
 */

/**
 * Check if the current URL is in GRE mode
 * @param {string} pathname - The current pathname from useLocation or window.location
 * @returns {boolean} - True if in GRE mode, false otherwise
 */
export const isGREMode = (pathname) => {
  return pathname.startsWith('/gre');
};

/**
 * Get the appropriate base path based on current mode
 * @param {string} pathname - The current pathname
 * @returns {string} - Either '/gre' or ''
 */
export const getBasePath = (pathname) => {
  return isGREMode(pathname) ? '/gre' : '';
};

/**
 * Convert a regular route to GRE mode route or vice versa
 * @param {string} route - The route to convert (e.g., '/home', '/test')
 * @param {boolean} toGREMode - Whether to convert to GRE mode
 * @returns {string} - The converted route
 */
export const convertRoute = (route, toGREMode) => {
  if (toGREMode) {
    // Convert to GRE mode
    if (route === '/') return '/gre';
    return `/gre${route}`;
  } else {
    // Convert from GRE mode to regular mode
    if (route.startsWith('/gre')) {
      const withoutGre = route.substring(4); // Remove '/gre'
      return withoutGre === '' ? '/' : withoutGre;
    }
    return route;
  }
};

/**
 * Get the appropriate navigation links based on current mode
 * @param {string} pathname - The current pathname
 * @returns {object} - Object containing navigation links
 */
export const getNavigationLinks = (pathname) => {
  const basePath = getBasePath(pathname);
  
  return {
    home: `${basePath}/home`,
    test: `${basePath}/test`,
    problemList: `${basePath}/problem-list`,
    profile: `${basePath}/profile`,
    about: `${basePath}/about`,
    changelog: `${basePath}/changelog`,
    deckView: `${basePath}/deckView`,
    study: `${basePath}/study`,
    testing: `${basePath}/testing`
  };
};

/**
 * Filter card/deck types based on current mode
 * @param {Array} items - Array of cards or decks
 * @param {boolean} greMode - Whether in GRE mode
 * @returns {Array} - Filtered items
 */
export const filterByMode = (items, greMode) => {
  if (!items) return [];
  
  return items.filter(item => {
    const type = item.type;
    const isGREType = type === 'GRE-Word' || type === 'GRE-MCQ';
    
    if (greMode) {
      // In GRE mode: only show GRE types
      return isGREType;
    } else {
      // In regular mode: exclude GRE types
      return !isGREType;
    }
  });
};

/**
 * Get available flashcard types based on current mode
 * @param {boolean} greMode - Whether in GRE mode
 * @returns {Array} - Array of available types
 */
export const getAvailableTypes = (greMode) => {
  if (greMode) {
    return ["All", "GRE-MCQ", "GRE-Word"];
  } else {
    return ["All", "DSA", "System Design", "Behavioral", "Technical Knowledge", "Other"];
  }
};

/**
 * Get the appropriate test section based on current mode
 * @param {string} pathname - The current pathname
 * @returns {string} - The test section ('gre' or 'technical')
 */
export const getTestSection = (pathname) => {
  return isGREMode(pathname) ? 'gre' : 'technical';
}; 