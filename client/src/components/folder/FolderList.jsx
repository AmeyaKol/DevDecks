import React from 'react';
import FolderCard from './FolderCard';
import useFlashcardStore from '../../store/flashcardStore';
import { FolderIcon } from '@heroicons/react/24/outline';

const FolderList = ({ onFolderClick, filteredFolders }) => {
  const { isLoadingFolders, searchQuery } = useFlashcardStore();

  if (isLoadingFolders) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!filteredFolders || filteredFolders.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {searchQuery ? 'No folders match your search' : 'No folders found'}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {searchQuery 
            ? 'Try adjusting your search terms or create a new folder.' 
            : 'Get started by creating your first folder.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredFolders.map((folder) => (
        <FolderCard
          key={folder._id}
          folder={folder}
          onFolderClick={onFolderClick}
        />
      ))}
    </div>
  );
};

export default FolderList;




