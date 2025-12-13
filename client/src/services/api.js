import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('userInfo');
            delete api.defaults.headers.common['Authorization'];
            // Optionally redirect to login or show auth modal
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export default api;

// ============================================
// PAGINATED API CALLS
// ============================================

/**
 * Fetch flashcards with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.type - Filter by type
 * @param {string} options.deck - Filter by deck ID
 * @param {string[]} options.tags - Filter by tags
 * @param {string} options.search - Search query
 * @param {string} options.sort - Sort order (newest/oldest)
 * @param {boolean} options.paginate - Enable pagination (default: true)
 */
export const fetchFlashcardsPaginated = async (options = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.type && options.type !== 'All') params.append('type', options.type);
    if (options.deck && options.deck !== 'All') params.append('deck', options.deck);
    if (options.tags && options.tags.length > 0) params.append('tags', options.tags.join(','));
    if (options.search) params.append('search', options.search);
    if (options.sort) params.append('sort', options.sort);
    if (options.paginate !== undefined) params.append('paginate', options.paginate.toString());
    
    const response = await api.get(`/flashcards?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Fetch flashcards paginated error:', error);
    throw error;
  }
};

/**
 * Fetch all flashcards without pagination (for backward compatibility)
 */
export const fetchAllFlashcards = async () => {
  try {
    const response = await api.get('/flashcards?paginate=false');
    return response.data;
  } catch (error) {
    console.error('Fetch all flashcards error:', error);
    throw error;
  }
};

/**
 * Fetch decks with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.type - Filter by type
 * @param {string} options.search - Search query
 * @param {string} options.sort - Sort order (name/newest/oldest)
 * @param {boolean} options.paginate - Enable pagination (default: true)
 */
export const fetchDecksPaginated = async (options = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.type && options.type !== 'All') params.append('type', options.type);
    if (options.search) params.append('search', options.search);
    if (options.sort) params.append('sort', options.sort);
    if (options.paginate !== undefined) params.append('paginate', options.paginate.toString());
    
    const response = await api.get(`/decks?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Fetch decks paginated error:', error);
    throw error;
  }
};

/**
 * Fetch all decks without pagination (for backward compatibility)
 */
export const fetchAllDecks = async () => {
  try {
    const response = await api.get('/decks?paginate=false');
    return response.data;
  } catch (error) {
    console.error('Fetch all decks error:', error);
    throw error;
  }
};

/**
 * Check API health
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};

// ============================================
// DICTIONARY API
// ============================================

// Merriam-Webster Dictionary API integration - now calls backend for security
export const fetchDictionaryWord = async (word) => {
  try {
    const response = await api.get(`/dictionary?word=${encodeURIComponent(word)}`);
    return response.data;
  } catch (error) {
    console.error('Dictionary API error:', error);
    throw new Error(`Failed to fetch word definition: ${error.response?.data?.error || error.message}`);
  }
};

export const createFlashcard = async (flashcardData) => {
  const response = await api.post('/flashcards', flashcardData);
  return response.data;
};

export const updateFlashcard = async (id, flashcardData) => {
  const response = await api.put(`/flashcards/${id}`, flashcardData);
  return response.data;
};

export const updateRecentDecks = async (deckId) => {
  try {
    const response = await api.post('/users/recent-deck', { deckId });
    return response.data;
  } catch (error) {
    console.error('Update recent decks error:', error);
    throw error;
  }
};

// Folder API calls
export const fetchFolders = async (searchQuery = '') => {
  try {
    const url = searchQuery ? `/folders?search=${encodeURIComponent(searchQuery)}` : '/folders';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Fetch folders error:', error);
    throw error;
  }
};

export const fetchFolderById = async (id) => {
  try {
    const response = await api.get(`/folders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Fetch folder by ID error:', error);
    throw error;
  }
};

export const createFolder = async (folderData) => {
  try {
    const response = await api.post('/folders', folderData);
    return response.data;
  } catch (error) {
    console.error('Create folder error:', error);
    throw error;
  }
};

export const updateFolder = async (id, folderData) => {
  try {
    const response = await api.put(`/folders/${id}`, folderData);
    return response.data;
  } catch (error) {
    console.error('Update folder error:', error);
    throw error;
  }
};

export const deleteFolder = async (id) => {
  try {
    const response = await api.delete(`/folders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete folder error:', error);
    throw error;
  }
};

export const addDeckToFolder = async (folderId, deckId) => {
  try {
    const response = await api.post(`/folders/${folderId}/decks`, { deckId });
    return response.data;
  } catch (error) {
    console.error('Add deck to folder error:', error);
    throw error;
  }
};

export const removeDeckFromFolder = async (folderId, deckId) => {
  try {
    const response = await api.delete(`/folders/${folderId}/decks/${deckId}`);
    return response.data;
  } catch (error) {
    console.error('Remove deck from folder error:', error);
    throw error;
  }
};

export const getFoldersContainingDeck = async (deckId) => {
  try {
    const response = await api.get(`/folders/deck/${deckId}`);
    return response.data;
  } catch (error) {
    console.error('Get folders containing deck error:', error);
    throw error;
  }
};

// Deck export API call
export const exportDeckToMarkdown = async (deckId) => {
  try {
    const response = await api.get(`/decks/${deckId}/export`);
    return response.data;
  } catch (error) {
    console.error('Export deck error:', error);
    throw error;
  }
};

// EOD Revision API call
export const getFlashcardsCreatedOnDate = async (date) => {
  try {
    const response = await api.get(`/flashcards/created-on-date?date=${date}`);
    return response.data;
  } catch (error) {
    console.error('Get flashcards by date error:', error);
    throw error;
  }
};