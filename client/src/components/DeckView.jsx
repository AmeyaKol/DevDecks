import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useFlashcardStore from '../store/flashcardStore';
import FlashcardList from './flashcard/FlashcardList';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, MagnifyingGlassIcon, AcademicCapIcon, PlusIcon } from '@heroicons/react/24/outline';

const DeckView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const deckId = searchParams.get('deck');

  const {
    fetchDecks,
    fetchFlashcards,
    setSelectedDeckForView,
    setSelectedDeckFilter,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    decks,
    selectedDeckForView,
    clearFilters,
  } = useFlashcardStore();

  const [sortOrder, setLocalSortOrder] = useState('oldest');

  useEffect(() => {
    fetchDecks();
    fetchFlashcards();
  }, [fetchDecks, fetchFlashcards]);

  useEffect(() => {
    if (deckId) {
      setSelectedDeckFilter(deckId);
      setSelectedDeckForView(decks.find(deck => deck._id === deckId));
    }
  }, [deckId, decks, setSelectedDeckFilter, setSelectedDeckForView]);

  useEffect(() => {
    setSortOrder(sortOrder);
  }, [sortOrder, setSortOrder]);

  const handleBackToHome = () => {
    navigate(`/home?view=decks&type=${selectedDeckForView.type}`);
  };

  const handleStartTest = () => {
    if (selectedDeckForView) {
      navigate(`/testing?deck=${selectedDeckForView._id}`);
    }
  };

  const handleAddCard = () => {
    if (selectedDeckForView) {
      navigate(`/?view=create&deck=${selectedDeckForView._id}&type=${selectedDeckForView.type}`);
    }
  };

  const isDeckOwner = selectedDeckForView && user && selectedDeckForView.user === user._id;

  if (!selectedDeckForView) {
    return (
      <div className="min-h-screen flex flex-col bg-transparent">
        <div className="flex-1">
          <div className="container mx-auto px-4">
            <Navbar />
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Deck not found
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  The deck you're looking for doesn't exist or has been removed.
                </p>
                <button
                  onClick={handleBackToHome}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <div className="flex-1">
        <div className="container mx-auto px-4">
          <Navbar />
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleBackToHome} 
                  className="flex items-center space-x-2 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                    {selectedDeckForView.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedDeckForView.description || 'No description'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleStartTest}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>Start Test</span>
                </button>
                {isAuthenticated && isDeckOwner && (
                  <button
                    onClick={handleAddCard}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Card</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Filters</h3>
              {searchQuery.trim() !== '' && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                >
                  Clear Search
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Sort Order</label>
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
                  <button 
                    onClick={() => setLocalSortOrder('oldest')} 
                    className={`px-3 py-1 text-xs font-medium rounded-md ${sortOrder === 'oldest' ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  >
                    Oldest First
                  </button>
                  <button 
                    onClick={() => setLocalSortOrder('newest')} 
                    className={`px-3 py-1 text-xs font-medium rounded-md ${sortOrder === 'newest' ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  >
                    Newest First
                  </button>
                </div>
              </div> */}
            </div>
          </div>

          {/* Flashcard List */}
          <FlashcardList />
        </div>
      </div>
    </div>
  );
};

export default DeckView; 