// // client/src/components/FlashcardItem.jsx
// import React, { useState } from "react";
// import ReactMarkdown from "react-markdown";
// import remarkBreaks from "remark-breaks"; // <--- Import remark-breaks
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
// import {
//   ChevronDownIcon,
//   TrashIcon,
//   PencilSquareIcon,
//   LinkIcon,
// } from "@heroicons/react/24/solid";
// import useFlashcardStore from "../store/flashcardStore";

// function FlashcardItem({ card }) {
//   const [showHint, setShowHint] = useState(false);
//   const [showExplanation, setShowExplanation] = useState(false);
//   const [showCode, setShowCode] = useState(false);

//   const { confirmDelete, startEdit } = useFlashcardStore();

//   const ToggleButton = ({ label, isShown, onClick }) => (
//     <button
//       onClick={onClick}
//       className="w-full text-left px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors flex justify-between items-center group"
//     >
//       <span>
//         {isShown ? "Hide" : "Show"} {label}
//       </span>
//       <ChevronDownIcon
//         className={`w-5 h-5 transform transition-transform duration-200 ease-in-out ${
//           isShown ? "rotate-180" : ""
//         }`}
//       />
//     </button>
//   );

//   const ContentWrapper = ({ children }) => (
//     <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 prose prose-sm sm:prose-base max-w-none">
//       {children}
//     </div>
//   );

//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-2xl">
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex items-center flex-grow">
//           {card.link && (
//             <a
//               href={card.link}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="mr-2 text-indigo-600 hover:text-indigo-800"
//               title="Open link"
//               aria-label="Open link related to this flashcard"
//             >
//               <LinkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
//             </a>
//           )}
//           <h3 className="text-xl lg:text-2xl font-semibold text-gray-800 flex-grow pr-2">
//             {card.question}
//           </h3>
//         </div>
//         <div className="flex-shrink-0 flex space-x-2">
//           <button
//             onClick={() => startEdit(card)}
//             className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
//             aria-label="Edit flashcard"
//           >
//             <PencilSquareIcon className="h-6 w-6" />
//           </button>
//           <button
//             onClick={() => confirmDelete(card._id, card.question)}
//             className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
//             aria-label="Delete flashcard"
//           >
//             <TrashIcon className="h-6 w-6" />
//           </button>
//         </div>
//       </div>

//       {card.hint && (
//         <div className="mt-4 border-t border-gray-200 pt-4">
//           <ToggleButton
//             label="Hint"
//             isShown={showHint}
//             onClick={() => setShowHint(!showHint)}
//           />
//           {showHint && (
//             <ContentWrapper>
//               <p className="text-gray-700">{card.hint}</p>
//             </ContentWrapper>
//           )}
//         </div>
//       )}

//       <div className="mt-4 border-t border-gray-200 pt-4">
//         <ToggleButton
//           label="Explanation"
//           isShown={showExplanation}
//           onClick={() => setShowExplanation(!showExplanation)}
//         />
//         {showExplanation && (
//           <ContentWrapper>
//             <ReactMarkdown
//               className="prose-sm sm:prose-base max-w-none"
//               remarkPlugins={[remarkBreaks]} // <--- Add the plugin here
//             >
//               {card.explanation}
//             </ReactMarkdown>
//           </ContentWrapper>
//         )}
//       </div>

//       {card.code && (
//         <div className="mt-4 border-t border-gray-200 pt-4">
//           <ToggleButton
//             label="Code"
//             isShown={showCode}
//             onClick={() => setShowCode(!showCode)}
//           />
//           {showCode && (
//             <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden">
//               <SyntaxHighlighter
//                 language="python"
//                 style={atomDark}
//                 customStyle={{
//                   margin: 0,
//                   padding: "1rem",
//                   fontSize: "0.875rem",
//                   lineHeight: "1.6",
//                   tabSize: 4,
//                   MozTabSize: 4,
//                 }}
//                 showLineNumbers
//                 wrapLines={true}
//                 lineNumberStyle={{ opacity: 0.5 }}
//               >
//                 {card.code}
//               </SyntaxHighlighter>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default FlashcardItem;
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
import useFlashcardStore from "../store/flashcardStore";
import { useAuth } from '../context/AuthContext';

function FlashcardItem({ flashcard }) {
  const { user, isAuthenticated } = useAuth();
  const { startEdit, deleteFlashcard, decks, showModal } = useFlashcardStore();
  
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 cursor-pointer dark:bg-gray-800 dark:border-gray-700"
      onDoubleClick={handleDoubleClick}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
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
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="p-6 border-t border-gray-100 dark:border-gray-700">
          <div className="prose prose-indigo max-w-none dark:prose-invert">
            <h4>Explanation</h4>
            <ReactMarkdown 
              components={{
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={`${className} bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5`} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {flashcard.explanation}
            </ReactMarkdown>

            {flashcard.code && (
              <div className="mt-4">
                <h4>Code</h4>
                <SyntaxHighlighter
                  language="python"
                  style={atomDark}
                  showLineNumbers
                  wrapLines
                >
                  {flashcard.code}
                </SyntaxHighlighter>
              </div>
            )}

            {flashcard.link && (
              <div className="mt-4">
                <h4>Link</h4>
                <a href={flashcard.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">
                  {flashcard.link}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashcardItem;
