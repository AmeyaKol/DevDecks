import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './auth/AuthModal';
import useFlashcardStore from '../store/flashcardStore';
import ProblemList from './ProblemList';
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  SparklesIcon,
  RectangleStackIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  ClipboardDocumentCheckIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { fetchDictionaryWord, createFlashcard } from '../services/api';

const Hero = ({ onGetStarted }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showProblemList, setShowProblemList] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleDarkMode, setCurrentPage, setViewMode, navigateToGREWords, navigateToGREMCQs, navigateToGRETest, navigateToDSA } = useFlashcardStore();
  const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
  const [vocabWord, setVocabWord] = useState('');
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabError, setVocabError] = useState('');
  const [vocabSuccess, setVocabSuccess] = useState('');

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
      id: 'problem-list',
      title: 'Problem List',
      icon: TableCellsIcon,
      shortDesc: 'Browse LeetCode problems with advanced filtering',
      longDesc: 'Inspired by ZeroTrac, I have collected a comprehensive database of LeetCode problems with advanced search and filtering capabilities. Sort by difficulty rating, filter by tags like Array, Graph, Dynamic Programming, and more. Each problem title links directly to the LeetCode problem page for easy access.',
      color: 'from-teal-500 to-cyan-600'
    },
    {
      id: 'dsa',
      title: 'DSA Problem Solving',
      icon: SparklesIcon,
      shortDesc: 'Master Data Structures & Algorithms',
      longDesc: 'Create and practice flashcards for Data Structures and Algorithms problems. Devdecks allows you to store, tag, and link your flashcards. Each flashcard can include problem statements, hints, solutions, and even code snippets to help you understand and remember key concepts.',
      color: 'from-blue-500 to-purple-600'
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
    },

  ];

  const greFeatures = [
    {
      id: 'gre-words',
      title: 'GRE Words',
      icon: BookOpenIcon,
      shortDesc: 'Master GRE vocabulary with detailed word cards',
      longDesc: 'GRE Word cards provide comprehensive vocabulary learning with detailed definitions, example sentences, etymology, and similar words. Each card includes rich metadata to help you understand word roots, usage context, and related vocabulary. Perfect for building a strong GRE vocabulary foundation.',
      color: 'from-emerald-500 to-green-600'
    },
    {
      id: 'gre-mcqs',
      title: 'GRE MCQs',
      icon: QuestionMarkCircleIcon,
      shortDesc: 'Practice GRE-style multiple choice questions',
      longDesc: 'GRE MCQ cards feature interactive multiple-choice questions with detailed explanations. Each question includes four options with immediate feedback on correct answers. The system tracks your performance and provides comprehensive explanations to help you understand the reasoning behind each answer.',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'gre-test',
      title: 'GRE Test Mode',
      icon: ClipboardDocumentCheckIcon,
      shortDesc: 'Take comprehensive GRE practice tests',
      longDesc: 'GRE Test mode combines both word and MCQ cards in an interactive testing environment. Practice with GRE Word cards to test your vocabulary knowledge and GRE MCQ cards to improve your reasoning skills. The test interface provides immediate feedback and detailed explanations for optimal learning.',
      color: 'from-violet-500 to-purple-600'
    },
    {
      id: 'add-vocabulary',
      title: 'Add to Vocabulary',
      icon: BookOpenIcon,
      shortDesc: 'Build your vocabulary with dictionary lookup',
      longDesc: 'Type any word and automatically create a GRE-Word flashcard with dictionary data. Our system fetches definitions, example sentences, etymology, and synonyms from reliable dictionary sources, then pre-fills a flashcard for you to customize and save.',
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  // Handle different "Try it now" button clicks based on card type
  const handleTryItNow = (cardId) => {
    switch (cardId) {
      case 'dsa':
        // DSA Problem Solving: Go to homepage with DSA filter
        onGetStarted();
        navigateToDSA();
        break;

      case 'decks':
        // Organized Decks: Open homepage in deck view
        onGetStarted();
        setCurrentPage('cards');
        setViewMode('decks');
        break;

      case 'accounts':
        // User Accounts: Prompt login/register if not authenticated, otherwise go to deck view
        if (!isAuthenticated) {
          setIsAuthModalOpen(true);
        } else {
          onGetStarted();
          setCurrentPage('cards');
          setViewMode('decks');
        }
        break;

      case 'tests':
        // Interactive Testing: Go to test tab
        onGetStarted();
        setCurrentPage('test');
        break;

      case 'gre-words':
        // GRE Words: Go to deck view filtered for GRE-Word type
        onGetStarted();
        navigateToGREWords();
        break;

      case 'gre-mcqs':
        // GRE MCQs: Go to deck view filtered for GRE-MCQ type
        onGetStarted();
        navigateToGREMCQs();
        break;

      case 'gre-test':
        // GRE Test: Go to test tab with GRE deck filtering
        onGetStarted();
        navigateToGRETest();
        break;

      case 'add-vocabulary':
        // Add to Vocabulary: Open vocabulary modal
        handleAddToVocab();
        break;

      case 'problem-list':
        onGetStarted();
        // if (typeof window.setCurrentPage === 'function') {
        //   window.setCurrentPage('problem-list');
        // }
        setCurrentPage('problem-list');
        break;

      default:
        // Default behavior
        onGetStarted();
        break;
    }
    closeCard(); // Close the expanded card modal
  };

  const openCard = (cardId) => {
    setExpandedCard(cardId);
  };

  const closeCard = () => {
    setExpandedCard(null);
  };

  const expandedFeature = features.find(f => f.id === expandedCard);
  const expandedGREFeature = greFeatures.find(f => f.id === expandedCard);

  const handleAddToVocab = () => {
    setIsVocabModalOpen(true);
    setVocabError(''); // Clear any previous errors
    setVocabSuccess(''); // Clear any previous success messages
    setVocabWord('');
  };

  const handleVocabSubmit = async () => {
    if (!vocabWord.trim()) {
      setVocabError('Please enter a word.');
      return;
    }

    if (!isAuthenticated) {
      setVocabError('Please login to create flashcards.');
      return;
    }

    setVocabLoading(true);
    setVocabError('');
    setVocabSuccess('');
    
    try {
      // Fetch dictionary data
      const data = await fetchDictionaryWord(vocabWord.trim());
      console.log('Dictionary data received:', data);
      console.log('Example field:', data.example);
      console.log('Synonyms field:', data.synonyms);
      console.log('Origin field:', data.origin);
      
      // Prepare flashcard data with better fallbacks
      const flashcardData = {
        question: data.word || vocabWord.trim(),
        explanation: data.definition || 'No definition available',
        hint: data.example || 'No example sentence available',
        problemStatement: data.synonyms && data.synonyms.length > 0 ? data.synonyms.join(', ') : 'No synonyms available',
        code: data.origin || 'No etymology information available',
        type: 'GRE-Word',
        tags: ['vocabulary', 'gre'],
        isPublic: true,
        metadata: {
          origin: data.origin || '',
          synonyms: data.synonyms || [],
          example: data.example || '',
          phonetic: data.phonetic || '',
          partOfSpeech: data.partOfSpeech || ''
        }
      };

      console.log('Final flashcard data being sent:', flashcardData);

      // Create the flashcard
      const createdFlashcard = await createFlashcard(flashcardData);
      console.log('Flashcard created successfully:', createdFlashcard);
      
      setVocabSuccess(`Successfully created GRE-Word flashcard for "${data.word || vocabWord.trim()}"!`);
      setVocabWord('');
      
      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setIsVocabModalOpen(false);
        setVocabSuccess('');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating vocabulary flashcard:', err);
      if (err.response?.status === 401) {
        setVocabError('Please login to create flashcards.');
      } else if (err.response?.data?.error) {
        setVocabError(err.response.data.error);
      } else {
        setVocabError('Failed to create flashcard. Please try again.');
      }
    } finally {
      setVocabLoading(false);
    }
  };

  const handleVocabModalClose = () => {
    setIsVocabModalOpen(false);
    setVocabError('');
    setVocabSuccess('');
    setVocabWord('');
    setVocabLoading(false);
  };

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
            DevDecks is an all-in-one platform for mastering DSA and System Design through intelligent, interactive flashcards. This website is specifically created for CS Students and Developers, allowing them to design specialized flashcards for DSA-style questions, as well as general flashcards for System Design or Behavioural Questions. Click on the cards below to get started, and explore the various features provided on this website.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => { onGetStarted(); navigateToDSA(); }}
              className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 text-lg font-semibold shadow-lg"
            >
              <span>Get Started</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">
            Core Features
          </h2>
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
        </div>

        {/* GRE Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">
            🎓 DevDecks-GRE
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center max-w-3xl mx-auto mb-12">
            Specialized GRE preparation tools with interactive vocabulary learning and practice questions
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {greFeatures.map((feature) => {
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
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />

        {/* Vocab Modal (stub) */}
        {isVocabModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={handleVocabModalClose} aria-label="Close">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Add to Vocabulary</h2>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100 mb-4"
                placeholder="Enter a word..."
                value={vocabWord}
                onChange={e => setVocabWord(e.target.value)}
                disabled={vocabLoading}
              />
              {vocabError && <div className="text-red-500 text-sm mb-2">{vocabError}</div>}
              {vocabSuccess && <div className="text-green-500 text-sm mb-2">{vocabSuccess}</div>}
              <button
                onClick={handleVocabSubmit}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
                disabled={vocabLoading || !vocabWord}
              >
                {vocabLoading ? 'Creating...' : 'Create GRE Word Card'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              {/* Brand */}
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  🧠 DevDecks
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Made with ❤️ by Ameya Kolhatkar
                </p>
              </div>

              {/* Social Links and Contact */}
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                {/* Social Media Links */}
                <div className="flex space-x-4">
                  <a
                    href="https://instagram.com/kol.hat.kar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
                    title="My Instagram"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  <a
                    href="https://linkedin.com/in/ameyakol1402"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Connect on LinkedIn"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                </div>

                {/* Contact Button */}
                {/* <a
                  href="mailto:ameyajay@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  style={{ textDecoration: 'none' }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Suggest Features
                </a> */}
                <button
                  onClick={() => {
                    window.open(
                      'https://mail.google.com/mail/?view=cm&fs=1&to=ameyajay@gmail.com&su=DevDecks%20Suggestion&body=Hi%20Ameya%2C%0A%0AI%20have%20a%20suggestion%20for%20DevDecks...',
                      '_blank'
                    );
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  style={{ textDecoration: 'none' }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Suggest Features
                </button>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} DevDecks. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Expanded Card Modal */}
      {(expandedCard && expandedFeature) && (
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
                  onClick={() => handleTryItNow(expandedFeature.id)}
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

      {/* Expanded GRE Card Modal */}
      {(expandedCard && expandedGREFeature) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${expandedGREFeature.color} flex items-center justify-center`}>
                    <expandedGREFeature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {expandedGREFeature.title}
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
                {expandedGREFeature.longDesc}
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleTryItNow(expandedGREFeature.id)}
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
    </div>
  );
};

export default Hero; 