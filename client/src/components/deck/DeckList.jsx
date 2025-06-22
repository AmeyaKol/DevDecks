import React, { useState, useMemo } from 'react';
import DeckCard from './DeckCard';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import useFlashcardStore from '../../store/flashcardStore';

const DeckList = ({ decks, flashcards, onDeckClick }) => {
  const { selectedTypeFilter, setSelectedTypeFilter } = useFlashcardStore();
  const [searchQuery, setSearchQuery] = useState('');

  const deckTypes = ['All', 'DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'];

  // Calculate flashcard count for each deck
  const getDeckFlashcardCount = (deckId) => {
    return flashcards.filter(card => 
      card.decks && card.decks.some(d => 
        typeof d === 'string' ? d === deckId : d._id === deckId
      )
    ).length;
  };

  // Filter and search decks
  const filteredDecks = useMemo(() => {
    return decks.filter(deck => {
      const matchesType = selectedTypeFilter === 'All' || deck.type === selectedTypeFilter;
      const matchesSearch = searchQuery.trim() === '' || 
        deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesType && matchesSearch;
    });
  }, [decks, selectedTypeFilter, searchQuery]);

  // Check if there are active filters
  const hasActiveFilters = selectedTypeFilter !== 'All' || searchQuery.trim() !== '';

  // Clear all filters
  const clearFilters = () => {
    setSelectedTypeFilter('All');
    setSearchQuery('');
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
    <div>
      {/* Filters and Search Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Deck Filters</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                Active
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Search Decks
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by deck name or description..."
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Filter by Type
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
              >
                {deckTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredDecks.length} of {decks.length} deck{decks.length !== 1 ? 's' : ''}
            {selectedTypeFilter !== 'All' && ` (${selectedTypeFilter} type)`}
            {searchQuery.trim() !== '' && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No decks match your filters</div>
          <div className="text-gray-500 text-sm">
            Try adjusting your search or filter criteria
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDecks.map((deck) => (
            <DeckCard
              key={deck._id}
              deck={deck}
              flashcardCount={getDeckFlashcardCount(deck._id)}
              onDeckClick={onDeckClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeckList; 