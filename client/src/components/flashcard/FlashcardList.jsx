// client/src/components/FlashcardList.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { FixedSizeList as List } from "react-window";
import useFlashcardStore from "../../store/flashcardStore";
import FlashcardItem from "./FlashcardItem";
import Pagination from "../common/Pagination";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

function FlashcardList({ filteredFlashcards = null }) {
  const flashcardListRef = useRef(null);
  
  const {
    flashcards: storeFlashcards,
    fetchFlashcards,
    isLoading,
    error,
    selectedTypeFilter,
    selectedDeckFilter,
    selectedTagsFilter,
    searchQuery,
    currentPageNumber,
    itemsPerPage,
    totalItems,
    totalPages: serverTotalPages,
    hasNextPage,
    hasPrevPage,
    setCurrentPageNumber,
    setItemsPerPage,
    goToPage,
    sortOrder,
    toggleSortOrder,
    useServerPagination,
  } = useFlashcardStore();
  
  // Use filtered data if provided, otherwise use store data
  const flashcards = filteredFlashcards || storeFlashcards;

  useEffect(() => {
    // Only fetch if no filtered flashcards are provided
    // If filteredFlashcards prop is passed, don't fetch (parent handles it)
    if (!filteredFlashcards) {
      // Don't call fetchFlashcards here - let parent components handle fetching
      // This prevents re-fetching and overwriting data
    }
  }, []); // Empty dependency array - don't fetch on mount

  // Scroll to top when page changes
  useEffect(() => {
    if (flashcardListRef.current) {
      flashcardListRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [currentPageNumber]);

  // Client-side filtering (only when filteredFlashcards prop is provided or when deckFilter is "All")
  const filteredAndSortedFlashcards = useMemo(() => {
    // If flashcards prop is provided, it's already filtered from parent - just use it
    // Or if we have a specific deck selected, the store already has filtered data
    if (filteredFlashcards || selectedDeckFilter !== "All") {
      return flashcards;
    }
    
    // Only do client-side filtering for HomePage with "All" decks view
    return flashcards.filter((card) => {
      // Safety check: ensure card exists
      if (!card) return false;

      const typeMatch =
        selectedTypeFilter === "All" || (card.type && card.type === selectedTypeFilter);

      const tagsMatch =
        selectedTagsFilter.length === 0 ||
        (card.tags && Array.isArray(card.tags) &&
          selectedTagsFilter.every((filterTag) =>
            card.tags.includes(filterTag)
          ));

      const searchMatch =
        !searchQuery ||
        (card.question && typeof card.question === 'string' && 
         card.question.toLowerCase().includes(searchQuery.toLowerCase()));

      return typeMatch && tagsMatch && searchMatch;
    });
  }, [flashcards, selectedTypeFilter, selectedDeckFilter, selectedTagsFilter, searchQuery, filteredFlashcards]);

  // Sort filtered flashcards based on sort order (client-side only for non-paginated views)
  const sortedFlashcards = useMemo(() => {
    return [...filteredAndSortedFlashcards].sort((a, b) => {
      // Safety check: ensure both cards exist
      if (!a || !b) return 0;
      
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      
      // Handle invalid dates
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      
      if (sortOrder === 'newest') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });
  }, [filteredAndSortedFlashcards, sortOrder]);

  // Calculate pagination (always client-side for DeckView)
  const clientTotalPages = Math.ceil(sortedFlashcards.length / itemsPerPage);
  const totalPages = clientTotalPages;
  const displayTotalItems = sortedFlashcards.length;
  
  // Client-side pagination
  const startIndex = (currentPageNumber - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFlashcards = sortedFlashcards.slice(startIndex, endIndex);

  const useVirtualization = paginatedFlashcards.length > 30;
  const rowHeight = 260;
  const listHeight = Math.min(800, paginatedFlashcards.length * rowHeight);

  const Row = ({ index, style }) => {
    const card = paginatedFlashcards[index];
    if (!card) return null;
    return (
      <div style={style} className="px-1">
        <FlashcardItem key={card._id} flashcard={card} />
      </div>
    );
  };

  // Pagination handlers (client-side only)
  const handlePageChange = (newPage) => {
    setCurrentPageNumber(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPageNumber(1); // Reset to first page when changing items per page
  };

  if (isLoading && flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border border-stone-300 dark:border-stone-800 rounded-md bg-white dark:bg-stone-900/50 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-4"></div>
        <p className="text-stone-600 dark:text-stone-400 text-sm">
          Loading flashcards...
        </p>
      </div>
    );
  }
  
  if (error && flashcards.length === 0) {
    return (
      <div className="text-center py-12 border border-stone-300 dark:border-stone-800 rounded-md bg-white dark:bg-stone-900/50 shadow-sm">
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">
          Error loading flashcards: {error}
        </p>
        <button
          onClick={() => fetchFlashcards()}
          className="px-3 py-2 text-xs bg-brand-600 text-white rounded hover:bg-brand-500 transition-colors active:scale-[0.98] border border-brand-500"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (sortedFlashcards.length === 0) {
    if (flashcards.length > 0 || displayTotalItems > 0) {
      // Cards exist, but filters hide them all
      return (
        <p className="text-stone-600 dark:text-stone-400 text-center py-8 text-sm border border-stone-300 dark:border-stone-800 rounded-md bg-white dark:bg-stone-900/50 shadow-sm">
          No flashcards match your current filters.
        </p>
      );
    }
    return (
      <p className="text-stone-600 dark:text-stone-400 text-center py-8 text-sm border border-stone-300 dark:border-stone-800 rounded-md bg-white dark:bg-stone-900/50 shadow-sm">
        No flashcards yet. Add some using the form!
      </p>
    );
  }

  return (
    <div ref={flashcardListRef}>
      {/* Results summary and sort toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xs text-stone-500 dark:text-stone-500 font-mono">
          {displayTotalItems === flashcards.length || (useServerPagination && !filteredFlashcards)
            ? `${paginatedFlashcards.length} of ${displayTotalItems} flashcards`
            : `${paginatedFlashcards.length} of ${displayTotalItems} filtered`}
        </div>
        
        {/* Sort toggle button */}
        <button
          onClick={toggleSortOrder}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-2 py-1.5 text-xs font-mono text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded hover:border-brand-400 dark:hover:border-stone-600 transition-colors active:scale-[0.98] disabled:opacity-50"
          title={`Sort by ${sortOrder === 'newest' ? 'oldest' : 'newest'} first`}
        >
          {sortOrder === 'newest' ? (
            <>
              <ArrowDownIcon className="h-3 w-3" />
              <span>Newest First</span>
            </>
          ) : (
            <>
              <ArrowUpIcon className="h-3 w-3" />
              <span>Oldest First</span>
            </>
          )}
        </button>
      </div>

      {/* Loading overlay for pagination */}
      {isLoading && flashcards.length > 0 && (
        <div className="absolute inset-0 bg-white/70 dark:bg-stone-950/70 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      )}

      {/* Flashcard items */}
      <div className="space-y-4 relative">
        {useVirtualization ? (
          <List
            height={listHeight}
            itemCount={paginatedFlashcards.length}
            itemSize={rowHeight}
            width="100%"
          >
            {Row}
          </List>
        ) : (
          paginatedFlashcards.map((card) => (
            <FlashcardItem key={card._id} flashcard={card} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPageNumber}
            totalPages={totalPages}
            totalItems={displayTotalItems}
            itemsPerPage={itemsPerPage}
            hasNextPage={currentPageNumber < totalPages}
            hasPrevPage={currentPageNumber > 1}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            isLoading={isLoading}
            itemName="flashcards"
          />
        </div>
      )}
    </div>
  );
}

export default FlashcardList;
