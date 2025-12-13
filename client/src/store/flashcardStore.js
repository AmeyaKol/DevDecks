// client/src/store/flashcardStore.js
import { create } from 'zustand';
import api, { 
    fetchFlashcardsPaginated, 
    fetchDecksPaginated,
    fetchFolders as apiFetchFolders,
    createFolder as apiCreateFolder,
    updateFolder as apiUpdateFolder,
    deleteFolder as apiDeleteFolder,
    addDeckToFolder as apiAddDeckToFolder,
    removeDeckFromFolder as apiRemoveDeckFromFolder,
    getFoldersContainingDeck as apiGetFoldersContainingDeck
} from '../services/api';

const getUnique = (arr, comp) => arr.map(e => e[comp])
    .map((e, i, final) => final.indexOf(e) === i && i)
    .filter(e => arr[e]).map(e => arr[e]);

const useFlashcardStore = create((set, get) => ({
    flashcards: [],
    decks: [],
    folders: [],
    allTags: [],
    isLoading: false,
    isLoadingDecks: false,
    isLoadingFolders: false,
    error: null,
    isModalOpen: false,
    modalContent: { title: '', message: '', onConfirm: null, confirmText: 'OK', cancelText: 'Cancel' },
    currentPage: 'cards',

    editingFlashcard: null,
    editingDeck: null,
    editingFolder: null,

    selectedTypeFilter: 'All',
    selectedDeckFilter: 'All',
    selectedTagsFilter: [],
    searchQuery: '', // Add search query state
    showFavoritesOnly: false, // Add favorites filter state
    
    // Pagination state
    currentPageNumber: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
    
    // Deck pagination state
    deckCurrentPage: 1,
    deckTotalItems: 0,
    deckTotalPages: 0,
    deckHasNextPage: false,
    deckHasPrevPage: false,
    
    // View mode state
    viewMode: 'decks', // 'cards', 'decks', or 'folders' - default to decks view
    selectedDeckForView: null, // When viewing cards from a specific deck
    selectedFolderForView: null, // When viewing decks from a specific folder
    
    // Sorting state
    sortOrder: 'newest', // 'newest' or 'oldest'
    
    // Server-side pagination mode toggle
    useServerPagination: true,

    //Deck Actions:
    fetchDecks: async (options = {}) => {
        set({ isLoadingDecks: true });
        try {
            const { useServerPagination } = get();
            
            if (useServerPagination && options.paginate !== false) {
                // Use server-side pagination
                const response = await fetchDecksPaginated({
                    page: options.page || get().deckCurrentPage,
                    limit: options.limit || 50, // Higher limit for decks
                    type: options.type,
                    search: options.search,
                    sort: options.sort || 'name',
                    paginate: 'true'
                });
                
                set({ 
                    decks: response.decks, 
                    deckCurrentPage: response.pagination.currentPage,
                    deckTotalItems: response.pagination.totalItems,
                    deckTotalPages: response.pagination.totalPages,
                    deckHasNextPage: response.pagination.hasNextPage,
                    deckHasPrevPage: response.pagination.hasPrevPage,
                    isLoadingDecks: false 
                });
            } else {
                // Backward compatible: fetch all decks
                const response = await api.get('/decks?paginate=false');
                set({ decks: response.data, isLoadingDecks: false });
            }
        } catch (err) {
            set({ error: err.message || 'Failed to fetch decks', isLoadingDecks: false });
            get().showModal('Error', 'Could not fetch decks.');
        }
    },
    addDeck: async (deckData) => {
        // set({ isLoadingDecks: true }); // Or use a general loading flag
        try {
            const response = await api.post('/decks', deckData);
            set((state) => ({
                decks: [...state.decks, response.data].sort((a, b) => a.name.localeCompare(b.name)),
                // isLoadingDecks: false,
            }));
            get().showToast('Deck created!');
            return response.data;
        } catch (err) {
            // set({ isLoadingDecks: false });
            get().showModal('Error', err.response?.data?.message || 'Could not add deck.');
            throw err;
        }
    },
    updateDeckStore: async (id, updatedDeckData) => {
        try {
            const response = await api.put(`/decks/${id}`, updatedDeckData);
            set((state) => ({
                decks: state.decks.map((d) => (d._id === id ? response.data : d)).sort((a, b) => a.name.localeCompare(b.name)),
                editingDeck: null,
            }));
            get().showToast('Deck updated!');
            return response.data;
        } catch (err) {
            get().showModal('Error', err.response?.data?.message || 'Could not update deck.');
            throw err;
        }
    },
    deleteDeckStore: async (id) => {
        try {
            await api.delete(`/decks/${id}`);
            set((state) => ({
                decks: state.decks.filter((d) => d._id !== id),
                // Also update flashcards locally to remove this deck from their 'decks' array
                flashcards: state.flashcards.map(fc => ({
                    ...fc,
                    decks: fc.decks.filter(deckRef => typeof deckRef === 'string' ? deckRef !== id : deckRef._id !== id)
                }))
            }));
            get().showToast('Deck deleted!');
        } catch (err) {
            get().showModal('Error', err.response?.data?.message || 'Could not delete deck.');
            throw err;
        }
    },
    startEditDeck: (deck) => set({ editingDeck: deck }),
    cancelEditDeck: () => set({ editingDeck: null }),
    confirmDeleteDeck: (id, name) => {
        get().showModal(
            "Confirm Deck Deletion",
            `Are you sure you want to delete the deck: "${name}"? This will remove it from all associated flashcards.`,
            () => get().deleteDeckStore(id),
            "Delete",
            "Cancel"
        );
    },

    // Folder Actions:
    fetchFolders: async () => {
        set({ isLoadingFolders: true });
        try {
            const folders = await apiFetchFolders();
            set({ folders, isLoadingFolders: false });
        } catch (err) {
            set({ error: err.message || 'Failed to fetch folders', isLoadingFolders: false });
            get().showModal('Error', 'Could not fetch folders.');
        }
    },
    
    addFolder: async (folderData) => {
        set({ isLoadingFolders: true });
        try {
            const response = await apiCreateFolder(folderData);
            set((state) => ({
                folders: [...state.folders, response].sort((a, b) => a.name.localeCompare(b.name)),
                isLoadingFolders: false,
            }));
            get().showToast('Folder created!');
            return response;
        } catch (err) {
            set({ error: err.message || 'Failed to add folder', isLoadingFolders: false });
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not add folder.');
            throw err;
        }
    },
    
    updateFolderStore: async (id, updatedData) => {
        set({ isLoadingFolders: true });
        try {
            const response = await apiUpdateFolder(id, updatedData);
            set((state) => ({
                folders: state.folders.map((f) => (f._id === id ? response : f)).sort((a, b) => a.name.localeCompare(b.name)),
                editingFolder: null,
                isLoadingFolders: false,
            }));
            get().showToast('Folder updated!');
            return response;
        } catch (err) {
            set({ error: err.message || 'Failed to update folder', isLoadingFolders: false });
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not update folder.');
            throw err;
        }
    },
    
    deleteFolderStore: async (id) => {
        try {
            await apiDeleteFolder(id);
            set((state) => ({
                folders: state.folders.filter((f) => f._id !== id),
            }));
            get().showToast('Folder deleted!');
        } catch (err) {
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not delete folder.');
        }
    },
    
    startEditFolder: (folder) => set({ editingFolder: folder }),
    cancelEditFolder: () => set({ editingFolder: null }),
    confirmDeleteFolder: (id, name) => {
        get().showModal(
            "Confirm Folder Deletion",
            `Are you sure you want to delete the folder: "${name}"? This will not delete the decks inside.`,
            () => get().deleteFolderStore(id),
            "Delete",
            "Cancel"
        );
    },
    
    addDeckToFolderStore: async (folderId, deckId) => {
        try {
            const response = await apiAddDeckToFolder(folderId, deckId);
            set((state) => ({
                folders: state.folders.map((f) => (f._id === folderId ? response : f)),
            }));
            get().showToast('Deck added to folder!');
            return response;
        } catch (err) {
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not add deck to folder.');
            throw err;
        }
    },
    
    removeDeckFromFolderStore: async (folderId, deckId) => {
        try {
            const response = await apiRemoveDeckFromFolder(folderId, deckId);
            set((state) => ({
                folders: state.folders.map((f) => (f._id === folderId ? response : f)),
            }));
            get().showToast('Deck removed from folder!');
            return response;
        } catch (err) {
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not remove deck from folder.');
            throw err;
        }
    },
    
    getFoldersForDeck: async (deckId) => {
        try {
            const folders = await apiGetFoldersContainingDeck(deckId);
            return folders;
        } catch (err) {
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not fetch folders for deck.');
            return [];
        }
    },
    
    setSelectedFolderForView: (folder) => set({ selectedFolderForView: folder }),

    
    fetchFlashcards: async (options = {}) => {
        set({ isLoading: true, error: null });
        try {
            const { useServerPagination } = get();
            
            if (useServerPagination && options.paginate !== false) {
                // Use server-side pagination
                const response = await fetchFlashcardsPaginated({
                    page: options.page || get().currentPageNumber,
                    limit: options.limit || get().itemsPerPage,
                    type: options.type || get().selectedTypeFilter,
                    deck: options.deck || get().selectedDeckFilter,
                    tags: options.tags || get().selectedTagsFilter,
                    search: options.search || get().searchQuery,
                    sort: options.sort || get().sortOrder,
                    paginate: 'true'
                });
                
                const flashcards = response.flashcards;
                const allTags = response.filters?.availableTags || [];
                
                set({ 
                    flashcards, 
                    allTags,
                    currentPageNumber: response.pagination.currentPage,
                    totalItems: response.pagination.totalItems,
                    totalPages: response.pagination.totalPages,
                    hasNextPage: response.pagination.hasNextPage,
                    hasPrevPage: response.pagination.hasPrevPage,
                    isLoading: false 
                });
            } else {
                // Backward compatible: fetch all flashcards with optional filters
                const params = new URLSearchParams({ paginate: 'false' });
                
                // Add filters if provided
                if (options.deck && options.deck !== 'All') params.append('deck', options.deck);
                if (options.type && options.type !== 'All') params.append('type', options.type);
                if (options.tags && options.tags.length > 0) params.append('tags', options.tags.join(','));
                if (options.search) params.append('search', options.search);
                if (options.sort) params.append('sort', options.sort);
                
                const response = await api.get(`/flashcards?${params.toString()}`);
                const flashcards = response.data;

                // Extract unique tags from all flashcards
                const allTagsSet = new Set();
                flashcards.forEach(card => {
                    if (card.tags && Array.isArray(card.tags)) {
                        card.tags.forEach(tag => allTagsSet.add(tag));
                    }
                });
                const allTags = Array.from(allTagsSet).sort();

                set({ flashcards, allTags, isLoading: false });
            }
        } catch (error) {
            console.error('Error fetching flashcards:', error);
            set({ error: 'Failed to fetch flashcards', isLoading: false });
        }
    },
    
    // Fetch flashcards with specific filters (server-side)
    fetchFlashcardsFiltered: async (filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetchFlashcardsPaginated({
                page: filters.page || 1,
                limit: filters.limit || get().itemsPerPage,
                type: filters.type,
                deck: filters.deck,
                tags: filters.tags,
                search: filters.search,
                sort: filters.sort || 'newest',
                paginate: 'true'
            });
            
            set({ 
                flashcards: response.flashcards, 
                allTags: response.filters?.availableTags || get().allTags,
                currentPageNumber: response.pagination.currentPage,
                totalItems: response.pagination.totalItems,
                totalPages: response.pagination.totalPages,
                hasNextPage: response.pagination.hasNextPage,
                hasPrevPage: response.pagination.hasPrevPage,
                isLoading: false 
            });
            
            return response;
        } catch (error) {
            console.error('Error fetching filtered flashcards:', error);
            set({ error: 'Failed to fetch flashcards', isLoading: false });
            throw error;
        }
    },
    
    // Go to a specific page
    goToPage: async (page) => {
        const { selectedTypeFilter, selectedDeckFilter, selectedTagsFilter, searchQuery, sortOrder, itemsPerPage } = get();
        set({ currentPageNumber: page });
        
        await get().fetchFlashcardsFiltered({
            page,
            limit: itemsPerPage,
            type: selectedTypeFilter,
            deck: selectedDeckFilter,
            tags: selectedTagsFilter,
            search: searchQuery,
            sort: sortOrder
        });
    },
    
    // Go to next page
    nextPage: async () => {
        const { currentPageNumber, hasNextPage } = get();
        if (hasNextPage) {
            await get().goToPage(currentPageNumber + 1);
        }
    },
    
    // Go to previous page
    prevPage: async () => {
        const { currentPageNumber, hasPrevPage } = get();
        if (hasPrevPage) {
            await get().goToPage(currentPageNumber - 1);
        }
    },
    
    // Toggle server pagination mode
    setUseServerPagination: (value) => set({ useServerPagination: value }),
    addFlashcard: async (flashcardData) => { // flashcardData includes type, tags, decks (array of IDs)
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/flashcards', {
                ...flashcardData,
                problemStatement: flashcardData.problemStatement || "",
                language: flashcardData.language || 'python',
            });
            const newCard = { // Process decks similar to fetchFlashcards
                ...response.data,
                decks: response.data.decks ? response.data.decks.map(d => typeof d === 'string' ? { _id: d } : d) : []
            };
            set((state) => ({
                flashcards: [newCard, ...state.flashcards],
                isLoading: false,
            }));
            // Update allTags
            const currentTags = new Set(get().allTags);
            if (newCard.tags) newCard.tags.forEach(tag => currentTags.add(tag));
            set({ allTags: Array.from(currentTags).sort() });
            get().showToast('Flashcard created!');
            return newCard;
        } catch (err) {
            set({ error: err.message || 'Failed to add flashcard', isLoading: false });
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not add flashcard.');
            throw err;
        }
    },
    updateFlashcard: async (id, updatedData) => { // updatedData includes type, tags, decks (array of IDs)
        set({ isLoading: true, error: null });
        try {
            const response = await api.put(`/flashcards/${id}`, {
                ...updatedData,
                problemStatement: updatedData.problemStatement || "",
                language: updatedData.language || 'python',
            });
            const updatedCard = { // Process decks
                ...response.data,
                decks: response.data.decks ? response.data.decks.map(d => typeof d === 'string' ? { _id: d } : d) : []
            };
            set((state) => ({
                flashcards: state.flashcards.map((card) =>
                    card._id === id ? updatedCard : card
                ),
                isLoading: false,
                editingFlashcard: null,
            }));
            // Update allTags
            const tagsSet = new Set();
            get().flashcards.forEach(card => { // Re-calculate from all cards after update
                if (card.tags) card.tags.forEach(tag => tagsSet.add(tag));
            });
            if (updatedCard.tags) updatedCard.tags.forEach(tag => tagsSet.add(tag)); // ensure new tags are added
            set({ allTags: Array.from(tagsSet).sort() });
            get().showToast('Flashcard updated!');
            return updatedCard;
        } catch (err) {
            set({ error: err.message || 'Failed to update flashcard', isLoading: false });
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not update flashcard.');
            throw err;
        }
    },
    deleteFlashcard: async (id) => {
        try {
            await api.delete(`/flashcards/${id}`);
            set((state) => {
                const remainingFlashcards = state.flashcards.filter((card) => card._id !== id);
                // Update allTags
                const tagsSet = new Set();
                remainingFlashcards.forEach(card => {
                    if (card.tags) card.tags.forEach(tag => tagsSet.add(tag));
                });
                return {
                    flashcards: remainingFlashcards,
                    allTags: Array.from(tagsSet).sort(),
                };
            });
            get().showToast('Flashcard deleted!');
        } catch (err) {
            // ... (error handling)
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not delete flashcard.');
        }
    },

    showModal: (title, message, onConfirm = null, confirmText = 'OK', cancelText = 'Cancel') => {
        if (onConfirm && confirmText === 'OK' && cancelText === 'Cancel') {
            confirmText = 'Confirm';
        }
        set({ isModalOpen: true, modalContent: { title, message, onConfirm, confirmText, cancelText } });
    },

    hideModal: () => {
        set({ isModalOpen: false });
    },

    confirmDelete: (id, question) => {
        set({ isLoading: true }); // Set loading before showing modal for delete
        const truncatedQuestion = question.length > 50 ? question.substring(0, 50) + '...' : question;
        get().showModal(
            "Confirm Deletion",
            `Are you sure you want to delete the flashcard: "${truncatedQuestion}"?`,
            async () => { // Make onConfirm async
                await get().deleteFlashcard(id);
                set({ isLoading: false }); // Clear loading after delete attempt
            },
            "Delete",
            "Cancel"
        );
        // If modal is cancelled, isLoading should also be reset.
        // We can enhance Modal.jsx or add logic here if needed, but for now, it resets on action.
        // A more robust way: hideModal could also clear a general 'actionIsLoading' flag.
    },

    // Actions for editing
    startEdit: (card) => {
        set({ editingFlashcard: card, currentPage: 'create' });
        // Scroll to the form for better UX
        setTimeout(() => {
            const formElement = document.getElementById('flashcard-form-section');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    },
    cancelEdit: () => {
        set({ editingFlashcard: null });
    },

    setSelectedTypeFilter: (type) => set({ selectedTypeFilter: type, currentPageNumber: 1 }),
    setSelectedDeckFilter: (deckId) => set({ selectedDeckFilter: deckId, currentPageNumber: 1 }),
    setSelectedTagsFilter: (tags) => set({ selectedTagsFilter: tags, currentPageNumber: 1 }), // tags is an array of strings
    setSearchQuery: (query) => set({ searchQuery: query, currentPageNumber: 1 }),
    setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show, currentPageNumber: 1 }),
    
    // Sorting actions
    toggleSortOrder: () => set((state) => ({ 
        sortOrder: state.sortOrder === 'newest' ? 'oldest' : 'newest',
        currentPageNumber: 1 
    })),
    setSortOrder: (order) => set({ sortOrder: order, currentPageNumber: 1 }),
    
    // Pagination actions
    setCurrentPageNumber: (page) => set({ currentPageNumber: page }),
    setItemsPerPage: (items) => set({ itemsPerPage: items, currentPageNumber: 1 }),
    
    // Clear all filters and reset pagination
    clearFilters: () => set({ 
        selectedTypeFilter: 'All',
        selectedDeckFilter: 'All', 
        selectedTagsFilter: [],
        searchQuery: '',
        showFavoritesOnly: false,
        currentPageNumber: 1
    }),

    // View mode actions
    setViewMode: (mode) => set({ viewMode: mode }),
    setSelectedDeckForView: (deck) => set({ selectedDeckForView: deck }),
    
    // Add setCurrentPage function
    setCurrentPage: (page) => set({ currentPage: page }),

    // GRE-specific navigation functions
    navigateToGREWords: () => {
        set({ 
            currentPage: 'cards',
            viewMode: 'decks',
            selectedTypeFilter: 'GRE-Word',
            selectedDeckFilter: 'All',
            selectedTagsFilter: [],
            searchQuery: '',
            currentPageNumber: 1
        });
    },

    navigateToGREMCQs: () => {
        set({ 
            currentPage: 'cards',
            viewMode: 'decks',
            selectedTypeFilter: 'GRE-MCQ',
            selectedDeckFilter: 'All',
            selectedTagsFilter: [],
            searchQuery: '',
            currentPageNumber: 1
        });
    },

    navigateToGRETest: () => {
        set({ 
            currentPage: 'test',
            // Note: Test filtering will be handled in TestTab component
        });
    },

    navigateToDSA: () => {
        set({
            currentPage: 'cards',
            viewMode: 'decks',
            selectedTypeFilter: 'DSA',
            selectedDeckFilter: 'All',
            selectedTagsFilter: [],
            searchQuery: '',
            currentPageNumber: 1
        });
    },

    updateAllTags: () => {
        const { flashcards } = get();
        const allTagsSet = new Set();
        flashcards.forEach(card => {
            if (card.tags && Array.isArray(card.tags)) {
                card.tags.forEach(tag => allTagsSet.add(tag));
            }
        });
        const allTags = Array.from(allTagsSet).sort();
        set({ allTags });
    },

    // Toast state
    toast: { message: '', type: 'success', visible: false },
    showToast: (message, type = 'success') => {
        set({ toast: { message, type, visible: true } });
        setTimeout(() => {
            get().hideToast();
        }, 1000);
    },
    hideToast: () => set({ toast: { message: '', type: 'success', visible: false } }),

    // Dark mode state
    darkMode: true,
    toggleDarkMode: () => {
        set((state) => {
            const newMode = !state.darkMode;
            localStorage.setItem('darkMode', newMode);
            return { darkMode: newMode };
        });
    },

    selectedFlashcard: null,
    filter: {
        type: "all",
        tags: [],
        search: "",
    },

    // Get filtered flashcards
    getFilteredFlashcards: () => {
        const { flashcards, filter } = get();
        return flashcards.filter((flashcard) => {
            const matchesType =
                filter.type === "all" || flashcard.type === filter.type;
            const matchesTags =
                filter.tags.length === 0 ||
                filter.tags.every((tag) => flashcard.tags.includes(tag));
            const matchesSearch =
                !filter.search ||
                flashcard.question.toLowerCase().includes(filter.search.toLowerCase()) ||
                flashcard.explanation.toLowerCase().includes(filter.search.toLowerCase()) ||
                flashcard.problemStatement.toLowerCase().includes(filter.search.toLowerCase()) ||
                flashcard.tags.some((tag) =>
                    tag.toLowerCase().includes(filter.search.toLowerCase())
                );
            return matchesType && matchesTags && matchesSearch;
        });
    },

    // Set selected flashcard
    setSelectedFlashcard: (flashcard) => {
        set({ selectedFlashcard: flashcard });
    },

    // Update filter
    setFilter: (filter) => {
        set({ filter });
    },

    // Dictionary data for pre-filling form
    dictionaryData: null,
    
    // Set dictionary data and navigate to create form
    prefillGREWordForm: (dictionaryData) => {
        // console.log('Store: prefillGREWordForm called with:', dictionaryData);
        set({
            currentPage: 'create',
            dictionaryData: dictionaryData,
            editingFlashcard: null // Clear any existing edit
        });
        // console.log('Store: dictionaryData set, currentPage set to create');
    },
    
    // Clear dictionary data
    clearDictionaryData: () => {
        set({ dictionaryData: null });
    },

}));

export default useFlashcardStore;