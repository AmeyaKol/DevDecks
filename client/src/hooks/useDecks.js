import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import api, { fetchDecksPaginated, fetchAllDecks } from '../services/api';

/**
 * Hook for fetching decks with pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.type - Filter by type
 * @param {string} options.search - Search query
 * @param {string} options.sort - Sort order
 * @param {boolean} options.enabled - Whether to enable the query
 */
export function useDecks(options = {}) {
  const { enabled = true, ...filters } = options;
  
  return useQuery({
    queryKey: queryKeys.decks.list(filters),
    queryFn: () => fetchDecksPaginated(filters),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook for fetching all decks without pagination
 */
export function useAllDecks(options = {}) {
  const { enabled = true } = options;
  
  return useQuery({
    queryKey: queryKeys.decks.all,
    queryFn: fetchAllDecks,
    enabled,
  });
}

/**
 * Hook for fetching a single deck by ID
 * @param {string} id - Deck ID
 */
export function useDeck(id) {
  return useQuery({
    queryKey: queryKeys.decks.detail(id),
    queryFn: async () => {
      const response = await api.get(`/decks/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for creating a new deck
 */
export function useCreateDeck() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (deckData) => {
      const response = await api.post('/decks', deckData);
      return response.data;
    },
    onSuccess: (newDeck) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.decks.lists() });
      queryClient.setQueryData(queryKeys.decks.detail(newDeck._id), newDeck);
    },
    onError: (error) => {
      console.error('Failed to create deck:', error);
    },
  });
}

/**
 * Hook for updating a deck
 */
export function useUpdateDeck() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/decks/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedDeck, variables) => {
      queryClient.setQueryData(queryKeys.decks.detail(variables.id), updatedDeck);
      queryClient.invalidateQueries({ queryKey: queryKeys.decks.lists() });
    },
    onError: (error) => {
      console.error('Failed to update deck:', error);
    },
  });
}

/**
 * Hook for deleting a deck
 */
export function useDeleteDeck() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/decks/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.decks.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.decks.lists() });
      // Also invalidate flashcard lists since flashcard-deck associations may have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete deck:', error);
    },
  });
}

/**
 * Hook for prefetching decks
 */
export function usePrefetchDecks() {
  const queryClient = useQueryClient();
  
  return (filters) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.decks.list(filters),
      queryFn: () => fetchDecksPaginated(filters),
      staleTime: 30 * 1000,
    });
  };
}

export default useDecks;

