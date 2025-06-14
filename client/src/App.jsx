import React, { useState, useEffect } from "react";
import FlashcardForm from "./components/FlashcardForm";
import FlashcardList from "./components/FlashcardList";
import Modal from "./components/Modal";
import DeckManager from "./components/DeckManager";
import TestTab from "./components/TestTab";
import AuthModal from "./components/AuthModal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import useFlashcardStore from "./store/flashcardStore";
import {
  DocumentPlusIcon,
  EyeIcon,
  SquaresPlusIcon,
  ListBulletIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

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
    selectedTypeFilter,
    setSelectedTypeFilter,
    selectedDeckFilter,
    setSelectedDeckFilter,
    allTags,
    selectedTagsFilter,
    setSelectedTagsFilter,
    fetchDecks,
    currentPage,
    setCurrentPage,
  } = useFlashcardStore();

  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const navButtonBaseClasses =
    "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";
  const activeNavButtonClasses = "bg-indigo-600 text-white shadow-lg";
  const inactiveNavButtonClasses =
    "text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 border border-gray-200";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex justify-between items-center mb-6">
            <div></div> {/* Spacer */}
            <h1 className="text-4xl font-bold text-gray-800">
              🧠 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">FlashCard Master</span>
            </h1>
            
            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <UserIcon className="h-4 w-4" />
                    <span>Welcome, {user?.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create flashcards for DSA, System Design, etc.
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
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Type
                    </label>
                    <select
                      value={selectedTypeFilter}
                      onChange={(e) => setSelectedTypeFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Deck
                    </label>
                    <select
                      value={selectedDeckFilter}
                      onChange={(e) => setSelectedDeckFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Tags
                    </label>
                    {allTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-300 rounded-md">
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
                    ) : (
                      <p className="text-sm text-gray-500 p-2 border border-gray-300 rounded-md">
                        No tags available
                      </p>
                    )}
                    {selectedTagsFilter.length > 0 && (
                      <button
                        onClick={() => setSelectedTagsFilter([])}
                        className="mt-2 text-xs text-indigo-600 hover:underline"
                      >
                        Clear Tag Filters ({selectedTagsFilter.length} selected)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <FlashcardList />
            </div>
          )}

          {currentPage === "create" && isAuthenticated && (
            <div id="create-page">
              <FlashcardForm />
            </div>
          )}

          {currentPage === "create" && !isAuthenticated && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Authentication Required</h3>
              <p className="text-gray-600 mb-6">Please log in to create flashcards.</p>
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
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Authentication Required</h3>
              <p className="text-gray-600 mb-6">Please log in to manage decks.</p>
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
