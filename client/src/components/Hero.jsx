import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './auth/AuthModal';
import useFlashcardStore from '../store/flashcardStore';
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  SparklesIcon,
  RectangleStackIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Hero = ({ onGetStarted }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useFlashcardStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
  };

  const features = [
    {
      id: 'dsa',
      title: 'DSA Problem Solving',
      icon: SparklesIcon,
      shortDesc: 'Master Data Structures & Algorithms',
      longDesc: 'Create and practice flashcards for Data Structures and Algorithms problems. Devdecks allows you to store, tag, and link your flashcards. Each flashcard can include problem statements, hints, solutions, and even code snippets to help you understand and remember key concepts.',
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'decks',
      title: 'Organized Decks',
      icon: RectangleStackIcon,
      shortDesc: 'Organize your learning with custom decks',
      longDesc: 'Create custom decks to organize your flashcards by topic, difficulty, or any category that works for you. Share your decks with others or keep them private. You can test yourself on your personal decks, or publicly available decks .',
      color: 'from-green-500 to-teal-600'
    },
    {
      id: 'accounts',
      title: 'User Accounts',
      icon: UserGroupIcon,
      shortDesc: 'Personal learning journey tracking',
      longDesc: 'Create your personal account to create your own flashcards and decks. You can still access public flashcards without an account.',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'tests',
      title: 'Interactive Testing',
      icon: AcademicCapIcon,
      shortDesc: 'Test your knowledge with interactive quizzes',
      longDesc: 'Take interactive tests using your flashcard collections. Our testing system supports multiple formats including markdown for technical questions and python code for programming problems. Perfect for DSA interview preparation and skill assessment.',
      color: 'from-purple-500 to-pink-600'
    }
  ];

  const openCard = (cardId) => {
    setExpandedCard(cardId);
  };

  const closeCard = () => {
    setExpandedCard(null);
  };

  const expandedFeature = features.find(f => f.id === expandedCard);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="relative px-4 py-6">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="absolute top-6 left-4 flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 dark:text-gray-100 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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

        {/* Auth Section */}
        <div className="absolute top-6 right-4">
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            🧠 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">DevDecks</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8">
            Master Data Structures, Algorithms, and System Design with our intelligent flashcard platform. 
            Create, organize, and test your knowledge with interactive flashcards designed specifically for 
            technical interview preparation and programming skill development.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onGetStarted}
              className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 text-lg font-semibold shadow-lg"
            >
              <span>Get Started</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => openCard(feature.id)}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.shortDesc}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Expanded Card Modal */}
      {expandedCard && expandedFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${expandedFeature.color} flex items-center justify-center`}>
                    <expandedFeature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {expandedFeature.title}
                  </h2>
                </div>
                <button
                  onClick={closeCard}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {expandedFeature.longDesc}
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onGetStarted}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <span>Try it now</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default Hero; 