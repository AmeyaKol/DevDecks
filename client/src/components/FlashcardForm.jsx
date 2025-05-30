// // import React, { useState } from "react";
// // import useFlashcardStore from "../store/flashcardStore";
// // import { PlusIcon } from "@heroicons/react/24/solid";

// // function FlashcardForm() {
// //   const [question, setQuestion] = useState("");
// //   const [hint, setHint] = useState("");
// //   const [explanation, setExplanation] = useState("");
// //   const [code, setCode] = useState("");
// //   const [formError, setFormError] = useState("");

// //   const { addFlashcard, showModal } = useFlashcardStore();

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setFormError("");

// //     if (!question.trim() || !explanation.trim()) {
// //       setFormError("Question and Explanation fields are required.");
// //       showModal(
// //         "Input Error",
// //         "Question and Explanation fields are required. Please fill them out."
// //       );
// //       return;
// //     }

// //     try {
// //       await addFlashcard({ question, hint, explanation, code });
// //       setQuestion("");
// //       setHint("");
// //       setExplanation("");
// //       setCode("");
// //       document.getElementById("question").focus(); // Focus on question for next entry
// //     } catch (error) {
// //       // Error is handled by the store's showModal, but you could add specific form feedback here if needed
// //       console.error("Failed to add flashcard from form:", error);
// //       setFormError(
// //         error.response?.data?.message ||
// //           error.message ||
// //           "Failed to save flashcard."
// //       );
// //     }
// //   };

// //   const commonInputClasses =
// //     "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 text-base";
// //   const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";

// //   return (
// //     <section
// //       id="create-flashcard"
// //       className="mb-10 p-6 bg-white rounded-lg shadow-xl"
// //     >
// //       <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">
// //         Create New Flashcard
// //       </h2>
// //       {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
// //       <form onSubmit={handleSubmit}>
// //         <div className="mb-5">
// //           <label htmlFor="question" className={commonLabelClasses}>
// //             Question <span className="text-red-500">*</span>
// //           </label>
// //           <input
// //             type="text"
// //             id="question"
// //             value={question}
// //             onChange={(e) => setQuestion(e.target.value)}
// //             required
// //             className={commonInputClasses}
// //             placeholder="e.g., How does a Bloom Filter work?"
// //           />
// //         </div>
// //         <div className="mb-5">
// //           <label htmlFor="hint" className={commonLabelClasses}>
// //             Hint (Optional)
// //           </label>
// //           <textarea
// //             id="hint"
// //             value={hint}
// //             onChange={(e) => setHint(e.target.value)}
// //             rows="3"
// //             className={commonInputClasses}
// //             placeholder="e.g., Think about probabilistic data structures..."
// //           />
// //         </div>
// //         <div className="mb-5">
// //           <label htmlFor="explanation" className={commonLabelClasses}>
// //             Explanation (Markdown supported){" "}
// //             <span className="text-red-500">*</span>
// //           </label>
// //           <textarea
// //             id="explanation"
// //             value={explanation}
// //             onChange={(e) => setExplanation(e.target.value)}
// //             rows="5"
// //             required
// //             className={commonInputClasses}
// //             placeholder="e.g., A Bloom filter is a **space-efficient** probabilistic data structure..."
// //           />
// //         </div>
// //         <div className="mb-6">
// //           <label htmlFor="code" className={commonLabelClasses}>
// //             Python Code (Optional)
// //           </label>
// //           <textarea
// //             id="code"
// //             value={code}
// //             onChange={(e) => setCode(e.target.value)}
// //             rows="7"
// //             className={`${commonInputClasses} font-mono text-sm`}
// //             placeholder="def example_function(param):\n  # Your Python code here\n  return param"
// //           />
// //           <p className="mt-1 text-xs text-gray-500">
// //             Python syntax highlighting will be applied. Full linting is not
// //             available.
// //           </p>
// //         </div>
// //         <button
// //           type="submit"
// //           className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out transform hover:scale-105"
// //         >
// //           <PlusIcon className="h-5 w-5 mr-2" />
// //           Add Flashcard
// //         </button>
// //       </form>
// //     </section>
// //   );
// // }

// // export default FlashcardForm;
// // client/src/components/FlashcardForm.jsx
// import React, { useState, useEffect } from "react";
// import useFlashcardStore from "../store/flashcardStore";
// import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/solid";

// function FlashcardForm() {
//   const {
//     addFlashcard,
//     editingFlashcard,
//     updateFlashcard,
//     cancelEdit,
//     showModal,
//   } = useFlashcardStore();

//   const [question, setQuestion] = useState("");
//   const [hint, setHint] = useState("");
//   const [explanation, setExplanation] = useState("");
//   const [code, setCode] = useState("");
//   const [link, setLink] = useState(""); // New state for link
//   const [formError, setFormError] = useState("");

//   const isEditMode = !!editingFlashcard;

//   useEffect(() => {
//     if (isEditMode && editingFlashcard) {
//       setQuestion(editingFlashcard.question);
//       setHint(editingFlashcard.hint || "");
//       setExplanation(editingFlashcard.explanation);
//       setCode(editingFlashcard.code || "");
//       setLink(editingFlashcard.link || ""); // Populate link field
//       setFormError("");
//     } else {
//       // Reset form if not in edit mode or editingFlashcard becomes null
//       setQuestion("");
//       setHint("");
//       setExplanation("");
//       setCode("");
//       setLink("");
//       setFormError("");
//     }
//   }, [editingFlashcard, isEditMode]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setFormError("");

//     if (!question.trim() || !explanation.trim()) {
//       const errorMsg = "Question and Explanation fields are required.";
//       setFormError(errorMsg);
//       showModal("Input Error", errorMsg);
//       return;
//     }

//     const flashcardData = { question, hint, explanation, code, link }; // Include link

//     try {
//       if (isEditMode) {
//         await updateFlashcard(editingFlashcard._id, flashcardData);
//         // cancelEdit(); // Zustand store now handles clearing editingFlashcard on successful update
//       } else {
//         await addFlashcard(flashcardData);
//       }
//       // Reset form fields manually if not in edit mode (useEffect handles reset when editingFlashcard becomes null)
//       if (!isEditMode) {
//         setQuestion("");
//         setHint("");
//         setExplanation("");
//         setCode("");
//         setLink("");
//       }
//       // Focus on question for next entry (if create mode) or just leave as is
//       if (!isEditMode) {
//         document.getElementById("question").focus();
//       }
//     } catch (error) {
//       console.error("Failed to save flashcard from form:", error);
//       setFormError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to save flashcard."
//       );
//       // showModal for error is handled by the store actions
//     }
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
//       <form onSubmit={handleSubmit}>
//         <div className="mb-5">
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
//             placeholder="e.g., How does a Bloom Filter work?"
//           />
//         </div>
//         <div className="mb-5">
//           <label htmlFor="hint" className={commonLabelClasses}>
//             Hint (Optional)
//           </label>
//           <textarea
//             id="hint"
//             value={hint}
//             onChange={(e) => setHint(e.target.value)}
//             rows="3"
//             className={commonInputClasses}
//             placeholder="e.g., Think about probabilistic data structures..."
//           />
//         </div>
//         <div className="mb-5">
//           <label htmlFor="explanation" className={commonLabelClasses}>
//             Explanation (Markdown supported){" "}
//             <span className="text-red-500">*</span>
//           </label>
//           <textarea
//             id="explanation"
//             value={explanation}
//             onChange={(e) => setExplanation(e.target.value)}
//             rows="5"
//             required
//             className={commonInputClasses}
//             placeholder="e.g., A Bloom filter is a **space-efficient** probabilistic data structure..."
//           />
//         </div>
//         <div className="mb-6">
//           <label htmlFor="code" className={commonLabelClasses}>
//             Python Code (Optional)
//           </label>
//           <textarea
//             id="code"
//             value={code}
//             onChange={(e) => setCode(e.target.value)}
//             rows="7"
//             className={`${commonInputClasses} font-mono text-sm`}
//             placeholder="def example_function(param):\n  # Your Python code here\n  return param"
//           />
//           <p className="mt-1 text-xs text-gray-500">
//             Python syntax highlighting will be applied.
//           </p>
//         </div>

//         {/* New Link Field */}
//         <div className="mb-6">
//           <label htmlFor="link" className={commonLabelClasses}>
//             Link (Optional)
//           </label>
//           <input
//             type="url" // Using type="url" for basic browser validation
//             id="link"
//             value={link}
//             onChange={(e) => setLink(e.target.value)}
//             className={commonInputClasses}
//             placeholder="e.g., https://leetcode.com/problems/two-sum/"
//           />
//         </div>

//         <div className="flex space-x-3">
//           <button
//             type="submit"
//             className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out transform hover:scale-105"
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
//                 cancelEdit();
//                 // Manually reset fields as useEffect might not trigger if editingFlashcard was the same object ref
//                 setQuestion("");
//                 setHint("");
//                 setExplanation("");
//                 setCode("");
//                 setLink("");
//                 setFormError("");
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
import React, { useState, useEffect, useRef } from "react"; // Import useRef
import useFlashcardStore from "../store/flashcardStore";
import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/solid";

function FlashcardForm() {
  const {
    addFlashcard,
    editingFlashcard,
    updateFlashcard,
    cancelEdit,
    showModal,
  } = useFlashcardStore();

  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState("");
  const [explanation, setExplanation] = useState("");
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [formError, setFormError] = useState("");

  const codeTextareaRef = useRef(null); // Ref for the code textarea

  const isEditMode = !!editingFlashcard;

  useEffect(() => {
    if (isEditMode && editingFlashcard) {
      setQuestion(editingFlashcard.question);
      setHint(editingFlashcard.hint || "");
      setExplanation(editingFlashcard.explanation);
      setCode(editingFlashcard.code || "");
      setLink(editingFlashcard.link || "");
      setFormError("");
    } else {
      setQuestion("");
      setHint("");
      setExplanation("");
      setCode("");
      setLink("");
      setFormError("");
    }
  }, [editingFlashcard, isEditMode]);

  const handleCodeKeyDown = (event) => {
    if (event.key === "Tab") {
      event.preventDefault(); // Prevent default tab behavior (focus change)

      const textarea = codeTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        // Insert tab character
        const newValue =
          value.substring(0, start) + "\t" + value.substring(end);
        setCode(newValue);

        // After state update, set cursor position
        // Use a timeout to ensure the DOM has updated after React's state change
        setTimeout(() => {
          if (codeTextareaRef.current) {
            codeTextareaRef.current.selectionStart =
              codeTextareaRef.current.selectionEnd = start + 1;
          }
        }, 0);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!question.trim() || !explanation.trim()) {
      const errorMsg = "Question and Explanation fields are required.";
      setFormError(errorMsg);
      showModal("Input Error", errorMsg);
      return;
    }

    const flashcardData = { question, hint, explanation, code, link };

    try {
      if (isEditMode) {
        await updateFlashcard(editingFlashcard._id, flashcardData);
      } else {
        await addFlashcard(flashcardData);
      }
      if (!isEditMode) {
        setQuestion("");
        setHint("");
        setExplanation("");
        setCode("");
        setLink("");
      }
      if (!isEditMode) {
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
      <form onSubmit={handleSubmit}>
        {/* Question, Hint, Explanation fields remain the same */}
        <div className="mb-5">
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
            placeholder="e.g., How does a Bloom Filter work?"
          />
        </div>
        <div className="mb-5">
          <label htmlFor="hint" className={commonLabelClasses}>
            Hint (Optional)
          </label>
          <textarea
            id="hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            rows="3"
            className={commonInputClasses}
            placeholder="e.g., Think about probabilistic data structures..."
          />
        </div>
        <div className="mb-5">
          <label htmlFor="explanation" className={commonLabelClasses}>
            Explanation (Markdown supported){" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            id="explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows="5"
            required
            className={commonInputClasses}
            placeholder="e.g., A Bloom filter is a **space-efficient** probabilistic data structure..."
          />
        </div>

        {/* Updated Code Field */}
        <div className="mb-6">
          <label htmlFor="code" className={commonLabelClasses}>
            Python Code (Optional - Press Tab to indent)
          </label>
          <textarea
            ref={codeTextareaRef} // Assign the ref
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleCodeKeyDown} // Add the keydown handler
            rows="10" // Increased rows for better code editing
            className={`${commonInputClasses} font-mono text-sm leading-relaxed`} // Added leading-relaxed
            placeholder="def example_function(param):\n  # Press Tab to indent\n  return param"
            spellCheck="false" // Useful for code fields
          />
          <p className="mt-1 text-xs text-gray-500">
            Python syntax highlighting will be applied. Press Tab key to insert
            a tab character for indentation.
          </p>
        </div>

        {/* Link Field remains the same */}
        <div className="mb-6">
          <label htmlFor="link" className={commonLabelClasses}>
            Link (Optional)
          </label>
          <input
            type="url"
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className={commonInputClasses}
            placeholder="e.g., https://leetcode.com/problems/two-sum/"
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out transform hover:scale-105"
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
                cancelEdit();
                setQuestion("");
                setHint("");
                setExplanation("");
                setCode("");
                setLink("");
                setFormError("");
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
