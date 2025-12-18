import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import useFlashcardStore from '../store/flashcardStore';
import FlashcardList from './flashcard/FlashcardList';
import DeckFolderManager from './folder/DeckFolderManager';
import ExportModal from './common/ExportModal';
import ActionsDropdown from './common/ActionsDropdown';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, MagnifyingGlassIcon, PlusIcon, PlayIcon } from '@heroicons/react/24/outline';
import { updateRecentDecks } from '../services/api';
import { isGREMode, getNavigationLinks } from '../utils/greUtils';

const DeckView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated, user, addToFavorites, removeFromFavorites, updateRecentsInContext } = useAuth();
  const navigate = useNavigate();
  const deckId = searchParams.get('deck');
  
  // Detect if we're in GRE mode
  const inGREMode = isGREMode(location.pathname);
  const navLinks = getNavigationLinks(location.pathname);

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
    isLoadingDecks,
    getFoldersForDeck,
    setCurrentPageNumber,
  } = useFlashcardStore();

  const [sortOrder, setLocalSortOrder] = useState('oldest');
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Ref to track if we've already updated recent decks for this deck
  const hasTrackedDeck = useRef(false);

  // Fetch decks once on mount
  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Fetch flashcards for this specific deck when deckId changes
  useEffect(() => {
    if (deckId && decks.length > 0) {
      const deck = decks.find(d => d._id === deckId);
      if (deck) {
        // Set the deck filter and view
        setSelectedDeckFilter(deckId);
        setSelectedDeckForView(deck);
        setCurrentPageNumber(1); // Reset to page 1 when opening a deck
        
        // Fetch flashcards filtered by this deck with pagination disabled for deck view
        // Pass the deckId explicitly to ensure we get the right cards
        fetchFlashcards({ deck: deckId, paginate: false, type: 'All', tags: [], search: '' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, decks.length]); // Only depend on deckId and decks.length, not store functions

  // Track deck access for recent decks - only once per deck
  useEffect(() => {
    if (selectedDeckForView && isAuthenticated && deckId && !hasTrackedDeck.current) {
      hasTrackedDeck.current = true;
      const trackDeckAccess = async () => {
        try {
          const response = await updateRecentDecks(deckId);
          updateRecentsInContext(response.recents); // Update context with response data
        } catch (error) {
          console.error('Failed to update recent decks:', error);
          // Don't show error to user - it's a background operation
        }
      };
      trackDeckAccess();
    }
  }, [selectedDeckForView, isAuthenticated, deckId, updateRecentsInContext]);

  // Reset tracking when deck changes
  useEffect(() => {
    hasTrackedDeck.current = false;
  }, [deckId]);

  useEffect(() => {
    setSortOrder(sortOrder);
  }, [sortOrder, setSortOrder]);

  const handleBackToHome = () => {
    navigate(`/home?view=decks&type=${selectedDeckForView.type}`);
  };

  const handleStartTest = () => {
    if (selectedDeckForView) {
      // Check if the deck is a GRE type deck
      const isGREDeck = selectedDeckForView.type === 'GRE-Word' || selectedDeckForView.type === 'GRE-MCQ';
      
      // Navigate to the appropriate testing route based on deck type
      if (isGREDeck) {
        navigate(`/gre/testing?deck=${selectedDeckForView._id}`);
      } else {
        navigate(`/testing?deck=${selectedDeckForView._id}`);
      }
    }
  };

  const handleAddCard = () => {
    if (selectedDeckForView) {
      navigate(`/home?tab=create&deck=${selectedDeckForView._id}&type=${selectedDeckForView.type}`);
    }
  };

  const handleStudyMode = () => {
    if (selectedDeckForView) {
      // Check if the deck is a GRE type deck
      const isGREDeck = selectedDeckForView.type === 'GRE-Word' || selectedDeckForView.type === 'GRE-MCQ';
      
      // Navigate to the appropriate study route based on deck type
      if (isGREDeck) {
        navigate(`/gre/study?deck=${selectedDeckForView._id}`);
      } else {
        navigate(`/study?deck=${selectedDeckForView._id}`);
      }
    }
  };

  const handleShowFolders = () => {
    setShowFolderManager(true);
  };

  const handleExportDeck = () => {
    setShowExportModal(true);
  };

  // Check if this deck was imported from YouTube playlist
  const isYouTubeDeck = selectedDeckForView && 
    (selectedDeckForView.description?.includes('Imported from YouTube playlist') ||
     selectedDeckForView.tags?.includes('youtube') ||
     selectedDeckForView.tags?.includes('imported'));

  const isDeckOwner =
    selectedDeckForView &&
    user &&
    (
      selectedDeckForView.user === user._id ||
      (typeof selectedDeckForView.user === 'object' && selectedDeckForView.user._id === user._id)
    );

  const isFavorite = user && user.favorites && selectedDeckForView && user.favorites.includes(selectedDeckForView._id);

  const handleToggleFavorite = async () => {
    if (!selectedDeckForView || !user) return;
    
    try {
      if (isFavorite) {
        await removeFromFavorites(selectedDeckForView._id);
      } else {
        await addToFavorites(selectedDeckForView._id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (!selectedDeckForView) {
    if (isLoadingDecks) {
      return (
        <div className="min-h-screen flex flex-col bg-transparent">
          <div className="flex-1">
            <div className="container mx-auto px-4">
              <Navbar />
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Loading decks...
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Please wait while we load your decks.
                  </p>
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
            {/* Desktop Layout - buttons next to deck name */}
            <div className="hidden md:flex items-center justify-between">
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
                  onClick={handleStudyMode}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>Study</span>
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
                <ActionsDropdown
                  isFavorite={isFavorite}
                  onToggleFavorite={handleToggleFavorite}
                  onStartTest={handleStartTest}
                  onExportDeck={handleExportDeck}
                  onShowFolders={handleShowFolders}
                  isAuthenticated={isAuthenticated}
                  isDeckOwner={isDeckOwner}
                />
              </div>
            </div>

            {/* Mobile Layout - buttons below deck name */}
            <div className="md:hidden">
              <div className="flex items-center space-x-4 mb-4">
                <button 
                  onClick={handleBackToHome} 
                  className="flex items-center space-x-2 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  {/* <span>Back</span> */}
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
                  onClick={handleStudyMode}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Study</span>
                </button>
                {isAuthenticated && isDeckOwner && (
                  <button
                    onClick={handleAddCard}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Card</span>
                  </button>
                )}
                <ActionsDropdown
                  isFavorite={isFavorite}
                  onToggleFavorite={handleToggleFavorite}
                  onStartTest={handleStartTest}
                  onExportDeck={handleExportDeck}
                  onShowFolders={handleShowFolders}
                  isAuthenticated={isAuthenticated}
                  isDeckOwner={isDeckOwner}
                />
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

      {/* Folder Manager */}
      {showFolderManager && (
        <DeckFolderManager
          deckId={deckId}
          onClose={() => setShowFolderManager(false)}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          deckId={deckId}
          deckName={selectedDeckForView?.name}
        />
      )}
    </div>
  );
};

export default DeckView; 