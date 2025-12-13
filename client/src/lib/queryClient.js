import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized defaults for this application
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 30 seconds
      staleTime: 30 * 1000,
      // Cache data for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests up to 2 times
      retry: 2,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Flashcards
  flashcards: {
    all: ['flashcards'],
    lists: () => [...queryKeys.flashcards.all, 'list'],
    list: (filters) => [...queryKeys.flashcards.lists(), filters],
    details: () => [...queryKeys.flashcards.all, 'detail'],
    detail: (id) => [...queryKeys.flashcards.details(), id],
  },
  
  // Decks
  decks: {
    all: ['decks'],
    lists: () => [...queryKeys.decks.all, 'list'],
    list: (filters) => [...queryKeys.decks.lists(), filters],
    details: () => [...queryKeys.decks.all, 'detail'],
    detail: (id) => [...queryKeys.decks.details(), id],
  },
  
  // Folders
  folders: {
    all: ['folders'],
    lists: () => [...queryKeys.folders.all, 'list'],
    list: (filters) => [...queryKeys.folders.lists(), filters],
    details: () => [...queryKeys.folders.all, 'detail'],
    detail: (id) => [...queryKeys.folders.details(), id],
  },
  
  // User
  user: {
    all: ['user'],
    profile: () => [...queryKeys.user.all, 'profile'],
    favorites: () => [...queryKeys.user.all, 'favorites'],
    recents: () => [...queryKeys.user.all, 'recents'],
  },
  
  // Dictionary
  dictionary: {
    all: ['dictionary'],
    word: (word) => [...queryKeys.dictionary.all, word],
  },
};

export default queryClient;

