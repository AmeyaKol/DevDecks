import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FolderIcon, 
  UserIcon,
  LockClosedIcon,
  RectangleStackIcon 
} from '@heroicons/react/24/outline';

const FolderCard = ({ folder, onFolderClick }) => {
  const { user } = useAuth();
  
  const isOwner = user && (user._id === folder.user?._id || user.username === folder.user?.username);
  const deckCount = folder.decks?.length || 0;
  
  return (
    <div 
      className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 cursor-pointer transform hover:scale-105 dark:bg-gray-800 dark:border-gray-700"
      onClick={() => onFolderClick(folder)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg dark:bg-amber-900/40">
              <FolderIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{folder.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <UserIcon className="h-4 w-4" />
                <span>{folder.user?.username || 'Unknown'}</span>
                {!folder.isPublic && (
                  <>
                    <LockClosedIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Private</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            {isOwner && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                Owner
              </span>
            )}
          </div>
        </div>
        
        {folder.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {folder.description}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <RectangleStackIcon className="h-4 w-4" />
            <span>{deckCount} {deckCount === 1 ? 'deck' : 'decks'}</span>
          </div>
          
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {folder.createdAt && new Date(folder.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderCard;




