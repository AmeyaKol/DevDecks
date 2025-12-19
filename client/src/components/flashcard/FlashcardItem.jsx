// client/src/components/FlashcardItem.jsx
import React, { useState, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
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
  BookOpenIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import useFlashcardStore from "../../store/flashcardStore";
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Add this custom link renderer for ReactMarkdown
const markdownComponents = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

function FlashcardItem({ flashcard }) {
  const { user, isAuthenticated } = useAuth();
  const { startEdit, deleteFlashcard, decks, showModal } = useFlashcardStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMCQAnswer, setShowMCQAnswer] = useState(false);
  const lastTapRef = useRef(0);

  // Track last pointer type for hint text
  const [lastPointerType, setLastPointerType] = useState('mouse');

  // Debug logging
  console.log('FlashcardItem - flashcard data:', {
    id: flashcard?._id,
    question: flashcard?.question?.substring(0, 50) + '...',
    hasExplanation: !!flashcard?.explanation,
    hasProblemStatement: !!flashcard?.problemStatement,
    type: flashcard?.type,
    metadata: flashcard?.metadata
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
    // Try to get the deck for this card (first deck if multiple)
    const deckId = flashcard.decks && flashcard.decks.length > 0
      ? (typeof flashcard.decks[0] === 'string' ? flashcard.decks[0] : flashcard.decks[0]._id)
      : '';
    // Use the card's type
    const type = flashcard.type || '';
    // Redirect to create tab for this deck and type
    navigate(`/home?tab=create${deckId ? `&deck=${deckId}` : ''}${type ? `&type=${type}` : ''}`);
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

  const handleLookUp = () => {
    const searchQuery = encodeURIComponent(`${flashcard.question} meaning, example use, root word, synonyms, antonyms`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  // Detect if device is touch-capable
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  // Use pointer events to detect input type for hint
  const handlePointerDown = (e) => {
    setLastPointerType(e.pointerType);
  };

  // Desktop & touch: always allow single click to expand/collapse
  const handleExpandToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  // Mobile: double-tap handler (optional, for legacy support)
  const handleTouchEnd = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault();
      setIsExpanded((prev) => !prev);
    }
    lastTapRef.current = now;
  };

  // Helper function to render GRE-Word card content
  const renderGREWordContent = () => {
    const metadata = flashcard.metadata || {};
    
    return (
      <div className="space-y-4">
        {/* Look Up Button */}
        <div className="flex justify-end">
          <button
            onClick={handleLookUp}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            Look Up
          </button>
        </div>

        {/* Definition */}
        <div>
          <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5 text-blue-500" />
            Definition
          </h4>
          <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
            <ReactMarkdown components={markdownComponents}>{flashcard.explanation}</ReactMarkdown>
          </div>
        </div>

        {/* Example Sentence */}
        {metadata.exampleSentence && (
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example Sentence</h4>
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-300 dark:border-blue-600 p-3 rounded-md text-gray-800 dark:text-blue-100">
              <em>"{metadata.exampleSentence}"</em>
            </div>
          </div>
        )}

        {/* Word Root/Etymology */}
        {metadata.wordRoot && (
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Word Root / Etymology</h4>
            <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-300 dark:border-green-600 p-3 rounded-md text-gray-800 dark:text-green-100">
              {metadata.wordRoot}
            </div>
          </div>
        )}

        {/* Similar Words */}
        {metadata.similarWords && metadata.similarWords.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Similar Words</h4>
            <div className="flex flex-wrap gap-2">
              {metadata.similarWords.map((word, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                >
                  {word.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function to render GRE-MCQ card content
  const renderGREMCQContent = () => {
    const metadata = flashcard.metadata || {};
    const options = metadata.options || [];
    const correctOptions = options.filter(option => option.isCorrect);
    const incorrectOptionClasses = 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white';
    
    return (
      <div className="space-y-4">
        {/* Look Up Button */}
        <div className="flex justify-end">
          <button
            onClick={handleLookUp}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            Look Up
          </button>
        </div>

        {/* MCQ Options */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-indigo-500" />
            Options ({metadata.mcqType === 'single-correct' ? 'Single Correct' : 'Multiple Correct'})
          </h4>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border-2 transition-colors ${
                  showMCQAnswer
                    ? option.isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : incorrectOptionClasses
                    : `${incorrectOptionClasses} hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`
                }`}
                onClick={() => !showMCQAnswer && setShowMCQAnswer(true)}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option.text}</span>
                  {showMCQAnswer && option.isCorrect && (
                    <span className="text-green-600 dark:text-green-400 font-medium">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {!showMCQAnswer && (
            <button
              onClick={() => setShowMCQAnswer(true)}
              className="mt-3 w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Show Answer
            </button>
          )}
          
          {showMCQAnswer && (
            <button
              onClick={() => setShowMCQAnswer(false)}
              className="mt-3 w-full py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Hide Answer
            </button>
          )}
        </div>

        {/* Answer Summary */}
        {showMCQAnswer && (
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Correct Answer(s)</h4>
            <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-300 dark:border-green-600 p-3 rounded-md">
              <div className="space-y-1">
                {correctOptions.map((option, index) => (
                  <div key={index} className="text-green-800 dark:text-green-200 font-medium">
                    {String.fromCharCode(65 + options.indexOf(option))}. {option.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        {showMCQAnswer && flashcard.explanation && (
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Explanation</h4>
            <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
              <ReactMarkdown components={markdownComponents}>{flashcard.explanation}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function to render standard card content
  const renderStandardContent = () => (
    <div className="space-y-6">
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
            <ReactMarkdown components={markdownComponents}>{flashcard.problemStatement}</ReactMarkdown>
          </div>
        </div>
      )}

      {flashcard.explanation && (
        <div>
          <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Explanation</h4>
          <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
            <ReactMarkdown components={markdownComponents}>{flashcard.explanation}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Code & Link */}
      {flashcard.code && (
        <div>
          <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Code</h4>
          <div className="overflow-x-auto">
            <SyntaxHighlighter 
              language={flashcard.language || 'python'} 
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
  );

  // Helper to extract timestamp from YouTube URL (supports &t=123s, &t=123, &start=123)
  const extractTimestampFromUrl = (url) => {
    if (!url) return null;
    // Match &t=123s or &t=123 or &start=123
    let match = url.match(/[?&]t=(\d+)s?/);
    if (match) return parseInt(match[1]);
    match = url.match(/[?&]start=(\d+)/);
    if (match) return parseInt(match[1]);
    return null;
  };

  // Helper to extract the first YouTube link from explanation, problem statement, or link
  const extractFirstYouTubeLink = (flashcard) => {
    const youtubeRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s]*v=|youtu\.be\/)([\w-]+[^\s]*))/i;
    // Check link field first (for split cards with timestamp)
    let match = flashcard.link && flashcard.link.match(youtubeRegex);
    if (match) return match[1];
    // Check explanation
    match = flashcard.explanation && flashcard.explanation.match(youtubeRegex);
    if (match) return match[1];
    // Check problem statement
    match = flashcard.problemStatement && flashcard.problemStatement.match(youtubeRegex);
    if (match) return match[1];
    return null;
  };

  const firstYouTubeLink = extractFirstYouTubeLink(flashcard);
  let videoId = null;
  let videoStartTime = null;
  if (firstYouTubeLink) {
    const idMatch = firstYouTubeLink.match(/(?:v=|be\/)([\w-]+)/);
    videoId = idMatch ? idMatch[1] : null;
    // Extract timestamp for auto-start
    videoStartTime = extractTimestampFromUrl(firstYouTubeLink);
  }

  return (
    <div className="relative bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      {/* Header */}
      <div 
        className="relative z-10 p-6 border-b border-gray-100 dark:border-gray-700 cursor-pointer"
        onClick={handleExpandToggle}
        onPointerDown={handlePointerDown}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                flashcard.type === 'GRE-Word' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                  : flashcard.type === 'GRE-MCQ'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
              }`}>
                {flashcard.type}
              </span>
              {!flashcard.isPublic && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  Private
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-gray-100">
              {flashcard.type === 'GRE-Word' 
                ? `${flashcard.question}` 
                : flashcard.question
              }
            </h3>
            
            {/* Show definition preview for GRE-Word cards */}
            {flashcard.type === 'GRE-Word' && flashcard.explanation && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {flashcard.explanation.length > 100 
                  ? flashcard.explanation.substring(0, 100) + '...'
                  : flashcard.explanation
                }
              </p>
            )}
            
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
        
        {/* Double-click/tap hint */}
        <div className="mt-2 text-xs text-gray-400">
          {lastPointerType === 'touch'
            ? `Tap to ${isExpanded ? 'collapse' : 'expand'}`
            : `Click to ${isExpanded ? 'collapse' : 'expand'}`}
        </div>
      </div>

      {/* Collapsible Content */}
      <div 
        className={`relative z-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 border-t border-gray-100 dark:border-gray-700">
          {videoId && (
            <div className="mt-6 flex justify-center">
              <div className="w-[80vw] max-w-xl sm:w-1/2">
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0${videoStartTime ? `&start=${videoStartTime}` : ''}`}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
          {flashcard.type === 'GRE-Word' && renderGREWordContent()}
          {flashcard.type === 'GRE-MCQ' && renderGREMCQContent()}
          {!['GRE-Word', 'GRE-MCQ'].includes(flashcard.type) && renderStandardContent()}
        </div>
      </div>
    </div>
  );
}

export default FlashcardItem;
