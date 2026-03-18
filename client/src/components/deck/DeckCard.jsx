import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  RectangleStackIcon, 
  UserIcon,
  LockClosedIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const DeckCard = ({ deck, onDeckClick }) => {
  const { user } = useAuth();
  
  const isOwner = user && (user._id === deck.user?._id || user.username === deck.user?.username);
  
  return (
    <div 
      className="group relative rounded-lg border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900/50 p-4 hover:border-brand-400 dark:hover:border-stone-600 transition-colors cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md"
      onClick={() => onDeckClick(deck)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <RectangleStackIcon className="h-4 w-4 text-stone-500 dark:text-stone-500 flex-shrink-0" />
            <h3 className="font-medium text-stone-900 dark:text-stone-100 text-sm">{deck.name}</h3>
          </div>
          {deck.type && (
            <span className="text-xs font-mono text-stone-600 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
              {deck.type}
            </span>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          {isOwner && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800">
              Owner
            </span>
          )}
          {!deck.isPublic && (
            <LockClosedIcon className="h-3.5 w-3.5 text-stone-400 dark:text-stone-600" />
          )}
        </div>
      </div>
      
      {deck.description && (
        <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-3">
          {deck.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-500 pt-3 border-t border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-1.5">
          <UserIcon className="h-3 w-3" />
          <span className="font-mono">{deck.user?.username || 'Unknown'}</span>
        </div>
        {deck.createdAt && (
          <div className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            <span className="font-mono">
              {new Date(deck.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckCard; 