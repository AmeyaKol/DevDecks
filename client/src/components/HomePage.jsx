import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import useFlashcardStore from '../store/flashcardStore';
import DeckList from './deck/DeckList';
import FlashcardList from './flashcard/FlashcardList';
import FlashcardForm from './flashcard/FlashcardForm';
import DeckManager from './deck/DeckManager';
import FolderList from './folder/FolderList';
import FolderManager from './folder/FolderManager';
import Navbar from './Navbar';
import AnimatedDropdown from './common/AnimatedDropdown';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, RectangleStackIcon, FolderIcon, ArrowLeftIcon, MagnifyingGlassIcon, DocumentPlusIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { isGREMode, getAvailableTypes, getNavigationLinks } from '../utils/greUtils';

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('content');
  const [deckSortOrder, setDeckSortOrder] = useState('newest');
  const [localSearchQuery, setLocalSearchQuery] = useState(''); // Local state for search input
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get available types based on current mode
  const inGREMode = isGREMode(location.pathname);
  const FLASHCARD_TYPES = getAvailableTypes(inGREMode);
  const navLinks = getNavigationLinks(location.pathname);

  const {
    fetchDecks,
    fetchFlashcards,
    fetchFolders,
    setSelectedTypeFilter,
    setViewMode,
    setSelectedDeckFilter,
    viewMode,
    selectedTagsFilter,
    setSelectedTagsFilter,
    searchQuery,
    setSearchQuery,
    decks: allDecks,
    flashcards: allFlashcards,
    folders: allFolders,
    allTags: allTagsFromStore,
    selectedTypeFilter,
    selectedDeckFilter,
    clearFilters,
    currentPage,
    setCurrentPage,
    setSortOrder,
    setShowFavoritesOnly,
  } = useFlashcardStore();

  // Filter decks, flashcards, and folders based on GRE mode
  const decks = allDecks.filter(deck => {
    const isGREType = deck.type === 'GRE-Word' || deck.type === 'GRE-MCQ';
    return inGREMode ? isGREType : !isGREType;
  });

  const flashcards = allFlashcards.filter(card => {
    const isGREType = card.type === 'GRE-Word' || card.type === 'GRE-MCQ';
    return inGREMode ? isGREType : !isGREType;
  });

  // Folders don't need GRE mode filtering as they can contain any type of deck
  const folders = allFolders.filter(folder => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return folder.name.toLowerCase().includes(query) || 
           (folder.description && folder.description.toLowerCase().includes(query));
  });

  // Filter allTags based on the filtered flashcards
  const allTagsSet = new Set();
  flashcards.forEach(card => {
    if (card && card.tags && Array.isArray(card.tags)) {
      card.tags.forEach(tag => {
        if (tag && typeof tag === 'string') {
          allTagsSet.add(tag);
        }
      });
    }
  });
  const allTags = Array.from(allTagsSet).sort();

  useEffect(() => {
    // Always fetch decks and folders
    fetchDecks();
    fetchFolders();
    
    // Only fetch flashcards when viewing cards view
    if (viewMode === 'cards') {
      fetchFlashcards({ paginate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]); // Only depend on viewMode, not the store functions

  useEffect(() => {
    const tab = searchParams.get('tab') || 'content';
    const view = searchParams.get('view') || 'decks';
    const type = searchParams.get('type') || 'All';
    const showFavorites = searchParams.get('showFavoritesOnly') === 'true';
    // Normalize the type parameter to match FLASHCARD_TYPES case
    const normalizedType = type.toLowerCase() === 'dsa' ? 'DSA' :
                          type.toLowerCase() === 'gre-word' ? 'GRE-Word' :
                          type.toLowerCase() === 'gre-mcq' ? 'GRE-MCQ' :
                          type.toLowerCase() === 'system-design' ? 'System Design' :
                          type.toLowerCase() === 'behavioral' ? 'Behavioral' :
                          type.toLowerCase() === 'technical-knowledge' ? 'Technical Knowledge' :
                          type.toLowerCase() === 'other' ? 'Other' :
                          FLASHCARD_TYPES.includes(type) ? type : 'All';
    
    // Only clear filters if we're explicitly setting them to default values
    // Don't clear if we have specific filter values from URL
    if (normalizedType === 'All' && !showFavorites) {
      clearFilters();
    }
    
    setActiveTab(tab);
    setViewMode(view);
    setSelectedTypeFilter(normalizedType);
    setShowFavoritesOnly(showFavorites);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams, not the store functions

  // Sync activeTab with currentPage from store (for edit functionality)
  useEffect(() => {
    if (currentPage === 'create') {
      setActiveTab('create');
    }
  }, [currentPage]);

  // Set sort order based on view
  useEffect(() => {
    if (viewMode === 'cards') {
      setSortOrder('newest');
    }
  }, [viewMode, setSortOrder]);

  const updateURL = (key, value) => {
    setSearchParams(prev => {
      prev.set(key, value);
      return prev;
    });
  };

  // Tab navigation handlers
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams(prev => {
      prev.set('tab', tabName);
      return prev;
    });
  };

  // Card/deck toggle handler
  const handleViewModeToggle = (mode) => {
    setViewMode(mode);
    setSearchParams(prev => {
      prev.set('view', mode);
      return prev;
    });
  };

  const handleDeckClick = (deck) => {
    // Check if the deck is a GRE type deck
    const isGREDeck = deck.type === 'GRE-Word' || deck.type === 'GRE-MCQ';
    
    // Navigate to the appropriate deckView route based on deck type
    if (isGREDeck) {
      navigate(`/gre/deckView?deck=${deck._id}`);
    } else {
      navigate(`/deckView?deck=${deck._id}`);
    }
  };

  const handleFolderClick = (folder) => {
    // Navigate to folder view using the appropriate route based on mode
    navigate(`${navLinks.deckView.replace('/deckView', '/folderView')}?folder=${folder._id}`);
  };

  const hasActiveFilters = () => {
    return selectedTypeFilter !== 'All' || selectedDeckFilter !== 'All' || selectedTagsFilter.length > 0 || searchQuery.trim() !== '';
  };

  // Handler for search button click
  const handleSearchClick = () => {
    setSearchQuery(localSearchQuery);
  };

  // Handler for Enter key in search input
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  // Sync local search with store search query when filters are cleared
  useEffect(() => {
    if (searchQuery === '') {
      setLocalSearchQuery('');
    }
  }, [searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
      <div className="flex-1">
        <div className="w-full mx-auto px-4">
          <Navbar />
          <div className="mb-6 flex justify-center border-b border-stone-300 dark:border-stone-800">
            <button
              onClick={() => handleTabChange('content')}
              className={`px-3 py-2 text-sm font-medium flex items-center ${activeTab === 'content' ? 'border-b-2 border-brand-500 text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'}`}
            >
              <EyeIcon className="h-4 w-4 mr-1.5" /> View Content
            </button>
            {isAuthenticated && (
              <>
                <button
                  onClick={() => handleTabChange('create')}
                  className={`px-3 py-2 text-sm font-medium flex items-center ${activeTab === 'create' ? 'border-b-2 border-brand-500 text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'}`}
                >
                  <DocumentPlusIcon className="h-4 w-4 mr-1.5" /> Create Content
                </button>
                <button
                  onClick={() => handleTabChange('manage')}
                  className={`px-3 py-2 text-sm font-medium flex items-center ${activeTab === 'manage' ? 'border-b-2 border-brand-500 text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'}`}
                >
                  <ListBulletIcon className="h-4 w-4 mr-1.5" /> Manage Decks
                </button>
              </>
            )}
          </div>

          {activeTab === 'content' && (
            <>
              <div className="bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 p-3 mb-4 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      All Decks
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-stone-200 dark:bg-stone-800 rounded-md p-0.5 border border-stone-300 dark:border-stone-700">
                      <button onClick={() => handleViewModeToggle('cards')} className={`px-2 py-1 text-xs font-medium rounded flex items-center transition-colors active:scale-[0.98] ${viewMode === 'cards' ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-stone-100 border border-stone-400 dark:border-stone-600' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'}`}>
                        <EyeIcon className="h-3.5 w-3.5 mr-1" /> Cards
                      </button>
                      <button onClick={() => handleViewModeToggle('decks')} className={`px-2 py-1 text-xs font-medium rounded flex items-center transition-colors active:scale-[0.98] ${viewMode === 'decks' ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-stone-100 border border-stone-400 dark:border-stone-600' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'}`}>
                        <RectangleStackIcon className="h-3.5 w-3.5 mr-1" /> Decks
                      </button>
                      <button onClick={() => handleViewModeToggle('folders')} className={`px-2 py-1 text-xs font-medium rounded flex items-center transition-colors active:scale-[0.98] ${viewMode === 'folders' ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-stone-100 border border-stone-400 dark:border-stone-600' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'}`}>
                        <FolderIcon className="h-3.5 w-3.5 mr-1" /> Folders
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {viewMode === 'decks' ? (
                <DeckList onDeckClick={handleDeckClick} filteredDecks={decks} filteredFlashcards={flashcards} />
              ) : viewMode === 'folders' ? (
                <FolderList onFolderClick={handleFolderClick} filteredFolders={folders} />
              ) : (
                <>
                  {/* Card Filters Section */}
                  <div className="bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 p-4 mb-6 transition-colors duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Filters</h3>
                      {hasActiveFilters() && (
                        <button onClick={clearFilters} className="text-xs text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-mono">
                          Clear Filters
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" />
                        <input
                          type="text"
                          placeholder="Search questions..."
                          value={localSearchQuery}
                          onChange={(e) => setLocalSearchQuery(e.target.value)}
                          onKeyDown={handleSearchKeyDown}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 transition-colors"
                        />
                      </div>
                      <button
                        onClick={handleSearchClick}
                        className="px-3 py-2 bg-brand-600 text-white text-sm rounded-md hover:bg-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors active:scale-[0.98] flex items-center gap-1.5"
                      >
                        <MagnifyingGlassIcon className="h-4 w-4" />
                        <span>Search</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Type</label>
                        <AnimatedDropdown
                          value={selectedTypeFilter}
                          onChange={(option) => {
                            setSelectedTypeFilter(option.value);
                            updateURL('type', option.value);
                          }}
                          options={FLASHCARD_TYPES.map(type => ({ value: type, label: type }))}
                          placeholder="Select type"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">Deck</label>
                        <AnimatedDropdown
                          value={selectedDeckFilter}
                          onChange={(option) => {
                            setSelectedDeckFilter(option.value);
                            updateURL('deck', option.value);
                          }}
                          options={[
                            { value: 'All', label: 'All Decks' },
                            ...decks.map(deck => ({ value: deck._id, label: deck.name }))
                          ]}
                          placeholder="Select deck"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">Tags</label>
                      <div className="flex flex-wrap gap-1.5 p-2 border border-stone-300 dark:border-stone-800 rounded-md max-h-32 overflow-y-auto bg-stone-100 dark:bg-stone-950 transition-colors">
                        {(allTags || []).map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              const newTags = selectedTagsFilter.includes(tag)
                                ? selectedTagsFilter.filter(t => t !== tag)
                                : [...selectedTagsFilter, tag];
                              setSelectedTagsFilter(newTags);
                            }}
                            className={`px-2 py-0.5 text-xs font-mono rounded transition-colors active:scale-[0.98] ${selectedTagsFilter.includes(tag) ? 'bg-brand-600 text-white border border-brand-500' : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'}`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <FlashcardList filteredFlashcards={flashcards} />
                </>
              )}
            </>
          )}

          {activeTab === 'create' && isAuthenticated && <FlashcardForm />}
          {activeTab === 'manage' && isAuthenticated && (
            <>
              <DeckManager />
              <FolderManager />
            </>
          )}
        </div>
      </div>
      <div className="w-full mx-auto px-4">
        {/* <Footer /> */}
      </div>
    </div>
  );
};

export default HomePage; 