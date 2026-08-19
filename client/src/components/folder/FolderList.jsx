import React from 'react';
import FolderCard from './FolderCard';
import useFlashcardStore from '../../store/flashcardStore';
import { FolderIcon } from '@heroicons/react/24/outline';

const FolderList = ({ onFolderClick, filteredFolders }) => {
  const { isLoadingFolders, searchQuery } = useFlashcardStore();

  if (isLoadingFolders) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!filteredFolders || filteredFolders.length === 0) {
    return (
      <div className="text-center py-12 border border-stone-300 dark:border-stone-800 rounded-md bg-stone-100 dark:bg-stone-900/50 transition-colors">
        <FolderIcon className="mx-auto h-8 w-8 text-stone-400 dark:text-stone-600 mb-2" />
        <h3 className="text-sm text-stone-600 dark:text-stone-400 mb-1">
          {searchQuery ? 'No folders match your search' : 'No folders found'}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-500">
          {searchQuery
            ? 'Try adjusting your search terms or create a new folder.'
            : 'Get started by creating your first folder.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
