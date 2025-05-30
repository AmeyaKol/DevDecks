// client/src/store/flashcardStore.js
import { create } from 'zustand';
import api from '../services/api';

const useFlashcardStore = create((set, get) => ({
    flashcards: [],
    isLoading: false,
    error: null,
    isModalOpen: false,
    modalContent: { title: '', message: '', onConfirm: null, confirmText: 'OK', cancelText: 'Cancel' },

    editingFlashcard: null, // New state for the flashcard being edited

    fetchFlashcards: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/flashcards');
            set({ flashcards: response.data, isLoading: false });
        } catch (err) {
            set({ error: err.message || 'Failed to fetch flashcards', isLoading: false });
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not fetch flashcards.');
        }
    },

    addFlashcard: async (flashcardData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/flashcards', flashcardData);
            set((state) => ({
                flashcards: [response.data, ...state.flashcards],
                isLoading: false,
            }));
            return response.data; // Return data for potential form reset or redirect
        } catch (err) {
            set({ error: err.message || 'Failed to add flashcard', isLoading: false });
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not add flashcard.');
            throw err;
        }
    },

    updateFlashcard: async (id, updatedData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.put(`/flashcards/${id}`, updatedData);
            set((state) => ({
                flashcards: state.flashcards.map((card) =>
                    card._id === id ? response.data : card
                ),
                isLoading: false,
                editingFlashcard: null, // Clear editing state
            }));
            return response.data;
        } catch (err) {
            set({ error: err.message || 'Failed to update flashcard', isLoading: false });
            get().showModal('Error', err.response?.data?.message || err.message || 'Could not update flashcard.');
            throw err;
        }
    },

    deleteFlashcard: async (id) => {
        // isLoading is handled by confirmDelete which calls this
        try {
            await api.delete(`/flashcards/${id}`);
            set((state) => ({
                flashcards: state.flashcards.filter((card) => card._id !== id),
            }));
        } catch (err) {
            set({ error: err.message || 'Failed to delete flashcard' }); // Don't set isLoading here
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
        set({ editingFlashcard: card });
        // Scroll to the form for better UX
        const formElement = document.getElementById('flashcard-form-section');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    },
    cancelEdit: () => {
        set({ editingFlashcard: null });
    }
}));

export default useFlashcardStore;