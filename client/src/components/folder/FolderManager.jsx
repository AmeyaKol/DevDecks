import React, { useState, useEffect } from "react";
import useFlashcardStore from "../../store/flashcardStore";
import FolderForm from "./FolderForm";
import AnimatedDropdown from "../common/AnimatedDropdown";
import { PencilIcon, TrashIcon, FunnelIcon, FolderIcon } from "@heroicons/react/24/outline";
import { useAuth } from '../../context/AuthContext';

function FolderManager() {
  const { user, isAuthenticated } = useAuth();
  const { 
    folders, 
    startEditFolder, 
    cancelEditFolder, 
    confirmDeleteFolder, 
    editingFolder,
    isLoadingFolders,
  } = useFlashcardStore();
  
  const [selectedType, setSelectedType] = useState('All');

  const typeOptions = ['All', 'Public', 'Private'];

  // Only show folders owned by the current user
  const userFolders = folders.filter(folder =>
    user && (folder.user?._id === user._id || folder.user?.username === user.username)
  );

  // Filter folders by selected type
  const filteredFolders = selectedType === 'All' 
    ? userFolders 
    : selectedType === 'Public'
    ? userFolders.filter(folder => folder.isPublic)
    : userFolders.filter(folder => !folder.isPublic);

  // Check if current user can edit/delete a folder
  const canModifyFolder = (folder) => {
    return isAuthenticated && (
      user?._id === folder.user?._id || 
      folder.user?.username === user?.username
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 dark:bg-gray-800 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <FolderIcon className="h-6 w-6 mr-2 text-amber-600 dark:text-amber-400" />
          Manage Your Folders
        </h2>
        
        {userFolders.length > 0 && (
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <AnimatedDropdown
              options={typeOptions}
              selected={selectedType}
              onSelect={setSelectedType}
              placeholder="Filter by type"
            />
          </div>
        )}
      </div>

      {/* Folder Form */}
      <FolderForm />

      {/* Folders List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Your Folders ({filteredFolders.length})
        </h3>
        
        {isLoadingFolders ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : filteredFolders.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
            {selectedType === 'All' 
              ? 'No folders found. Create your first folder above!' 
              : `No ${selectedType.toLowerCase()} folders found.`
            }
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredFolders.map((folder) => (
              <li
                key={folder._id}
                className="p-4 rounded-md flex justify-between items-center transition-colors bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <FolderIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{folder.name}</p>
                      {folder.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{folder.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          folder.isPublic 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                            : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                        }`}>
                          {folder.isPublic ? 'Public' : 'Private'}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                          {folder.decks?.length || 0} {(folder.decks?.length || 0) === 1 ? 'deck' : 'decks'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          By: {folder.user?.username || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {canModifyFolder(folder) && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEditFolder(folder)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors dark:text-blue-400 dark:hover:bg-blue-900/50"
                      title="Edit folder"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => confirmDeleteFolder(folder._id, folder.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors dark:text-red-400 dark:hover:bg-red-900/50"
                      title="Delete folder"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FolderManager;




