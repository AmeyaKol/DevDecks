// import React, { useEffect } from "react";
// import useFlashcardStore from "../store/flashcardStore";
// import FlashcardItem from "./FlashcardItem";

// function FlashcardList() {
//   const { flashcards, fetchFlashcards, isLoading, error } = useFlashcardStore();

//   useEffect(() => {
//     fetchFlashcards();
//   }, [fetchFlashcards]);

//   if (isLoading && flashcards.length === 0) {
//     // Show loading only on initial load
//     return (
//       <p className="text-gray-500 text-center py-8 text-lg">
//         Loading flashcards...
//       </p>
//     );
//   }

//   if (error && flashcards.length === 0) {
//     // Show error if initial fetch fails
//     return (
//       <p className="text-red-500 text-center py-8 text-lg">
//         Error loading flashcards: {error}
//       </p>
//     );
//   }

//   if (flashcards.length === 0) {
//     return (
//       <p className="text-gray-500 text-center py-8 text-lg">
//         No flashcards yet. Add some using the form above!
//       </p>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {flashcards.map((card) => (
//         <FlashcardItem key={card._id} card={card} />
//       ))}
//     </div>
//   );
// }

// export default FlashcardList;
// client/src/components/FlashcardList.jsx
import React, { useEffect, useMemo, useRef } from "react";
import useFlashcardStore from "../../store/flashcardStore";
import FlashcardItem from "./FlashcardItem";
import Pagination from "../common/Pagination";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

function FlashcardList() {
  const flashcardListRef = useRef(null);
  
  const {
    flashcards,
    fetchFlashcards,
    isLoading,
    error,
    selectedTypeFilter,
    selectedDeckFilter,
    selectedTagsFilter,
    searchQuery,
    currentPageNumber,
    itemsPerPage,
    setCurrentPageNumber,
    sortOrder,
    toggleSortOrder,
  } = useFlashcardStore();

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Scroll to top when page changes
  useEffect(() => {
    if (flashcardListRef.current) {
      flashcardListRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [currentPageNumber]);

  const filteredFlashcards = useMemo(() => {
    return flashcards.filter((card) => {
      const typeMatch =
        selectedTypeFilter === "All" || card.type === selectedTypeFilter;

      const deckMatch =
        selectedDeckFilter === "All" ||
        (card.decks && card.decks.some((d) => d._id === selectedDeckFilter));

      const tagsMatch =
        selectedTagsFilter.length === 0 ||
        (card.tags &&
          selectedTagsFilter.every((filterTag) =>
            card.tags.includes(filterTag)
          ));

      const searchMatch =
        !searchQuery ||
        card.question.toLowerCase().includes(searchQuery.toLowerCase());

      return typeMatch && deckMatch && tagsMatch && searchMatch;
    });
  }, [flashcards, selectedTypeFilter, selectedDeckFilter, selectedTagsFilter, searchQuery]);

  // Sort filtered flashcards based on sort order
  const sortedFlashcards = useMemo(() => {
    return [...filteredFlashcards].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      
      if (sortOrder === 'newest') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });
  }, [filteredFlashcards, sortOrder]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedFlashcards.length / itemsPerPage);
  const startIndex = (currentPageNumber - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFlashcards = sortedFlashcards.slice(startIndex, endIndex);

  // Custom pagination handler that includes scroll behavior
  const handlePageChange = (newPage) => {
    setCurrentPageNumber(newPage);
    // The scroll will be handled by the useEffect above
  };

  if (isLoading && flashcards.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8 text-lg">
        Loading flashcards...
      </p>
    );
  }
  
  if (error && flashcards.length === 0) {
    return (
      <p className="text-red-500 text-center py-8 text-lg">
        Error loading flashcards: {error}
      </p>
    );
  }
  
  if (filteredFlashcards.length === 0) {
    if (flashcards.length > 0) {
      // Cards exist, but filters hide them all
      return (
        <p className="text-gray-500 text-center py-8 text-lg">
          No flashcards match your current filters.
        </p>
      );
    }
    return (
      <p className="text-gray-500 text-center py-8 text-lg">
        No flashcards yet. Add some using the form!
      </p>
    );
  }

  return (
    <div ref={flashcardListRef}>
      {/* Results summary and sort toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredFlashcards.length === flashcards.length
            ? `Showing all ${filteredFlashcards.length} flashcards`
            : `Showing ${filteredFlashcards.length} flashcards`}
        </div>
        
        {/* Sort toggle button */}
        <button
          onClick={toggleSortOrder}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          title={`Sort by ${sortOrder === 'newest' ? 'oldest' : 'newest'} first`}
        >
          {sortOrder === 'newest' ? (
            <>
              <ArrowDownIcon className="h-4 w-4" />
              <span>Newest First</span>
            </>
          ) : (
            <>
              <ArrowUpIcon className="h-4 w-4" />
              <span>Oldest First</span>
            </>
          )}
        </button>
      </div>

      {/* Flashcard items */}
      <div className="space-y-6">
        {paginatedFlashcards.map((card) => (
          <FlashcardItem key={card._id} flashcard={card} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPageNumber}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={sortedFlashcards.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}

export default FlashcardList;
