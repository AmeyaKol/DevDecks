import React, { useState, useEffect } from "react";
import FlashcardForm from "./components/flashcard/FlashcardForm";
import FlashcardList from "./components/flashcard/FlashcardList";
import DeckList from "./components/deck/DeckList";
import Modal from "./components/common/Modal";
import DeckManager from "./components/deck/DeckManager";
import TestTab from "./components/TestTab";
import AuthModal from "./components/auth/AuthModal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import useFlashcardStore from "./store/flashcardStore";
import {
  DocumentPlusIcon,
  EyeIcon,
  SquaresPlusIcon,
  ListBulletIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  RectangleStackIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Toast from "./components/common/Toast";

const FLASHCARD_TYPES = [
  "All",
  "DSA",
  "System Design",
  "Behavioral",
  "Technical Knowledge",
  "Other",
];

function AppContent() {
  const {
    decks,
    flashcards,
    selectedTypeFilter,
    setSelectedTypeFilter,
    selectedDeckFilter,
    setSelectedDeckFilter,
    allTags,
    selectedTagsFilter,
    setSelectedTagsFilter,
    fetchDecks,
    fetchFlashcards,
    currentPage,
    setCurrentPage,
    viewMode,
    setViewMode,
    selectedDeckForView,
    setSelectedDeckForView,
    toast,
    darkMode,
    toggleDarkMode,
  } = useFlashcardStore();

  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    fetchDecks();
    fetchFlashcards();
  }, [fetchDecks, fetchFlashcards]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const navButtonBaseClasses =
    "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";
  const activeNavButtonClasses = "bg-indigo-600 text-white shadow-lg";
  const inactiveNavButtonClasses =
    "text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-700";

  const handleLogout = () => {
    logout();
  };

  const handleTagFilterChange = (tag) => {
    if (selectedTagsFilter.includes(tag)) {
      setSelectedTagsFilter(selectedTagsFilter.filter((t) => t !== tag));
    } else {
      setSelectedTagsFilter([...selectedTagsFilter, tag]);
    }
  };

  const handleDeckClick = (deck) => {
    setSelectedDeckForView(deck);
    setViewMode('cards');
    setSelectedDeckFilter(deck._id); // Set the deck filter to show only cards from this deck
  };

  const handleBackToDecks = () => {
    setSelectedDeckForView(null);
    setViewMode('decks');
    setSelectedDeckFilter('All'); // Reset deck filter
  };

  const handleViewModeToggle = (mode) => {
    setViewMode(mode);
    if (mode === 'decks') {
      setSelectedDeckForView(null);
      setSelectedDeckFilter('All');
    }
  };

  // Get filtered flashcards for deck view (sorted by creation date, oldest first)
  const getFilteredFlashcardsForDeck = (deckId) => {
    return flashcards
      .filter(card => card.decks && card.decks.some(d => 
        typeof d === 'string' ? d === deckId : d._id === deckId
      ))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Oldest first
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="relative text-center mb-12">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="absolute top-0 left-0 mt-4 ml-4 z-10 flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 dark:text-gray-100 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Toggle dark mode"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0112 21.75c-5.385 0-9.75-4.365-9.75-9.75 0-4.136 2.664-7.64 6.398-9.09a.75.75 0 01.908.325.75.75 0 01-.062.954A7.501 7.501 0 0012 19.5c2.485 0 4.712-1.21 6.172-3.09a.75.75 0 01.954-.062.75.75 0 01.325.908z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M12 19.5V21M4.219 4.219l1.061 1.061M17.657 17.657l1.06 1.06M3 12h1.5M19.5 12H21M4.219 19.781l1.061-1.061M17.657 6.343l1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            )}
            {darkMode ? 'Dark' : 'Light'}
          </button>
          {/* Auth Section - absolutely positioned */}
          <div className="absolute top-0 right-0 mt-4 mr-4 z-10">
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <UserIcon className="h-4 w-4" />
                    <span>Welcome, {user?.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
          {/* Centered Title and Subtitle */}
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
            🧠 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">LeetLearn: DSA Flashcard App</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-2 dark:text-gray-400">
            Create flashcards for DSA, System Design, etc. Write Python code within your flashcard, and test yourself with the test feature!
          </p>
        </header>

        {/* Navigation */}
        <nav className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setCurrentPage("cards")}
            className={`${navButtonBaseClasses} ${
              currentPage === "cards" ? activeNavButtonClasses : inactiveNavButtonClasses
            }`}
          >
            <EyeIcon className="h-5 w-5 mr-2" />
            View Cards
          </button>
          
          {isAuthenticated && (
            <button
              onClick={() => setCurrentPage("create")}
              className={`${navButtonBaseClasses} ${
                currentPage === "create" ? activeNavButtonClasses : inactiveNavButtonClasses
              }`}
            >
              <DocumentPlusIcon className="h-5 w-5 mr-2" />
              Create Content
            </button>
          )}
          
          <button
            onClick={() => setCurrentPage("test")}
            className={`${navButtonBaseClasses} ${
              currentPage === "test" ? activeNavButtonClasses : inactiveNavButtonClasses
            }`}
          >
            <SquaresPlusIcon className="h-5 w-5 mr-2" />
            Test
          </button>
          
          {isAuthenticated && (
            <button
              onClick={() => setCurrentPage("decks")}
              className={`${navButtonBaseClasses} ${
                currentPage === "decks" ? activeNavButtonClasses : inactiveNavButtonClasses
              }`}
            >
              <ListBulletIcon className="h-5 w-5 mr-2" />
              Manage Decks
            </button>
          )}
        </nav>

        {/* Main Content */}
        <main>
          {currentPage === "cards" && (
            <div id="cards-page">
              {/* View Toggle and Back Button */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {selectedDeckForView && (
                      <button
                        onClick={handleBackToDecks}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        <ArrowLeftIcon className="h-4 w-4" />
                        <span>Back to Decks</span>
                      </button>
                    )}
                    
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                      {selectedDeckForView 
                        ? `Cards in "${selectedDeckForView.name}"` 
                        : viewMode === 'decks' ? 'All Decks' : 'All Cards'
                      }
                    </h3>
                  </div>
                  
                  {!selectedDeckForView && (
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
                      <button
                        onClick={() => handleViewModeToggle('cards')}
                        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          viewMode === 'cards'
                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400'
                            : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white'
                        }`}
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>Card View</span>
                      </button>
                      <button
                        onClick={() => handleViewModeToggle('decks')}
                        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          viewMode === 'decks'
                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400'
                            : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white'
                        }`}
                      >
                        <RectangleStackIcon className="h-4 w-4" />
                        <span>Deck View</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Filters - Only show when in card view or viewing specific deck */}
              {(viewMode === 'cards' || selectedDeckForView) && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-gray-800">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 dark:text-gray-200">Filters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                        Filter by Type
                      </label>
                      <select
                        value={selectedTypeFilter}
                        onChange={(e) => setSelectedTypeFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {FLASHCARD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Deck Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                        Filter by Deck
                      </label>
                      <select
                        value={selectedDeckFilter}
                        onChange={(e) => setSelectedDeckFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="All">All Decks</option>
                        {decks.map((deck) => (
                          <option key={deck._id} value={deck._id}>
                            {deck.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tags Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                        Filter by Tags
                      </label>
                      {allTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-300 rounded-md dark:border-gray-600">
                          {allTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => handleTagFilterChange(tag)}
                              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                selectedTagsFilter.includes(tag)
                                  ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:text-gray-400">
                          No tags available
                        </p>
                      )}
                      {selectedTagsFilter.length > 0 && (
                        <button
                          onClick={() => setSelectedTagsFilter([])}
                          className="mt-2 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          Clear Tag Filters ({selectedTagsFilter.length} selected)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Content based on view mode */}
              {viewMode === 'decks' && !selectedDeckForView ? (
                <DeckList 
                  decks={decks} 
                  flashcards={flashcards}
                  onDeckClick={handleDeckClick} 
                />
              ) : (
                <FlashcardList />
              )}
            </div>
          )}

          {currentPage === "create" && isAuthenticated && (
            <div id="create-page">
              <FlashcardForm />
            </div>
          )}

          {currentPage === "create" && !isAuthenticated && (
            <div className="text-center py-12 dark:text-gray-300">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 dark:text-gray-200">Authentication Required</h3>
              <p className="text-gray-600 mb-6 dark:text-gray-400">Please log in to create flashcards.</p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Login / Register
              </button>
            </div>
          )}

          {currentPage === "test" && (
            <div id="test-page">
              <TestTab />
            </div>
          )}

          {currentPage === "decks" && isAuthenticated && (
            <div id="decks-page">
              <DeckManager />
            </div>
          )}

          {currentPage === "decks" && !isAuthenticated && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 dark:text-gray-200">Authentication Required</h3>
              <p className="text-gray-600 mb-6 dark:text-gray-400">Please log in to manage decks.</p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Login / Register
              </button>
            </div>
          )}
        </main>

        {/* Modals */}
        <Modal />
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
