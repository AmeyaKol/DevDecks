// import React from "react";
// import FlashcardForm from "./components/FlashcardForm";
// import FlashcardList from "./components/FlashcardList"; // Will need updates for filtering
// import Modal from "./components/Modal";
// import DeckManager from "./components/DeckManager"; // Import DeckManager
// import useFlashcardStore from "./store/flashcardStore"; // For filter controls

// const FLASHCARD_TYPES = [
//   "All",
//   "DSA",
//   "System Design",
//   "Behavioral",
//   "Technical Knowledge",
//   "Other",
// ]; // Include 'All'

// function App() {
//   const {
//     decks,
//     selectedTypeFilter,
//     setSelectedTypeFilter,
//     selectedDeckFilter,
//     setSelectedDeckFilter,
//     allTags,
//     selectedTagsFilter,
//     setSelectedTagsFilter, // For tag filtering
//   } = useFlashcardStore();

//   // Basic multi-select for tags (can be improved with a dedicated component)
//   const handleTagFilterChange = (tag) => {
//     setSelectedTagsFilter(
//       selectedTagsFilter.includes(tag)
//         ? selectedTagsFilter.filter((t) => t !== tag)
//         : [...selectedTagsFilter, tag]
//     );
//   };

//   return (
//     <>
//       <div className="container mx-auto p-4 sm:p-6 lg:p-8">
//         <header className="mb-8 text-center">
//           <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
//             Study Helper Enhanced
//           </h1>
//           <p className="text-gray-600 mt-2">
//             MERN Flashcards with Decks, Types, and Tags
//           </p>
//         </header>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2">
//             {" "}
//             {/* Main content: Form and Flashcard List */}
//             <FlashcardForm />
//             <section id="flashcards-display" className="mt-10">
//               <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">
//                 Your Flashcards
//               </h2>
//               {/* Filtering UI */}
//               <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow space-y-4 sm:space-y-0 sm:flex sm:space-x-4 items-center">
//                 <div>
//                   <label
//                     htmlFor="typeFilter"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Filter by Type:
//                   </label>
//                   <select
//                     id="typeFilter"
//                     value={selectedTypeFilter}
//                     onChange={(e) => setSelectedTypeFilter(e.target.value)}
//                     className="mt-1 block w-full sm:w-auto rounded-md border-gray-300 shadow-sm p-2"
//                   >
//                     {FLASHCARD_TYPES.map((t) => (
//                       <option key={t} value={t}>
//                         {t}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label
//                     htmlFor="deckFilter"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Filter by Deck:
//                   </label>
//                   <select
//                     id="deckFilter"
//                     value={selectedDeckFilter}
//                     onChange={(e) => setSelectedDeckFilter(e.target.value)}
//                     className="mt-1 block w-full sm:w-auto rounded-md border-gray-300 shadow-sm p-2"
//                   >
//                     <option value="All">All Decks</option>
//                     {decks.map((d) => (
//                       <option key={d._id} value={d._id}>
//                         {d.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//               {/* Advanced Tag Filtering (Basic example) */}
//               {allTags.length > 0 && (
//                 <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Filter by Tags (select multiple):
//                   </label>
//                   <div className="flex flex-wrap gap-2">
//                     {allTags.map((tag) => (
//                       <button
//                         key={tag}
//                         onClick={() => handleTagFilterChange(tag)}
//                         className={`px-3 py-1 text-sm rounded-full border ${
//                           selectedTagsFilter.includes(tag)
//                             ? "bg-indigo-600 text-white border-indigo-600"
//                             : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
//                         }`}
//                       >
//                         {tag}
//                       </button>
//                     ))}
//                   </div>
//                   {selectedTagsFilter.length > 0 && (
//                     <button
//                       onClick={() => setSelectedTagsFilter([])}
//                       className="mt-2 text-xs text-indigo-600 hover:underline"
//                     >
//                       Clear Tag Filters
//                     </button>
//                   )}
//                 </div>
//               )}
//               <FlashcardList />{" "}
//               {/* This component will need to use the filter states */}
//             </section>
//           </div>
//           <div className="lg:col-span-1">
//             {" "}
//             {/* Sidebar for Deck Management */}
//             <DeckManager />
//           </div>
//         </div>
//       </div>
//       <Modal />
//     </>
//   );
// }
// export default App;
import React, { useState } from "react";
import FlashcardForm from "./components/FlashcardForm";
import FlashcardList from "./components/FlashcardList";
import Modal from "./components/Modal";
import DeckManager from "./components/DeckManager";
import useFlashcardStore from "./store/flashcardStore";
import {
  DocumentPlusIcon,
  EyeIcon,
  SquaresPlusIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline"; // Added icons

const FLASHCARD_TYPES = [
  "All",
  "DSA",
  "System Design",
  "Behavioral",
  "Technical Knowledge",
  "Other",
];

function App() {
  const [currentPage, setCurrentPage] = useState("cards"); // 'cards' or 'create'

  const {
    decks,
    selectedTypeFilter,
    setSelectedTypeFilter,
    selectedDeckFilter,
    setSelectedDeckFilter,
    allTags,
    selectedTagsFilter,
    setSelectedTagsFilter,
  } = useFlashcardStore();

  const handleTagFilterChange = (tag) => {
    setSelectedTagsFilter(
      selectedTagsFilter.includes(tag)
        ? selectedTagsFilter.filter((t) => t !== tag)
        : [...selectedTagsFilter, tag]
    );
  };

  // Common button classes for navigation
  const navButtonBaseClasses =
    "inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ease-in-out";
  const activeNavButtonClasses =
    "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500";
  const inactiveNavButtonClasses =
    "bg-white text-indigo-700 hover:bg-indigo-50 border-indigo-300 focus:ring-indigo-500";

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            Study Helper Enhanced
          </h1>
          <p className="text-gray-600 mt-2">
            MERN Flashcards with Decks, Types, and Tags
          </p>
        </header>

        {/* Navigation Buttons */}
        <nav className="mb-10 flex justify-center space-x-4">
          <button
            onClick={() => setCurrentPage("cards")}
            className={`${navButtonBaseClasses} ${
              currentPage === "cards"
                ? activeNavButtonClasses
                : inactiveNavButtonClasses
            }`}
          >
            <EyeIcon className="h-5 w-5 mr-2" />
            View Cards
          </button>
          <button
            onClick={() => setCurrentPage("create")}
            className={`${navButtonBaseClasses} ${
              currentPage === "create"
                ? activeNavButtonClasses
                : inactiveNavButtonClasses
            }`}
          >
            <DocumentPlusIcon className="h-5 w-5 mr-2" />
            Create Content
          </button>
        </nav>

        {/* Page Content */}
        {currentPage === "create" && (
          <div id="create-page">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 text-center">
              Create & Manage
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <FlashcardForm />
              </div>
              <div className="lg:col-span-1">
                <DeckManager />
              </div>
            </div>
          </div>
        )}

        {currentPage === "cards" && (
          <div id="cards-page">
            <section id="flashcards-display">
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-6 text-center">
                Your Flashcards
              </h2>

              {/* Filtering UI */}
              <div className="mb-6 p-6 bg-white rounded-lg shadow-xl space-y-6">
                <h3 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-4">
                  Filter Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="typeFilter"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Filter by Type:
                    </label>
                    <select
                      id="typeFilter"
                      value={selectedTypeFilter}
                      onChange={(e) => setSelectedTypeFilter(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {FLASHCARD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="deckFilter"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Filter by Deck:
                    </label>
                    <select
                      id="deckFilter"
                      value={selectedDeckFilter}
                      onChange={(e) => setSelectedDeckFilter(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="All">All Decks</option>
                      {decks.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {allTags.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Tags (select multiple):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagFilterChange(tag)}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                            selectedTagsFilter.includes(tag)
                              ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    {selectedTagsFilter.length > 0 && (
                      <button
                        onClick={() => setSelectedTagsFilter([])}
                        className="mt-3 text-xs text-indigo-600 hover:underline"
                      >
                        Clear Tag Filters
                      </button>
                    )}
                  </div>
                )}
              </div>

              <FlashcardList />
            </section>
          </div>
        )}
      </div>
      <Modal />
    </>
  );
}
export default App;
