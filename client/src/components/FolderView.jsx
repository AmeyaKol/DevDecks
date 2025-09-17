import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useFlashcardStore from '../store/flashcardStore';
import DeckCard from './deck/DeckCard';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, FolderIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { fetchFolderById } from '../services/api';

const FolderView = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const folderId = searchParams.get('folder');

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
    fetchDecks();
    fetchFlashcards();
  }, [fetchDecks, fetchFlashcards]);

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
    navigate(`/deckView?deck=${deck._id}`);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Folder not found
            </h2>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-100 rounded-lg dark:bg-amber-900/40">
                <FolderIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {folder.name}
                </h1>
                {folder.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {folder.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>By {folder.user?.username || 'Unknown'}</span>
                  <span>•</span>
                  <span>{folderDecks.length} {folderDecks.length === 1 ? 'deck' : 'decks'}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    folder.isPublic 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                      : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
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
              className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Deck
            </button>
          )}
        </div>

        {/* Decks Grid */}
        {folderDecks.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
            <FolderIcon className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No decks in this folder
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {canModifyFolder 
                ? 'Add some decks to get started organizing your content.'
                : 'This folder is empty.'
              }
            </p>
            {canModifyFolder && (
              <button
                onClick={() => setShowAddDeckModal(true)}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Add Your First Deck
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full text-red-600 hover:text-red-700 transition-colors"
                    title="Remove from folder"
                  >
                    <XMarkIcon className="h-4 w-4" />
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
           <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
             <div className="p-6 border-b border-gray-200 dark:border-gray-700">
               <div className="flex items-center justify-between">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                   Add Deck to Folder
                 </h3>
                 <button
                   onClick={handleCloseAddModal}
                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                 >
                   <XMarkIcon className="h-6 w-6" />
                 </button>
               </div>
             </div>
             
             {/* Search and Filter Controls */}
             <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
               <div className="space-y-3">
                 {/* Search Bar */}
                 <div className="relative">
                   <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <input
                     type="text"
                     placeholder="Search decks by name, description, or creator..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:focus:ring-amber-400"
                   />
                 </div>
                 
                 {/* Type Filter */}
                 <div className="flex items-center space-x-2">
                   <FunnelIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                   <select
                     value={selectedTypeFilter}
                     onChange={(e) => setSelectedTypeFilter(e.target.value)}
                     className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:focus:ring-amber-400"
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
                 <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                   No available decks to add.
                 </p>
               ) : filteredAvailableDecks.length === 0 ? (
                 <div className="text-center py-4">
                   <p className="text-gray-600 dark:text-gray-400 mb-2">
                     No decks match your search criteria.
                   </p>
                   <button
                     onClick={() => {
                       setSelectedTypeFilter('All');
                       setSearchQuery('');
                     }}
                     className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 text-sm"
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
                       className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                     >
                       <div className="font-medium text-gray-900 dark:text-gray-100">
                         {deck.name}
                       </div>
                       {deck.description && (
                         <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                           {deck.description}
                         </div>
                       )}
                       <div className="flex items-center space-x-2 mt-2">
                         <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                           {deck.type}
                         </span>
                         <span className="text-xs text-gray-500 dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/40">
                  <XMarkIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Remove Deck from Folder
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Are you sure you want to remove this deck?
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {deckToRemove.name}
                </div>
                {deckToRemove.description && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {deckToRemove.description}
                  </div>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                    {deckToRemove.type}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    By {deckToRemove.user?.username || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelRemove}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveDeckFromFolder(deckToRemove._id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
