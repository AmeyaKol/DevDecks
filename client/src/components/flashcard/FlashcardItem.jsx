// client/src/components/FlashcardItem.jsx
import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  ChevronDownIcon,
  TrashIcon,
  PencilSquareIcon,
  LinkIcon,
  TagIcon,
  RectangleStackIcon,
  ChevronUpIcon,
  LightBulbIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/solid";
import useFlashcardStore from "../../store/flashcardStore";
import { useAuth } from '../../context/AuthContext';

function FlashcardItem({ flashcard }) {
  const { user, isAuthenticated } = useAuth();
  const { startEdit, deleteFlashcard, decks, showModal } = useFlashcardStore();
  
  const [isExpanded, setIsExpanded] = useState(false);

  // Debug logging
  console.log('FlashcardItem - flashcard data:', {
    id: flashcard?._id,
    question: flashcard?.question?.substring(0, 50) + '...',
    hasExplanation: !!flashcard?.explanation,
    hasProblemStatement: !!flashcard?.problemStatement,
    problemStatement: flashcard?.problemStatement?.substring(0, 100) + '...'
  });

  // Move useMemo before any early returns to follow React hooks rules
  const cardDeckNames = useMemo(() => {
    if (!flashcard?.decks || flashcard.decks.length === 0) return 'No decks';
    
    return flashcard.decks.map(deckRef => {
      if (typeof deckRef === 'string') {
        const foundDeck = decks.find(d => d._id === deckRef);
        return foundDeck ? foundDeck.name : 'Unknown Deck';
      } else if (deckRef && deckRef.name) {
        return deckRef.name;
      } else {
        return 'Unknown Deck';
      }
    }).join(', ');
  }, [flashcard?.decks, decks]);

  // Safety check for undefined flashcard (after hooks)
  if (!flashcard) {
    console.error('FlashcardItem received undefined flashcard prop');
    return null;
  }

  // Check if current user can edit/delete this flashcard
  const canModify = isAuthenticated && (
    user?._id === flashcard.user?._id || 
    user?.isAdmin ||
    flashcard.user?.username === user?.username
  );

  const handleEdit = () => {
    if (!canModify) {
      showModal(
        'Access Denied',
        'You can only edit your own flashcards.',
        null,
        'OK'
      );
      return;
    }
    startEdit(flashcard);
  };

  const handleDelete = () => {
    if (!canModify) {
      showModal(
        'Access Denied',
        'You can only delete your own flashcards.',
        null,
        'OK'
      );
      return;
    }

    showModal(
      'Delete Flashcard',
      'Are you sure you want to delete this flashcard? This action cannot be undone.',
      () => deleteFlashcard(flashcard._id),
      'Delete',
      'Cancel'
    );
  };

  return (
    <div className="relative bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      {/* Header */}
      <div 
        className="relative z-10 p-6 border-b border-gray-100 dark:border-gray-700 cursor-pointer"
        onClick={(e) => {
          if (e.detail === 2) { // Check for double click
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                {flashcard.type}
              </span>
              {!flashcard.isPublic && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  Private
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-gray-100">
              {flashcard.question}
            </h3>
            
            {/* Owner and deck info */}
            <div className="text-sm text-gray-600 space-y-1 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="font-medium">By:</span>
                <span>{flashcard.user?.username || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Decks:</span>
                <span>{cardDeckNames}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className={`p-2 rounded-md transition-colors ${
                canModify 
                  ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-gray-700' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={canModify ? 'Edit flashcard' : 'You can only edit your own flashcards'}
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className={`p-2 rounded-md transition-colors ${
                canModify 
                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-gray-700' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={canModify ? 'Delete flashcard' : 'You can only delete your own flashcards'}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-700 rounded-md transition-colors dark:text-gray-400 dark:hover:bg-gray-700"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Tags */}
        {flashcard.tags && flashcard.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {flashcard.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Double-click hint */}
        <div className="mt-2 text-xs text-gray-400">
          Double-click to {isExpanded ? 'collapse' : 'expand'}
        </div>
      </div>

      {/* Collapsible Content */}
      <div 
        className={`relative z-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 space-y-6">
          {flashcard.hint && (
            <div className="flex items-start gap-2">
              <LightBulbIcon className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-300 dark:border-yellow-600 p-3 rounded-md text-gray-800 dark:text-yellow-100 w-full">
                Hint: {flashcard.hint}
              </div>
            </div>
          )}

          {flashcard.problemStatement && (
            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Problem Statement</h4>
              <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{flashcard.problemStatement}</ReactMarkdown>
              </div>
            </div>
          )}

          {flashcard.explanation && (
            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Explanation</h4>
              <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{flashcard.explanation}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Code & Link */}
          {flashcard.code && (
            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Code</h4>
              <div className="overflow-x-auto">
                <SyntaxHighlighter 
                  language="python" 
                  style={atomDark} 
                  showLineNumbers 
                  wrapLines
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.375rem',
                  }}
                >
                  {flashcard.code}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {flashcard.link && (
            <div>
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Link</h4>
              <a 
                href={flashcard.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-indigo-600 hover:underline dark:text-indigo-400 break-all"
              >
                {flashcard.link}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FlashcardItem;
