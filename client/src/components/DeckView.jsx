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
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  
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
        
        // Fetch ALL flashcards for this specific deck (paginate: false for deck view)
        // This ensures we see all cards in the deck, not just the first 20
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

  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [localSearch, setSearchQuery]);

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
        <div className="min-h-screen flex flex-col bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
          <div className="flex-1">
            <div className="container mx-auto px-4">
              <Navbar />
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-2">
                    Loading decks...
                  </h2>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
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
      <div className="min-h-screen flex flex-col bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
        <div className="flex-1">
          <div className="container mx-auto px-4">
            <Navbar />
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  Deck not found
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                  The deck you're looking for doesn't exist or has been removed.
                </p>
                <button
                  onClick={handleBackToHome}
                  className="flex items-center space-x-2 px-3 py-2 bg-brand-600 text-white text-sm rounded hover:bg-brand-500 transition-colors active:scale-[0.98] border border-brand-500"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
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
    <div className="min-h-screen flex flex-col bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
      <div className="flex-1">
        <div className="container mx-auto px-4">
          <Navbar />
          
          {/* Header */}
          <div className="bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 p-3 mb-4 transition-colors">
            {/* Desktop Layout - buttons next to deck name */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleBackToHome} 
                  className="flex items-center space-x-1.5 px-2 py-1 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 border border-stone-300 dark:border-stone-700 rounded hover:border-stone-400 dark:hover:border-stone-500 transition-colors active:scale-[0.98]"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <div>
                  <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                    {selectedDeckForView.name}
                  </h1>
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-mono">
                    {selectedDeckForView.description || 'No description'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleStudyMode}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-500 transition-colors active:scale-[0.98] border border-orange-500"
                >
                  <PlayIcon className="h-3.5 w-3.5" />
                  <span>Study</span>
                </button>
                {isAuthenticated && isDeckOwner && (
                  <button
                    onClick={handleAddCard}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 text-white rounded text-xs hover:bg-brand-500 transition-colors active:scale-[0.98] border border-brand-500"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
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
              <div className="flex items-center space-x-3 mb-3">
                <button 
                  onClick={handleBackToHome} 
                  className="flex items-center space-x-1.5 px-2 py-1 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 border border-stone-300 dark:border-stone-700 rounded hover:border-stone-400 dark:hover:border-stone-500 transition-colors active:scale-[0.98]"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  {/* <span>Back</span> */}
                </button>
                <div>
                  <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                    {selectedDeckForView.name}
                  </h1>
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-mono">
                    {selectedDeckForView.description || 'No description'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleStudyMode}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-500 transition-colors active:scale-[0.98] border border-orange-500"
                >
                  <PlayIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Study</span>
                </button>
                {isAuthenticated && isDeckOwner && (
                  <button
                    onClick={handleAddCard}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 text-white rounded text-xs hover:bg-brand-500 transition-colors active:scale-[0.98] border border-brand-500"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
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
          <div className="bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 p-4 mb-6 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Filters</h3>
              {searchQuery.trim() !== '' && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="text-xs text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-mono"
                >
                  Clear Search
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 transition-colors"
                />
              </div>
              {/* <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">Sort Order</label>
                <div className="flex items-center space-x-1 bg-zinc-800 rounded-md p-0.5 border border-zinc-700">
                  <button 
                    onClick={() => setLocalSortOrder('oldest')} 
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors active:scale-[0.98] ${sortOrder === 'oldest' ? 'bg-zinc-700 text-stone-100 border border-zinc-600' : 'text-stone-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                  >
                    Oldest First
                  </button>
                  <button 
                    onClick={() => setLocalSortOrder('newest')} 
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors active:scale-[0.98] ${sortOrder === 'newest' ? 'bg-zinc-700 text-stone-100 border border-zinc-600' : 'text-stone-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
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