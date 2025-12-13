import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import api, { 
  fetchFlashcardsPaginated, 
  fetchAllFlashcards,
  createFlashcard as apiCreateFlashcard,
  updateFlashcard as apiUpdateFlashcard 
} from '../services/api';

/**
 * Hook for fetching flashcards with pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.type - Filter by type
 * @param {string} options.deck - Filter by deck
 * @param {string[]} options.tags - Filter by tags
 * @param {string} options.search - Search query
 * @param {string} options.sort - Sort order
 * @param {boolean} options.enabled - Whether to enable the query
 */
export function useFlashcards(options = {}) {
  const { enabled = true, ...filters } = options;
  
  return useQuery({
    queryKey: queryKeys.flashcards.list(filters),
    queryFn: () => fetchFlashcardsPaginated(filters),
    enabled,
    // Keep previous data while fetching new data for smooth transitions
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook for fetching all flashcards without pagination
 */
export function useAllFlashcards(options = {}) {
  const { enabled = true } = options;
  
  return useQuery({
    queryKey: queryKeys.flashcards.all,
    queryFn: fetchAllFlashcards,
    enabled,
  });
}

/**
 * Hook for fetching a single flashcard by ID
 * @param {string} id - Flashcard ID
 */
export function useFlashcard(id) {
  return useQuery({
    queryKey: queryKeys.flashcards.detail(id),
    queryFn: async () => {
      const response = await api.get(`/flashcards/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for creating a new flashcard
 */
export function useCreateFlashcard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiCreateFlashcard,
    onSuccess: (newFlashcard) => {
      // Invalidate and refetch flashcard lists
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.lists() });
      
      // Optionally add the new flashcard to the cache
      queryClient.setQueryData(
        queryKeys.flashcards.detail(newFlashcard._id),
        newFlashcard
      );
    },
    onError: (error) => {
      console.error('Failed to create flashcard:', error);
    },
  });
}

/**
 * Hook for updating a flashcard
 */
export function useUpdateFlashcard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiUpdateFlashcard(id, data),
    onSuccess: (updatedFlashcard, variables) => {
      // Update the specific flashcard in cache
      queryClient.setQueryData(
        queryKeys.flashcards.detail(variables.id),
        updatedFlashcard
      );
      
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.lists() });
    },
    onError: (error) => {
      console.error('Failed to update flashcard:', error);
    },
  });
}

/**
 * Hook for deleting a flashcard
 */
export function useDeleteFlashcard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/flashcards/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.flashcards.detail(deletedId) });
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete flashcard:', error);
    },
  });
}

/**
 * Hook for prefetching flashcards (useful for pagination)
 */
export function usePrefetchFlashcards() {
  const queryClient = useQueryClient();
  
  return (filters) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.flashcards.list(filters),
      queryFn: () => fetchFlashcardsPaginated(filters),
      staleTime: 30 * 1000,
    });
  };
}

export default useFlashcards;

