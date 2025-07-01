import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useFlashcardStore from '../store/flashcardStore';
import DeckList from './deck/DeckList';
import FlashcardList from './flashcard/FlashcardList';
import FlashcardForm from './flashcard/FlashcardForm';
import DeckManager from './deck/DeckManager';
import Navbar from './Navbar';
import AnimatedDropdown from './common/AnimatedDropdown';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, RectangleStackIcon, ArrowLeftIcon, MagnifyingGlassIcon, DocumentPlusIcon, ListBulletIcon } from '@heroicons/react/24/outline';

const FLASHCARD_TYPES = [
  "All", "DSA", "System Design", "Behavioral", "Technical Knowledge", "Other", "GRE-MCQ", "GRE-Word"
];

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('view');
  const [deckSortOrder, setDeckSortOrder] = useState('newest');
  const navigate = useNavigate();

  const {
    fetchDecks,
    fetchFlashcards,
    setSelectedTypeFilter,
    setViewMode,
    setSelectedDeckFilter,
    viewMode,
    selectedTagsFilter,
    setSelectedTagsFilter,
    searchQuery,
    setSearchQuery,
    decks,
    allTags,
    selectedTypeFilter,
    selectedDeckFilter,
    clearFilters,
    currentPage,
    setCurrentPage,
    setSortOrder,
  } = useFlashcardStore();

  useEffect(() => {
    fetchDecks();
    fetchFlashcards();
  }, [fetchDecks, fetchFlashcards]);

  useEffect(() => {
    const view = searchParams.get('view') || 'decks';
    const type = searchParams.get('type') || 'All';
    
    // Normalize the type parameter to match FLASHCARD_TYPES case
    const normalizedType = type.toLowerCase() === 'dsa' ? 'DSA' :
                          type.toLowerCase() === 'gre-word' ? 'GRE-Word' :
                          type.toLowerCase() === 'gre-mcq' ? 'GRE-MCQ' :
                          type.toLowerCase() === 'system-design' ? 'System Design' :
                          type.toLowerCase() === 'behavioral' ? 'Behavioral' :
                          type.toLowerCase() === 'technical-knowledge' ? 'Technical Knowledge' :
                          type.toLowerCase() === 'other' ? 'Other' :
                          FLASHCARD_TYPES.includes(type) ? type : 'All';
    
    setViewMode(view);
    setSelectedTypeFilter(normalizedType);
  }, [searchParams, setViewMode, setSelectedTypeFilter]);

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

  const handleViewModeToggle = (mode) => {
    setViewMode(mode);
    updateURL('view', mode);
  };

  const handleDeckClick = (deck) => {
    navigate(`/deckView?deck=${deck._id}`);
  };

  const hasActiveFilters = () => {
    return selectedTypeFilter !== 'All' || selectedDeckFilter !== 'All' || selectedTagsFilter.length > 0 || searchQuery.trim() !== '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <div className="flex-1">
        <div className="container mx-auto px-4">
          <Navbar />
          <div className="mb-8 flex justify-center border-b border-gray-200 dark:border-gray-700">
            <button onClick={() => {
              setActiveTab('view');
              setCurrentPage('view');
            }} className={`px-4 py-2 text-sm font-medium flex items-center ${activeTab === 'view' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
              <EyeIcon className="h-5 w-5 mr-2" /> View Content
            </button>
            {isAuthenticated && (
              <>
                <button onClick={() => {
                  setActiveTab('create');
                  setCurrentPage('create');
                }} className={`px-4 py-2 text-sm font-medium flex items-center ${activeTab === 'create' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                  <DocumentPlusIcon className="h-5 w-5 mr-2" /> Create Content
                </button>
                <button onClick={() => {
                  setActiveTab('manage');
                  setCurrentPage('manage');
                }} className={`px-4 py-2 text-sm font-medium flex items-center ${activeTab === 'manage' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                  <ListBulletIcon className="h-5 w-5 mr-2" /> Manage Decks
                </button>
              </>
            )}
          </div>

          {activeTab === 'view' && (
            <>
              <div className="bg-white rounded-lg shadow p-4 mb-6 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200">
                      {viewMode === 'decks' ? 'All Decks' : 'All Cards'}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
                      <button onClick={() => handleViewModeToggle('cards')} className={`px-2 py-1 text-xs font-medium rounded-md flex items-center ${viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                        <EyeIcon className="h-4 w-4 mr-1" /> Cards
                      </button>
                      <button onClick={() => handleViewModeToggle('decks')} className={`px-2 py-1 text-xs font-medium rounded-md flex items-center ${viewMode === 'decks' ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                        <RectangleStackIcon className="h-4 w-4 mr-1" /> Decks
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {viewMode === 'cards' && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Filters</h3>
                    {hasActiveFilters() && (
                      <button onClick={clearFilters} className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                        Clear Filters
                      </button>
                    )}
                  </div>
                  
                  <div className="relative mb-4">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Type</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Deck</label>
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

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Tags</label>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-32 overflow-y-auto">
                      {(allTags || []).map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            const newTags = selectedTagsFilter.includes(tag)
                              ? selectedTagsFilter.filter(t => t !== tag)
                              : [...selectedTagsFilter, tag];
                            setSelectedTagsFilter(newTags);
                          }}
                          className={`px-2 py-1 text-xs rounded-full ${selectedTagsFilter.includes(tag) ? 'bg-indigo-600 text-white dark:text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-white'}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'decks' && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Deck Filters</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Sort Order</label>
                      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
                        <button 
                          onClick={() => setDeckSortOrder('newest')} 
                          className={`px-3 py-1 text-xs font-medium rounded-md ${deckSortOrder === 'newest' ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                          Newest First
                        </button>
                        <button 
                          onClick={() => setDeckSortOrder('oldest')} 
                          className={`px-3 py-1 text-xs font-medium rounded-md ${deckSortOrder === 'oldest' ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                          Oldest First
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'decks' ? (
                <DeckList onDeckClick={handleDeckClick} />
              ) : (
                <FlashcardList />
              )}
            </>
          )}

          {activeTab === 'create' && isAuthenticated && <FlashcardForm />}
          {activeTab === 'manage' && isAuthenticated && <DeckManager />}
        </div>
      </div>
      <div className="container mx-auto px-4">
        {/* <Footer /> */}
      </div>
    </div>
  );
};

export default HomePage; 