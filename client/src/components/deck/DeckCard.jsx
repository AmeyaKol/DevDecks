import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  RectangleStackIcon, 
  UserIcon,
  LockClosedIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const DeckCard = ({ deck, flashcardCount, onDeckClick }) => {
  const { user } = useAuth();
  
  const isOwner = user && (user._id === deck.user?._id || user.username === deck.user?.username);
  
  return (
    <div 
      className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 cursor-pointer transform hover:scale-105 dark:bg-gray-800 dark:border-gray-700"
      onClick={() => onDeckClick(deck)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900/40">
              <RectangleStackIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{deck.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <UserIcon className="h-4 w-4" />
                <span>{deck.user?.username || 'Unknown'}</span>
                {!deck.isPublic && (
                  <>
                    <LockClosedIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Private</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {isOwner && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
              Owner
            </span>
          )}
        </div>
        
        {deck.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 dark:text-gray-400">
            {deck.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <RectangleStackIcon className="h-4 w-4" />
            <span>{flashcardCount} card{flashcardCount !== 1 ? 's' : ''}</span>
          </div>
          
          {deck.createdAt && (
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>
                {new Date(deck.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckCard; 