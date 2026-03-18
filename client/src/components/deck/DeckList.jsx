import React, { useState, useMemo } from 'react';
import DeckCard from './DeckCard';
import AnimatedDropdown from '../common/AnimatedDropdown';
import { MagnifyingGlassIcon, ArrowUpIcon, ArrowDownIcon, HeartIcon } from '@heroicons/react/24/outline';
import useFlashcardStore from '../../store/flashcardStore';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, useLocation } from 'react-router-dom';
import { isGREMode, getAvailableTypes } from '../../utils/greUtils';

const DeckList = ({ onDeckClick, filteredDecks = null, filteredFlashcards = null }) => {
  const { selectedTypeFilter, setSelectedTypeFilter, decks: storeDecks, flashcards: storeFlashcards, showFavoritesOnly, setShowFavoritesOnly } = useFlashcardStore();
  
  // Use filtered data if provided, otherwise use store data
  const decks = filteredDecks || storeDecks;
  const flashcards = filteredFlashcards || storeFlashcards;
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Get available types based on current mode (GRE or regular)
  const inGREMode = isGREMode(location.pathname);
  const deckTypes = getAvailableTypes(inGREMode);


  // Filter, search, and sort decks
  const filteredAndSortedDecks = useMemo(() => {
    if (!decks || !Array.isArray(decks)) return [];
    
    // First filter the decks
    const filtered = decks.filter(deck => {
      const matchesType = selectedTypeFilter === 'All' || deck.type === selectedTypeFilter;
      const matchesSearch = searchQuery.trim() === '' || 
        deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Add favorites filter
      const matchesFavorites = !showFavoritesOnly || 
        (user && user.favorites && user.favorites.includes(deck._id));
      
      return matchesType && matchesSearch && matchesFavorites;
    });

    // Then sort the filtered decks
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      
      if (sortOrder === 'newest') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

    return sorted;
  }, [decks, selectedTypeFilter, searchQuery, sortOrder, showFavoritesOnly, user]);

  // Check if there are active filters
  const hasActiveFilters = selectedTypeFilter !== 'All' || searchQuery.trim() !== '' || showFavoritesOnly;

  // Clear all filters
  const clearFilters = () => {
    setSelectedTypeFilter('All');
    setSearchQuery('');
    setShowFavoritesOnly(false);
  };

  // Favorites Toggle Handler
  const handleFavoritesToggle = () => {
    const newValue = !showFavoritesOnly;
    setShowFavoritesOnly(newValue);
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (newValue) {
        params.set('showFavoritesOnly', 'true');
      } else {
        params.delete('showFavoritesOnly');
      }
      return params;
    });
  };

  if (!decks || !Array.isArray(decks) || decks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">Loading Decks...</div>
        {/* <div className="text-gray-500 text-sm">
          Create your first deck to organize your flashcards!
        </div> */}
      </div>
    );
  }

  return (
    <div>
      {/* Filters and Search Section */}
      <div className="bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 p-4 mb-6 transition-colors duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Deck Filters</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-brand-900/30 text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-800">
                Active
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-mono"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Search Bar */}
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Search Decks
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-stone-400 dark:text-stone-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by deck name or description..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 transition-colors"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Filter by Type
            </label>
            <div className="relative">
              <AnimatedDropdown
                value={selectedTypeFilter}
                onChange={(option) => setSelectedTypeFilter(option.value)}
                options={deckTypes.map(type => ({ value: type, label: type }))}
                placeholder="Select type"
              />
            </div>
          </div>
        </div>

        {/* Favorites Toggle */}
        {user && (
          <div className="mt-3">
            <button
              onClick={handleFavoritesToggle}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs rounded transition-colors active:scale-[0.98] ${
                showFavoritesOnly
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-400 border border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'
              }`}
            >
              <HeartIcon className={`h-3.5 w-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              <span className="font-mono">{showFavoritesOnly ? 'Showing Favorites Only' : 'Show All Decks'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Sort Order Toggle */}
      <div className="mb-4 flex items-center justify-between">
        {/* Results Summary */}
        {hasActiveFilters && (
          <p className="text-xs text-stone-500 dark:text-stone-500 font-mono">
            {filteredAndSortedDecks.length} of {decks.length} deck{decks.length !== 1 ? 's' : ''}
          </p>
        )}
        <button
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center space-x-1.5 px-2 py-1.5 text-xs font-mono text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded hover:border-stone-400 dark:hover:border-stone-600 transition-colors active:scale-[0.98] ml-auto"
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

      {/* Decks Grid */}
      {filteredAndSortedDecks.length === 0 ? (
        <div className="text-center py-12 border border-stone-300 dark:border-stone-800 rounded-md bg-stone-100 dark:bg-stone-900/50 transition-colors">
          <div className="text-stone-600 dark:text-stone-400 text-sm mb-2">No decks match your filters</div>
          <div className="text-stone-500 dark:text-stone-500 text-xs mb-4">
            Try adjusting your search or filter criteria
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-xs bg-brand-600 text-white rounded hover:bg-brand-500 transition-colors active:scale-[0.98] border border-brand-500"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedDecks.map((deck) => (
            <DeckCard
              key={deck._id}
              deck={deck}
              onDeckClick={onDeckClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeckList; 