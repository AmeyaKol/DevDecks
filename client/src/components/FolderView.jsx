import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import useFlashcardStore from '../store/flashcardStore';
import DeckCard from './deck/DeckCard';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, FolderIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { fetchFolderById } from '../services/api';
import { isGREMode, getNavigationLinks } from '../utils/greUtils';

const FolderView = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const folderId = searchParams.get('folder');

  // Detect if we're in GRE mode
  const inGREMode = isGREMode(location.pathname);
  const navLinks = getNavigationLinks(location.pathname);

  const {
    decks,
    fetchDecks,
    fetchFlashcards,
    addDeckToFolderStore,
    removeDeckFromFolderStore,
    isLoadingDecks,
  } = useFlashcardStore();

  const [folder, setFolder] = useState(null);
  const [folderDecks, setFolderDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDeckModal, setShowAddDeckModal] = useState(false);
  const [availableDecks, setAvailableDecks] = useState([]);
  const [filteredAvailableDecks, setFilteredAvailableDecks] = useState([]);
  const [deckToRemove, setDeckToRemove] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Ref to track if we've already loaded the folder
  const hasLoadedFolder = useRef(false);

  useEffect(() => {
    // Only fetch decks on mount - flashcards will be fetched based on folder selection
    fetchDecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - only run on mount

  // Load folder data
  useEffect(() => {
    const loadFolder = async () => {
      if (!folderId || hasLoadedFolder.current) return;

      hasLoadedFolder.current = true;
      setLoading(true);

      try {
        const folderData = await fetchFolderById(folderId);
        setFolder(folderData);

        // Get the actual deck objects from the decks in the store
        const deckObjects = folderData.decks || [];
        setFolderDecks(deckObjects);
      } catch (error) {
        console.error('Failed to load folder:', error);
        navigate('/404'); // Navigate to 404 if folder not found
      } finally {
        setLoading(false);
      }
    };

    loadFolder();
  }, [folderId, navigate]);

  // Reset loading state when folderId changes
  useEffect(() => {
    hasLoadedFolder.current = false;
  }, [folderId]);

  // Update available decks for adding
  useEffect(() => {
    if (decks && folder && user) {
      // Get decks that user can access (public + owned) and not already in folder
      const folderDeckIds = new Set((folder.decks || []).map(deck =>
        typeof deck === 'string' ? deck : deck._id
      ));

      const available = decks.filter(deck => {
        // Check if deck is not already in folder
        if (folderDeckIds.has(deck._id)) return false;

        // Check if user can access this deck (public or owned)
        return deck.isPublic || (deck.user && (
          deck.user._id === user._id || deck.user.username === user.username
        ));
      });

      setAvailableDecks(available);
    }
  }, [decks, folder, user]);

  // Filter available decks based on type and search query
  useEffect(() => {
    let filtered = availableDecks;

    // Apply type filter
    if (selectedTypeFilter !== 'All') {
      filtered = filtered.filter(deck => deck.type === selectedTypeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(deck =>
        deck.name.toLowerCase().includes(query) ||
        (deck.description && deck.description.toLowerCase().includes(query)) ||
        (deck.user?.username && deck.user.username.toLowerCase().includes(query))
      );
    }

    setFilteredAvailableDecks(filtered);
  }, [availableDecks, selectedTypeFilter, searchQuery]);

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

  const handleAddDeckToFolder = async (deckId) => {
    try {
      const updatedFolder = await addDeckToFolderStore(folder._id, deckId);
      setFolder(updatedFolder);
      setFolderDecks(updatedFolder.decks || []);
      setShowAddDeckModal(false);
    } catch (error) {
      console.error('Failed to add deck to folder:', error);
    }
  };

  const handleRemoveDeckFromFolder = async (deckId) => {
    try {
      const updatedFolder = await removeDeckFromFolderStore(folder._id, deckId);
      setFolder(updatedFolder);
      setFolderDecks(updatedFolder.decks || []);
      setShowRemoveConfirm(false);
      setDeckToRemove(null);
    } catch (error) {
      console.error('Failed to remove deck from folder:', error);
    }
  };

  const handleRemoveClick = (deck) => {
    setDeckToRemove(deck);
    setShowRemoveConfirm(true);
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirm(false);
    setDeckToRemove(null);
  };

  const handleCloseAddModal = () => {
    setShowAddDeckModal(false);
    setSelectedTypeFilter('All');
    setSearchQuery('');
  };

  // Get unique deck types for filter dropdown
  const getUniqueDeckTypes = () => {
    const types = availableDecks.map(deck => deck.type).filter(Boolean);
    return ['All', ...Array.from(new Set(types))];
  };

  const canModifyFolder = folder && user && (
    folder.user?._id === user._id || folder.user?.username === user.username
  );

  const getDeckFlashcardCount = (deckId) => {
    // This would need to be implemented based on your flashcard counting logic
    return 0; // Placeholder
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="text-center border border-stone-300 dark:border-stone-800 rounded-md bg-white dark:bg-stone-900/50 p-8">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4">
              Folder not found
            </h2>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-brand-600 text-white text-sm rounded hover:bg-brand-500 transition-colors active:scale-[0.98] border border-brand-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-stone-300 dark:border-stone-800 pb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center px-3 py-2 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-400 rounded hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 transition-colors active:scale-[0.98]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-2 text-sm">Back</span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-md">
                <FolderIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                  {folder.name}
                </h1>
                {folder.description && (
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {folder.description}
                  </p>
                )}
                <div className="flex items-center space-x-3 mt-1 text-xs text-stone-500 dark:text-stone-500 font-mono">
                  <span>By {folder.user?.username || 'Unknown'}</span>
                  <span>•</span>
                  <span>{folderDecks.length} {folderDecks.length === 1 ? 'deck' : 'decks'}</span>
                  <span>•</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono border ${
                    folder.isPublic
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700'
                  }`}>
                    {folder.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {canModifyFolder && (
            <button
              onClick={() => setShowAddDeckModal(true)}
              className="flex items-center px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-500 transition-colors active:scale-[0.98] border border-amber-500"
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Add Deck
            </button>
          )}
        </div>

        {/* Decks Grid */}
        {folderDecks.length === 0 ? (
          <div className="text-center py-12 border border-stone-300 dark:border-stone-800 rounded-md bg-white dark:bg-stone-900/50 transition-colors">
            <FolderIcon className="h-12 w-12 text-stone-400 dark:text-stone-600 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-2">
              No decks in this folder
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
              {canModifyFolder
                ? 'Add some decks to get started organizing your content.'
                : 'This folder is empty.'
              }
            </p>
            {canModifyFolder && (
              <button
                onClick={() => setShowAddDeckModal(true)}
                className="px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-500 transition-colors active:scale-[0.98] border border-amber-500"
              >
                Add Your First Deck
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folderDecks.map((deck) => (
              <div key={deck._id} className="relative">
                <DeckCard
                  deck={deck}
                  onDeckClick={handleDeckClick}
                  flashcardCount={getDeckFlashcardCount(deck._id)}
                />
                {canModifyFolder && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveClick(deck);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded bg-white dark:bg-stone-900 text-red-600 dark:text-red-400 border border-stone-300 dark:border-stone-700 hover:border-red-400 dark:hover:border-red-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors active:scale-[0.98] shadow-sm"
                    title="Remove from folder"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Deck Modal */}
      {showAddDeckModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 max-w-lg w-full max-h-[80vh] overflow-hidden transition-colors">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                  Add Deck to Folder
                </h3>
                <button
                  onClick={handleCloseAddModal}
                  className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors active:scale-[0.98]"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50">
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search decks by name, description, or creator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 transition-colors"
                  />
                </div>

                {/* Type Filter */}
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 transition-colors"
                  >
                    {getUniqueDeckTypes().map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-64">
              {availableDecks.length === 0 ? (
                <p className="text-sm text-stone-600 dark:text-stone-400 text-center py-4">
                  No available decks to add.
                </p>
              ) : filteredAvailableDecks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
                    No decks match your search criteria.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedTypeFilter('All');
                      setSearchQuery('');
                    }}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 text-sm"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableDecks.map((deck) => (
                    <button
                      key={deck._id}
                      onClick={() => handleAddDeckToFolder(deck._id)}
                      className="w-full text-left p-3 rounded-md border border-stone-300 dark:border-stone-700 hover:border-brand-400 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors active:scale-[0.98]"
                    >
                      <div className="font-medium text-sm text-stone-900 dark:text-stone-100">
                        {deck.name}
                      </div>
                      {deck.description && (
                        <div className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
                          {deck.description}
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded border border-stone-300 dark:border-stone-700">
                          {deck.type}
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-500 font-mono">
                          By {deck.user?.username || 'Unknown'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove Deck Confirmation Modal */}
      {showRemoveConfirm && deckToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 max-w-md w-full transition-colors">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-md">
                  <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                    Remove Deck from Folder
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                    Are you sure you want to remove this deck?
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 rounded-md p-3 mb-4">
                <div className="font-medium text-sm text-stone-900 dark:text-stone-100">
                  {deckToRemove.name}
                </div>
                {deckToRemove.description && (
                  <div className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                    {deckToRemove.description}
                  </div>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded border border-stone-300 dark:border-stone-700">
                    {deckToRemove.type}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-500 font-mono">
                    By {deckToRemove.user?.username || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCancelRemove}
                  className="flex-1 px-4 py-2 text-sm bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors active:scale-[0.98] border border-stone-300 dark:border-stone-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveDeckFromFolder(deckToRemove._id)}
                  className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-500 transition-colors active:scale-[0.98] border border-red-500"
                >
                  Remove Deck
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderView;
