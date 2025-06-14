import React from 'react';
import DeckCard from './DeckCard';

const DeckList = ({ decks, flashcards, onDeckClick }) => {
  // Calculate flashcard count for each deck
  const getDeckFlashcardCount = (deckId) => {
    return flashcards.filter(card => 
      card.decks && card.decks.some(d => 
        typeof d === 'string' ? d === deckId : d._id === deckId
      )
    ).length;
  };

  if (decks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No decks found</div>
        <div className="text-gray-500 text-sm">
          Create your first deck to organize your flashcards!
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {decks.map((deck) => (
        <DeckCard
          key={deck._id}
          deck={deck}
          flashcardCount={getDeckFlashcardCount(deck._id)}
          onDeckClick={onDeckClick}
        />
      ))}
    </div>
  );
};

export default DeckList; 