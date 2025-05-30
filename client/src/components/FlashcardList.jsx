import React, { useEffect } from "react";
import useFlashcardStore from "../store/flashcardStore";
import FlashcardItem from "./FlashcardItem";

function FlashcardList() {
  const { flashcards, fetchFlashcards, isLoading, error } = useFlashcardStore();

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  if (isLoading && flashcards.length === 0) {
    // Show loading only on initial load
    return (
      <p className="text-gray-500 text-center py-8 text-lg">
        Loading flashcards...
      </p>
    );
  }

  if (error && flashcards.length === 0) {
    // Show error if initial fetch fails
    return (
      <p className="text-red-500 text-center py-8 text-lg">
        Error loading flashcards: {error}
      </p>
    );
  }

  if (flashcards.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8 text-lg">
        No flashcards yet. Add some using the form above!
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {flashcards.map((card) => (
        <FlashcardItem key={card._id} card={card} />
      ))}
    </div>
  );
}

export default FlashcardList;
