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

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {flashcard.type}
              </span>
              {!flashcard.isPublic && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Private
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {flashcard.question}
            </h3>
            
            {/* Owner and deck info */}
            <div className="text-sm text-gray-600 space-y-1">
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
              onClick={handleEdit}
              className={`p-2 rounded-md transition-colors ${
                canModify 
                  ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={canModify ? 'Edit flashcard' : 'You can only edit your own flashcards'}
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              className={`p-2 rounded-md transition-colors ${
                canModify 
                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={canModify ? 'Delete flashcard' : 'You can only delete your own flashcards'}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-700 rounded-md transition-colors"
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
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Hint */}
          {flashcard.hint && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <LightBulbIcon className="h-4 w-4 mr-1 text-yellow-500" />
                Hint
              </h4>
              <p className="text-gray-600 bg-yellow-50 p-3 rounded-md border-l-4 border-yellow-200">
                {flashcard.hint}
              </p>
            </div>
          )}

          {/* Code */}
          {flashcard.code && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <CodeBracketIcon className="h-4 w-4 mr-1 text-green-600" />
                Code
              </h4>
              <SyntaxHighlighter
                language="python"
                style={atomDark}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
                }}
              >
                {flashcard.code}
              </SyntaxHighlighter>
            </div>
          )}

          {/* Explanation */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <DocumentTextIcon className="h-4 w-4 mr-1 text-blue-600" />
              Explanation
            </h4>
            <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-4 rounded-md">
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {flashcard.explanation}
              </ReactMarkdown>
            </div>
          </div>

          {/* External Link */}
          {flashcard.link && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <LinkIcon className="h-4 w-4 mr-1 text-purple-600" />
                External Link
              </h4>
              <a
                href={flashcard.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                {flashcard.link}
                <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FlashcardItem;
