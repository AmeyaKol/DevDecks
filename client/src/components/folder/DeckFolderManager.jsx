import React, { useState, useEffect } from 'react';
import useFlashcardStore from '../../store/flashcardStore';
import { useAuth } from '../../context/AuthContext';
import { FolderIcon, PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

const DeckFolderManager = ({ deckId, onClose }) => {
  const { user } = useAuth();
  const {
    folders,
    fetchFolders,
    addDeckToFolderStore,
    removeDeckFromFolderStore,
    getFoldersForDeck,
  } = useFlashcardStore();

  const [userFolders, setUserFolders] = useState([]);
  const [deckFolders, setDeckFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch folders and get deck's current folders
        await fetchFolders();
        const currentDeckFolders = await getFoldersForDeck(deckId);
        setDeckFolders(currentDeckFolders);
      } catch (error) {
        console.error('Failed to load folder data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (deckId) {
      loadData();
    }
  }, [deckId, fetchFolders, getFoldersForDeck]);

  // Filter folders to show only user's folders
  useEffect(() => {
    if (folders && user) {
      const filtered = folders.filter(folder => 
        folder.user?._id === user._id || folder.user?.username === user.username
      );
      setUserFolders(filtered);
    }
  }, [folders, user]);

  const isDeckInFolder = (folderId) => {
    return deckFolders.some(folder => folder._id === folderId);
  };

  const handleToggleDeckInFolder = async (folder) => {
    setActionLoading(folder._id);
    try {
      const isInFolder = isDeckInFolder(folder._id);
      
      if (isInFolder) {
        // Remove deck from folder
        await removeDeckFromFolderStore(folder._id, deckId);
        setDeckFolders(prev => prev.filter(f => f._id !== folder._id));
      } else {
        // Add deck to folder
        await addDeckToFolderStore(folder._id, deckId);
        setDeckFolders(prev => [...prev, folder]);
      }
    } catch (error) {
      console.error('Failed to toggle deck in folder:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading folders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-96 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Manage Folders
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Add or remove this deck from your folders
          </p>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-64">
          {userFolders.length === 0 ? (
            <div className="text-center py-4">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don't have any folders yet.
              </p>
              <button
                onClick={() => {
                  onClose();
                  // Navigate to folder creation - you might want to pass this as a prop
                  window.location.href = '/home?tab=manage';
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
              >
                Create Your First Folder
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {userFolders.map((folder) => {
                const isInFolder = isDeckInFolder(folder._id);
                const isLoading = actionLoading === folder._id;
                
                return (
                  <div
                    key={folder._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <FolderIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {folder.name}
                        </div>
                        {folder.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {folder.description}
                          </div>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                            {folder.decks?.length || 0} {(folder.decks?.length || 0) === 1 ? 'deck' : 'decks'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            folder.isPublic 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                              : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                          }`}>
                            {folder.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggleDeckInFolder(folder)}
                      disabled={isLoading}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                        isInFolder
                          ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isInFolder ? 'Remove from folder' : 'Add to folder'}
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : isInFolder ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <PlusIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {deckFolders.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This deck is in {deckFolders.length} {deckFolders.length === 1 ? 'folder' : 'folders'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckFolderManager;




