import React, { useState, useRef, useEffect } from 'react';
import { 
  EllipsisVerticalIcon, 
  AcademicCapIcon, 
  HeartIcon, 
  ArrowDownTrayIcon, 
  FolderIcon 
} from '@heroicons/react/24/outline';

const ActionsDropdown = ({ 
  isFavorite, 
  onToggleFavorite, 
  onStartTest, 
  onExportDeck, 
  onShowFolders,
  isAuthenticated,
  isDeckOwner 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
        <span>More</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            <button
              onClick={() => handleAction(onStartTest)}
              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <AcademicCapIcon className="h-4 w-4" />
              <span>Start Test</span>
            </button>
            
            {isAuthenticated && (
              <button
                onClick={() => handleAction(onToggleFavorite)}
                className={`flex items-center space-x-3 w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isFavorite
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <HeartIcon className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
              </button>
            )}
            
            <button
              onClick={() => handleAction(onExportDeck)}
              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Export Deck</span>
            </button>
            
            {isAuthenticated && (
              <button
                onClick={() => handleAction(onShowFolders)}
                className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FolderIcon className="h-4 w-4" />
                <span>Manage Folders</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsDropdown;
