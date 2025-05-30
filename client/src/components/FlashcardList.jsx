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
import React, { useEffect, useMemo } from "react";
import useFlashcardStore from "../store/flashcardStore";
import FlashcardItem from "./FlashcardItem";

function FlashcardList() {
  const {
    flashcards,
    fetchFlashcards,
    isLoading,
    error,
    selectedTypeFilter,
    selectedDeckFilter,
    selectedTagsFilter,
  } = useFlashcardStore();

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

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

      return typeMatch && deckMatch && tagsMatch;
    });
  }, [flashcards, selectedTypeFilter, selectedDeckFilter, selectedTagsFilter]);

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
    <div className="space-y-6">
      {filteredFlashcards.map((card) => (
        <FlashcardItem key={card._id} card={card} />
      ))}
    </div>
  );
}
export default FlashcardList;
