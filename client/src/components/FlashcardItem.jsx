// // import React, { useState } from "react";
// // import ReactMarkdown from "react-markdown";
// // import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// // import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"; // Choose a style
// // import { ChevronDownIcon, TrashIcon } from "@heroicons/react/24/solid";
// // import useFlashcardStore from "../store/flashcardStore";

// // function FlashcardItem({ card }) {
// //   const [showHint, setShowHint] = useState(false);
// //   const [showExplanation, setShowExplanation] = useState(false);
// //   const [showCode, setShowCode] = useState(false);

// //   const { confirmDelete } = useFlashcardStore();

// //   const ToggleButton = ({ label, isShown, onClick }) => (
// //     <button
// //       onClick={onClick}
// //       className="w-full text-left px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors flex justify-between items-center group"
// //     >
// //       <span>
// //         {isShown ? "Hide" : "Show"} {label}
// //       </span>
// //       <ChevronDownIcon
// //         className={`w-5 h-5 transform transition-transform duration-200 ease-in-out ${
// //           isShown ? "rotate-180" : ""
// //         }`}
// //       />
// //     </button>
// //   );

// //   const ContentWrapper = ({ children }) => (
// //     <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 prose prose-sm sm:prose-base max-w-none">
// //       {children}
// //     </div>
// //   );

// //   return (
// //     <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-2xl">
// //       <div className="flex justify-between items-start mb-4">
// //         <h3 className="text-xl lg:text-2xl font-semibold text-gray-800 flex-grow pr-4">
// //           {card.question}
// //         </h3>
// //         <button
// //           onClick={() => confirmDelete(card._id, card.question)}
// //           className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
// //           aria-label="Delete flashcard"
// //         >
// //           <TrashIcon className="h-6 w-6" />
// //         </button>
// //       </div>

// //       {card.hint && (
// //         <div className="mt-4 border-t border-gray-200 pt-4">
// //           <ToggleButton
// //             label="Hint"
// //             isShown={showHint}
// //             onClick={() => setShowHint(!showHint)}
// //           />
// //           {showHint && (
// //             <ContentWrapper>
// //               <p className="text-gray-700">{card.hint}</p>
// //             </ContentWrapper>
// //           )}
// //         </div>
// //       )}

// //       <div className="mt-4 border-t border-gray-200 pt-4">
// //         <ToggleButton
// //           label="Explanation"
// //           isShown={showExplanation}
// //           onClick={() => setShowExplanation(!showExplanation)}
// //         />
// //         {showExplanation && (
// //           <ContentWrapper>
// //             <ReactMarkdown className="prose-sm sm:prose-base max-w-none">
// //               {card.explanation}
// //             </ReactMarkdown>
// //           </ContentWrapper>
// //         )}
// //       </div>

// //       {card.code && (
// //         <div className="mt-4 border-t border-gray-200 pt-4">
// //           <ToggleButton
// //             label="Code"
// //             isShown={showCode}
// //             onClick={() => setShowCode(!showCode)}
// //           />
// //           {showCode && (
// //             <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden">
// //               <SyntaxHighlighter
// //                 language="python"
// //                 style={atomDark}
// //                 customStyle={{
// //                   margin: 0,
// //                   padding: "1rem",
// //                   fontSize: "0.875rem",
// //                 }}
// //                 showLineNumbers // Optional: show line numbers
// //                 wrapLines={true} // Optional: wrap long lines
// //               >
// //                 {card.code}
// //               </SyntaxHighlighter>
// //             </div>
// //           )}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default FlashcardItem;
// // client/src/components/FlashcardItem.jsx
// import React, { useState } from "react";
// import ReactMarkdown from "react-markdown";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
// import {
//   ChevronDownIcon,
//   TrashIcon,
//   PencilSquareIcon,
//   LinkIcon,
// } from "@heroicons/react/24/solid"; // Import PencilSquareIcon and LinkIcon
// import useFlashcardStore from "../store/flashcardStore";

// function FlashcardItem({ card }) {
//   const [showHint, setShowHint] = useState(false);
//   const [showExplanation, setShowExplanation] = useState(false);
//   const [showCode, setShowCode] = useState(false);

//   const { confirmDelete, startEdit } = useFlashcardStore(); // Get startEdit action

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
//             onClick={() => startEdit(card)} // Call startEdit with the current card
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
//             <ReactMarkdown className="prose-sm sm:prose-base max-w-none">
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
//                 }}
//                 showLineNumbers
//                 wrapLines={true}
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
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks"; // <--- Import remark-breaks
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  ChevronDownIcon,
  TrashIcon,
  PencilSquareIcon,
  LinkIcon,
} from "@heroicons/react/24/solid";
import useFlashcardStore from "../store/flashcardStore";

function FlashcardItem({ card }) {
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const { confirmDelete, startEdit } = useFlashcardStore();

  const ToggleButton = ({ label, isShown, onClick }) => (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors flex justify-between items-center group"
    >
      <span>
        {isShown ? "Hide" : "Show"} {label}
      </span>
      <ChevronDownIcon
        className={`w-5 h-5 transform transition-transform duration-200 ease-in-out ${
          isShown ? "rotate-180" : ""
        }`}
      />
    </button>
  );

  const ContentWrapper = ({ children }) => (
    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 prose prose-sm sm:prose-base max-w-none">
      {children}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-2xl">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center flex-grow">
          {card.link && (
            <a
              href={card.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-2 text-indigo-600 hover:text-indigo-800"
              title="Open link"
              aria-label="Open link related to this flashcard"
            >
              <LinkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
          )}
          <h3 className="text-xl lg:text-2xl font-semibold text-gray-800 flex-grow pr-2">
            {card.question}
          </h3>
        </div>
        <div className="flex-shrink-0 flex space-x-2">
          <button
            onClick={() => startEdit(card)}
            className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
            aria-label="Edit flashcard"
          >
            <PencilSquareIcon className="h-6 w-6" />
          </button>
          <button
            onClick={() => confirmDelete(card._id, card.question)}
            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
            aria-label="Delete flashcard"
          >
            <TrashIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {card.hint && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <ToggleButton
            label="Hint"
            isShown={showHint}
            onClick={() => setShowHint(!showHint)}
          />
          {showHint && (
            <ContentWrapper>
              <p className="text-gray-700">{card.hint}</p>
            </ContentWrapper>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-gray-200 pt-4">
        <ToggleButton
          label="Explanation"
          isShown={showExplanation}
          onClick={() => setShowExplanation(!showExplanation)}
        />
        {showExplanation && (
          <ContentWrapper>
            <ReactMarkdown
              className="prose-sm sm:prose-base max-w-none"
              remarkPlugins={[remarkBreaks]} // <--- Add the plugin here
            >
              {card.explanation}
            </ReactMarkdown>
          </ContentWrapper>
        )}
      </div>

      {card.code && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <ToggleButton
            label="Code"
            isShown={showCode}
            onClick={() => setShowCode(!showCode)}
          />
          {showCode && (
            <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden">
              <SyntaxHighlighter
                language="python"
                style={atomDark}
                customStyle={{
                  margin: 0,
                  padding: "1rem",
                  fontSize: "0.875rem",
                  lineHeight: "1.6",
                  tabSize: 4,
                  MozTabSize: 4,
                }}
                showLineNumbers
                wrapLines={true}
                lineNumberStyle={{ opacity: 0.5 }}
              >
                {card.code}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FlashcardItem;
