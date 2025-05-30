// // // import React, { useState, useEffect, useRef } from "react"; // Import useRef
// // // import useFlashcardStore from "../store/flashcardStore";
// // // import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/solid";

// // // function FlashcardForm() {
// // //   const {
// // //     addFlashcard,
// // //     editingFlashcard,
// // //     updateFlashcard,
// // //     cancelEdit,
// // //     showModal,
// // //   } = useFlashcardStore();

// // //   const [question, setQuestion] = useState("");
// // //   const [hint, setHint] = useState("");
// // //   const [explanation, setExplanation] = useState("");
// // //   const [code, setCode] = useState("");
// // //   const [link, setLink] = useState("");
// // //   const [formError, setFormError] = useState("");

// // //   const codeTextareaRef = useRef(null); // Ref for the code textarea

// // //   const isEditMode = !!editingFlashcard;

// // //   useEffect(() => {
// // //     if (isEditMode && editingFlashcard) {
// // //       setQuestion(editingFlashcard.question);
// // //       setHint(editingFlashcard.hint || "");
// // //       setExplanation(editingFlashcard.explanation);
// // //       setCode(editingFlashcard.code || "");
// // //       setLink(editingFlashcard.link || "");
// // //       setFormError("");
// // //     } else {
// // //       setQuestion("");
// // //       setHint("");
// // //       setExplanation("");
// // //       setCode("");
// // //       setLink("");
// // //       setFormError("");
// // //     }
// // //   }, [editingFlashcard, isEditMode]);

// // //   const handleCodeKeyDown = (event) => {
// // //     if (event.key === "Tab") {
// // //       event.preventDefault(); // Prevent default tab behavior (focus change)

// // //       const textarea = codeTextareaRef.current;
// // //       if (textarea) {
// // //         const start = textarea.selectionStart;
// // //         const end = textarea.selectionEnd;
// // //         const value = textarea.value;

// // //         // Insert tab character
// // //         const newValue =
// // //           value.substring(0, start) + "\t" + value.substring(end);
// // //         setCode(newValue);

// // //         // After state update, set cursor position
// // //         // Use a timeout to ensure the DOM has updated after React's state change
// // //         setTimeout(() => {
// // //           if (codeTextareaRef.current) {
// // //             codeTextareaRef.current.selectionStart =
// // //               codeTextareaRef.current.selectionEnd = start + 1;
// // //           }
// // //         }, 0);
// // //       }
// // //     }
// // //   };

// // //   const handleSubmit = async (e) => {
// // //     e.preventDefault();
// // //     setFormError("");

// // //     if (!question.trim() || !explanation.trim()) {
// // //       const errorMsg = "Question and Explanation fields are required.";
// // //       setFormError(errorMsg);
// // //       showModal("Input Error", errorMsg);
// // //       return;
// // //     }

// // //     const flashcardData = { question, hint, explanation, code, link };

// // //     try {
// // //       if (isEditMode) {
// // //         await updateFlashcard(editingFlashcard._id, flashcardData);
// // //       } else {
// // //         await addFlashcard(flashcardData);
// // //       }
// // //       if (!isEditMode) {
// // //         setQuestion("");
// // //         setHint("");
// // //         setExplanation("");
// // //         setCode("");
// // //         setLink("");
// // //       }
// // //       if (!isEditMode) {
// // //         document.getElementById("question").focus();
// // //       }
// // //     } catch (error) {
// // //       console.error("Failed to save flashcard from form:", error);
// // //       setFormError(
// // //         error.response?.data?.message ||
// // //           error.message ||
// // //           "Failed to save flashcard."
// // //       );
// // //     }
// // //   };

// // //   const commonInputClasses =
// // //     "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 text-base";
// // //   const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";

// // //   return (
// // //     <section
// // //       id="flashcard-form-section"
// // //       className="mb-10 p-6 bg-white rounded-lg shadow-xl"
// // //     >
// // //       <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">
// // //         {isEditMode ? "Edit Flashcard" : "Create New Flashcard"}
// // //       </h2>
// // //       {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
// // //       <form onSubmit={handleSubmit}>
// // //         {/* Question, Hint, Explanation fields remain the same */}
// // //         <div className="mb-5">
// // //           <label htmlFor="question" className={commonLabelClasses}>
// // //             Question <span className="text-red-500">*</span>
// // //           </label>
// // //           <input
// // //             type="text"
// // //             id="question"
// // //             value={question}
// // //             onChange={(e) => setQuestion(e.target.value)}
// // //             required
// // //             className={commonInputClasses}
// // //             placeholder="e.g., How does a Bloom Filter work?"
// // //           />
// // //         </div>
// // //         <div className="mb-5">
// // //           <label htmlFor="hint" className={commonLabelClasses}>
// // //             Hint (Optional)
// // //           </label>
// // //           <textarea
// // //             id="hint"
// // //             value={hint}
// // //             onChange={(e) => setHint(e.target.value)}
// // //             rows="3"
// // //             className={commonInputClasses}
// // //             placeholder="e.g., Think about probabilistic data structures..."
// // //           />
// // //         </div>
// // //         <div className="mb-5">
// // //           <label htmlFor="explanation" className={commonLabelClasses}>
// // //             Explanation (Markdown supported){" "}
// // //             <span className="text-red-500">*</span>
// // //           </label>
// // //           <textarea
// // //             id="explanation"
// // //             value={explanation}
// // //             onChange={(e) => setExplanation(e.target.value)}
// // //             rows="5"
// // //             required
// // //             className={commonInputClasses}
// // //             placeholder="e.g., A Bloom filter is a **space-efficient** probabilistic data structure..."
// // //           />
// // //         </div>

// // //         {/* Updated Code Field */}
// // //         <div className="mb-6">
// // //           <label htmlFor="code" className={commonLabelClasses}>
// // //             Python Code (Optional - Press Tab to indent)
// // //           </label>
// // //           <textarea
// // //             ref={codeTextareaRef} // Assign the ref
// // //             id="code"
// // //             value={code}
// // //             onChange={(e) => setCode(e.target.value)}
// // //             onKeyDown={handleCodeKeyDown} // Add the keydown handler
// // //             rows="10" // Increased rows for better code editing
// // //             className={`${commonInputClasses} font-mono text-sm leading-relaxed`} // Added leading-relaxed
// // //             placeholder="def example_function(param):\n  # Press Tab to indent\n  return param"
// // //             spellCheck="false" // Useful for code fields
// // //           />
// // //           <p className="mt-1 text-xs text-gray-500">
// // //             Python syntax highlighting will be applied. Press Tab key to insert
// // //             a tab character for indentation.
// // //           </p>
// // //         </div>

// // //         {/* Link Field remains the same */}
// // //         <div className="mb-6">
// // //           <label htmlFor="link" className={commonLabelClasses}>
// // //             Link (Optional)
// // //           </label>
// // //           <input
// // //             type="url"
// // //             id="link"
// // //             value={link}
// // //             onChange={(e) => setLink(e.target.value)}
// // //             className={commonInputClasses}
// // //             placeholder="e.g., https://leetcode.com/problems/two-sum/"
// // //           />
// // //         </div>

// // //         <div className="flex space-x-3">
// // //           <button
// // //             type="submit"
// // //             className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out transform hover:scale-105"
// // //           >
// // //             {isEditMode ? (
// // //               <PencilSquareIcon className="h-5 w-5 mr-2" />
// // //             ) : (
// // //               <PlusIcon className="h-5 w-5 mr-2" />
// // //             )}
// // //             {isEditMode ? "Update Flashcard" : "Add Flashcard"}
// // //           </button>
// // //           {isEditMode && (
// // //             <button
// // //               type="button"
// // //               onClick={() => {
// // //                 cancelEdit();
// // //                 setQuestion("");
// // //                 setHint("");
// // //                 setExplanation("");
// // //                 setCode("");
// // //                 setLink("");
// // //                 setFormError("");
// // //               }}
// // //               className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
// // //             >
// // //               Cancel Edit
// // //             </button>
// // //           )}
// // //         </div>
// // //       </form>
// // //     </section>
// // //   );
// // // }

// // // export default FlashcardForm;
// // // client/src/components/FlashcardForm.jsx
// import React, { useState, useEffect, useRef } from "react";
// import useFlashcardStore from "../store/flashcardStore";
// import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
// // npm install react-select (if you choose to use it for multi-select)
// // import Select from 'react-select';

// const FLASHCARD_TYPES = [
//   "DSA",
//   "System Design",
//   "Behavioral",
//   "Technical Knowledge",
//   "Other",
// ];

// function FlashcardForm() {
//   const {
//     addFlashcard,
//     editingFlashcard,
//     updateFlashcard,
//     cancelEdit,
//     showModal,
//     decks,
//     fetchDecks, // Get decks and fetchDecks action
//   } = useFlashcardStore();

//   const [question, setQuestion] = useState("");
//   const [hint, setHint] = useState("");
//   const [explanation, setExplanation] = useState("");
//   const [code, setCode] = useState("");
//   const [link, setLink] = useState("");
//   const [type, setType] = useState(FLASHCARD_TYPES[0]); // Default type
//   const [tags, setTags] = useState(""); // Comma-separated string for tags
//   const [selectedDecks, setSelectedDecks] = useState([]); // Array of deck IDs

//   const codeTextareaRef = useRef(null);
//   const [formError, setFormError] = useState("");
//   const isEditMode = !!editingFlashcard;

//   useEffect(() => {
//     fetchDecks(); // Fetch decks when component mounts or editingFlashcard changes
//   }, [fetchDecks]);

//   useEffect(() => {
//     if (isEditMode && editingFlashcard) {
//       setQuestion(editingFlashcard.question);
//       setHint(editingFlashcard.hint || "");
//       setExplanation(editingFlashcard.explanation);
//       setCode(editingFlashcard.code || "");
//       setLink(editingFlashcard.link || "");
//       setType(editingFlashcard.type || FLASHCARD_TYPES[0]);
//       setTags(editingFlashcard.tags ? editingFlashcard.tags.join(", ") : "");
//       setSelectedDecks(
//         editingFlashcard.decks ? editingFlashcard.decks.map((d) => d._id) : []
//       );
//       setFormError("");
//     } else {
//       setQuestion("");
//       setHint("");
//       setExplanation("");
//       setCode("");
//       setLink("");
//       setType(FLASHCARD_TYPES[0]);
//       setTags("");
//       setSelectedDecks([]);
//       setFormError("");
//     }
//   }, [editingFlashcard, isEditMode]);

// //   const handleCodeKeyDown = (event) => {
// //     /* ... (from previous step) ... */
// //   };
// const handleCodeKeyDown = (event) => {
//     if (event.key === "Tab") {
//       event.preventDefault(); // Prevent default tab behavior (focus change)

//       const textarea = codeTextareaRef.current;
//       if (textarea) {
//         const start = textarea.selectionStart;
//         const end = textarea.selectionEnd;
//         const value = textarea.value;

//         // Insert tab character
//         const newValue =
//           value.substring(0, start) + "\t" + value.substring(end);
//         setCode(newValue);

//         // After state update, set cursor position
//         // Use a timeout to ensure the DOM has updated after React's state change
//         setTimeout(() => {
//           if (codeTextareaRef.current) {
//             codeTextareaRef.current.selectionStart =
//               codeTextareaRef.current.selectionEnd = start + 1;
//           }
//         }, 0);
//       }
//     }
//   };
//   // ... (handleCodeKeyDown from previous step) ...
//   if (event.key === "Tab") {
//     event.preventDefault();
//     const textarea = codeTextareaRef.current;
//     if (textarea) {
//       const start = textarea.selectionStart;
//       const end = textarea.selectionEnd;
//       const value = textarea.value;
//       const newValue = value.substring(0, start) + "\t" + value.substring(end);
//       setCode(newValue);
//       setTimeout(() => {
//         if (codeTextareaRef.current) {
//           codeTextareaRef.current.selectionStart =
//             codeTextareaRef.current.selectionEnd = start + 1;
//         }
//       }, 0);
//     }
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setFormError("");

//     if (!question.trim() || !explanation.trim() || !type.trim()) {
//       const errorMsg = "Question, Explanation, and Type fields are required.";
//       setFormError(errorMsg);
//       showModal("Input Error", errorMsg);
//       return;
//     }

//     const tagsArray = tags
//       .split(",")
//       .map((tag) => tag.trim())
//       .filter((tag) => tag !== "");
//     const flashcardData = {
//       question,
//       hint,
//       explanation,
//       code,
//       link,
//       type,
//       tags: tagsArray,
//       decks: selectedDecks,
//     };

//     try {
//       if (isEditMode) {
//         await updateFlashcard(editingFlashcard._id, flashcardData);
//       } else {
//         await addFlashcard(flashcardData);
//         // Reset form only if not in edit mode after successful add
//         setQuestion("");
//         setHint("");
//         setExplanation("");
//         setCode("");
//         setLink("");
//         setType(FLASHCARD_TYPES[0]);
//         setTags("");
//         setSelectedDecks([]);
//         document.getElementById("question").focus();
//       }
//     } catch (error) {
//       console.error("Failed to save flashcard from form:", error);
//       setFormError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to save flashcard."
//       );
//     }
//   };

//   const handleDeckChange = (deckId) => {
//     setSelectedDecks((prev) =>
//       prev.includes(deckId)
//         ? prev.filter((id) => id !== deckId)
//         : [...prev, deckId]
//     );
//   };

//   const commonInputClasses =
//     "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 text-base";
//   const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";

//   return (
//     <section
//       id="flashcard-form-section"
//       className="mb-10 p-6 bg-white rounded-lg shadow-xl"
//     >
//       <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">
//         {isEditMode ? "Edit Flashcard" : "Create New Flashcard"}
//       </h2>
//       {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Question, Hint, Explanation, Code, Link fields */}
//         <div>
//           <label htmlFor="question" className={commonLabelClasses}>
//             Question <span className="text-red-500">*</span>
//           </label>
//           <input
//             type="text"
//             id="question"
//             value={question}
//             onChange={(e) => setQuestion(e.target.value)}
//             required
//             className={commonInputClasses}
//           />
//         </div>
//         <div>
//           <label htmlFor="hint" className={commonLabelClasses}>
//             Hint
//           </label>
//           <textarea
//             id="hint"
//             value={hint}
//             onChange={(e) => setHint(e.target.value)}
//             rows="3"
//             className={commonInputClasses}
//           />
//         </div>
//         <div>
//           <label htmlFor="explanation" className={commonLabelClasses}>
//             Explanation (Markdown) <span className="text-red-500">*</span>
//           </label>
//           <textarea
//             id="explanation"
//             value={explanation}
//             onChange={(e) => setExplanation(e.target.value)}
//             rows="5"
//             required
//             className={commonInputClasses}
//           />
//         </div>
//         <div>
//           <label htmlFor="code" className={commonLabelClasses}>
//             Python Code (Tab to indent)
//           </label>
//           <textarea
//             ref={codeTextareaRef}
//             id="code"
//             value={code}
//             onChange={(e) => setCode(e.target.value)}
//             onKeyDown={handleCodeKeyDown}
//             rows="10"
//             className={`${commonInputClasses} font-mono text-sm leading-relaxed`}
//             spellCheck="false"
//           />
//         </div>
//         <div>
//           <label htmlFor="link" className={commonLabelClasses}>
//             Link
//           </label>
//           <input
//             type="url"
//             id="link"
//             value={link}
//             onChange={(e) => setLink(e.target.value)}
//             className={commonInputClasses}
//           />
//         </div>

//         {/* Type Field */}
//         <div>
//           <label htmlFor="type" className={commonLabelClasses}>
//             Type <span className="text-red-500">*</span>
//           </label>
//           <select
//             id="type"
//             value={type}
//             onChange={(e) => setType(e.target.value)}
//             className={commonInputClasses}
//           >
//             {FLASHCARD_TYPES.map((t) => (
//               <option key={t} value={t}>
//                 {t}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Tags Field */}
//         <div>
//           <label htmlFor="tags" className={commonLabelClasses}>
//             Tags (comma-separated)
//           </label>
//           <input
//             type="text"
//             id="tags"
//             value={tags}
//             onChange={(e) => setTags(e.target.value)}
//             className={commonInputClasses}
//             placeholder="e.g., arrays, two-pointers, dynamic programming"
//           />
//         </div>

//         {/* Decks Field - Basic Checkbox implementation */}
//         <div>
//           <label className={commonLabelClasses}>Decks</label>
//           {decks.length === 0 && (
//             <p className="text-sm text-gray-500">
//               No decks available. Create decks in the 'Manage Decks' section.
//             </p>
//           )}
//           <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border p-3 rounded-md">
//             {decks.map((deck) => (
//               <label
//                 key={deck._id}
//                 className="flex items-center space-x-2 text-sm"
//               >
//                 <input
//                   type="checkbox"
//                   className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
//                   value={deck._id}
//                   checked={selectedDecks.includes(deck._id)}
//                   onChange={() => handleDeckChange(deck._id)}
//                 />
//                 <span>{deck.name}</span>
//               </label>
//             ))}
//           </div>
//         </div>

//         <div className="flex space-x-3 pt-4">
//           <button
//             type="submit"
//             className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
//           >
//             {isEditMode ? (
//               <PencilSquareIcon className="h-5 w-5 mr-2" />
//             ) : (
//               <PlusIcon className="h-5 w-5 mr-2" />
//             )}
//             {isEditMode ? "Update Flashcard" : "Add Flashcard"}
//           </button>
//           {isEditMode && (
//             <button
//               type="button"
//               onClick={() => {
//                 cancelEdit(); /* useEffect handles form reset */
//               }}
//               className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
//             >
//               Cancel Edit
//             </button>
//           )}
//         </div>
//       </form>
//     </section>
//   );
// }
// export default FlashcardForm;
// client/src/components/FlashcardForm.jsx
import React, { useState, useEffect, useRef } from "react"; // Make sure useRef is imported
import useFlashcardStore from "../store/flashcardStore";
import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/solid";

const FLASHCARD_TYPES = [
  "DSA",
  "System Design",
  "Behavioral",
  "Technical Knowledge",
  "Other",
];

function FlashcardForm() {
  const {
    addFlashcard,
    editingFlashcard,
    updateFlashcard,
    cancelEdit,
    showModal,
    decks,
    fetchDecks,
  } = useFlashcardStore();

  // ... (all your existing useState hooks for question, hint, explanation, code, link, type, tags, selectedDecks, formError)
  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState("");
  const [explanation, setExplanation] = useState("");
  const [code, setCode] = useState(""); // This is the state for the code textarea
  const [link, setLink] = useState("");
  const [type, setType] = useState(FLASHCARD_TYPES[0]);
  const [tags, setTags] = useState("");
  const [selectedDecks, setSelectedDecks] = useState([]);
  const [formError, setFormError] = useState("");

  const codeTextareaRef = useRef(null); // Define the ref for the code textarea
  const isEditMode = !!editingFlashcard;

  // ... (Your existing useEffect hooks for fetchDecks and populating the form in edit mode) ...
  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  useEffect(() => {
    if (isEditMode && editingFlashcard) {
      setQuestion(editingFlashcard.question);
      setHint(editingFlashcard.hint || "");
      setExplanation(editingFlashcard.explanation);
      setCode(editingFlashcard.code || ""); // Populate code state
      setLink(editingFlashcard.link || "");
      setType(editingFlashcard.type || FLASHCARD_TYPES[0]);
      setTags(editingFlashcard.tags ? editingFlashcard.tags.join(", ") : "");
      setSelectedDecks(
        editingFlashcard.decks ? editingFlashcard.decks.map((d) => d._id) : []
      );
      setFormError("");
    } else {
      setQuestion("");
      setHint("");
      setExplanation("");
      setCode("");
      setLink("");
      setType(FLASHCARD_TYPES[0]);
      setTags("");
      setSelectedDecks([]);
      setFormError("");
    }
  }, [editingFlashcard, isEditMode]);

  // THIS IS THE CORRECT AND COMPLETE FUNCTION:
  const handleCodeKeyDown = (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = codeTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const newValue =
          value.substring(0, start) + "\t" + value.substring(end);
        setCode(newValue); // Update the 'code' state
        setTimeout(() => {
          if (codeTextareaRef.current) {
            codeTextareaRef.current.selectionStart =
              codeTextareaRef.current.selectionEnd = start + 1;
          }
        }, 0);
      }
    }
  };

  //   const handleSubmit = async (e) => {
  //     /* ... (your existing handleSubmit logic) ... */
  //   };
  //   const handleDeckChange = (deckId) => {
  //     /* ... (your existing handleDeckChange logic) ... */
  //   };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!question.trim() || !explanation.trim() || !type.trim()) {
      const errorMsg = "Question, Explanation, and Type fields are required.";
      setFormError(errorMsg);
      showModal("Input Error", errorMsg);
      return;
    }

    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");
    const flashcardData = {
      question,
      hint,
      explanation,
      code,
      link,
      type,
      tags: tagsArray,
      decks: selectedDecks,
    };

    try {
      if (isEditMode) {
        await updateFlashcard(editingFlashcard._id, flashcardData);
      } else {
        await addFlashcard(flashcardData);
        // Reset form only if not in edit mode after successful add
        setQuestion("");
        setHint("");
        setExplanation("");
        setCode("");
        setLink("");
        setType(FLASHCARD_TYPES[0]);
        setTags("");
        setSelectedDecks([]);
        document.getElementById("question").focus();
      }
    } catch (error) {
      console.error("Failed to save flashcard from form:", error);
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save flashcard."
      );
    }
  };

  const handleDeckChange = (deckId) => {
    setSelectedDecks((prev) =>
      prev.includes(deckId)
        ? prev.filter((id) => id !== deckId)
        : [...prev, deckId]
    );
  };

  const commonInputClasses =
    "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 text-base";
  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <section
      id="flashcard-form-section"
      className="mb-10 p-6 bg-white rounded-lg shadow-xl"
    >
      <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">
        {isEditMode ? "Edit Flashcard" : "Create New Flashcard"}
      </h2>
      {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ... (Question, Hint, Explanation input fields) ... */}
        <div>
          <label htmlFor="question" className={commonLabelClasses}>
            Question <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            className={commonInputClasses}
          />
        </div>
        <div>
          <label htmlFor="hint" className={commonLabelClasses}>
            Hint
          </label>
          <textarea
            id="hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            rows="3"
            className={commonInputClasses}
          />
        </div>
        <div>
          <label htmlFor="explanation" className={commonLabelClasses}>
            Explanation (Markdown) <span className="text-red-500">*</span>
          </label>
          <textarea
            id="explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows="5"
            required
            className={commonInputClasses}
          />
        </div>

        {/* Code Field - Make sure to assign the ref and onKeyDown handler */}
        <div>
          <label htmlFor="code" className={commonLabelClasses}>
            Python Code (Tab to indent)
          </label>
          <textarea
            ref={codeTextareaRef} // Assign the ref here
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleCodeKeyDown} // Assign the keydown handler here
            rows="10"
            className={`${commonInputClasses} font-mono text-sm leading-relaxed`}
            placeholder="def example_function(param):\n  # Press Tab to indent\n  return param"
            spellCheck="false"
          />
        </div>

        {/* ... (Link, Type, Tags, Decks input fields and submit/cancel buttons) ... */}
        <div>
          <label htmlFor="link" className={commonLabelClasses}>
            Link
          </label>
          <input
            type="url"
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className={commonInputClasses}
          />
        </div>
        <div>
          <label htmlFor="type" className={commonLabelClasses}>
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={commonInputClasses}
          >
            {FLASHCARD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tags" className={commonLabelClasses}>
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={commonInputClasses}
            placeholder="e.g., arrays, two-pointers, dynamic programming"
          />
        </div>
        <div>
          <label className={commonLabelClasses}>Decks</label>
          {/* ... deck selection logic ... */}
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border p-3 rounded-md">
            {decks.map((deck) => (
              <label
                key={deck._id}
                className="flex items-center space-x-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={deck._id}
                  checked={selectedDecks.includes(deck._id)}
                  onChange={() => handleDeckChange(deck._id)}
                />
                <span>{deck.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            {isEditMode ? (
              <PencilSquareIcon className="h-5 w-5 mr-2" />
            ) : (
              <PlusIcon className="h-5 w-5 mr-2" />
            )}
            {isEditMode ? "Update Flashcard" : "Add Flashcard"}
          </button>
          {isEditMode && (
            <button
              type="button"
              onClick={() => {
                cancelEdit(); /* useEffect handles form reset */
              }}
              className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default FlashcardForm;
