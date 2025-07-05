import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ArrowRightIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  ClipboardDocumentCheckIcon,
  TableCellsIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { fetchDictionaryWord, createFlashcard } from '../services/api';
import Footer from './Footer';

const Hero = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useFlashcardStore();
  const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
  const [vocabWord, setVocabWord] = useState('');
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabError, setVocabError] = useState('');
  const [vocabSuccess, setVocabSuccess] = useState('');
  const navigate = useNavigate();

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
      color: 'from-teal-500 to-cyan-600',
      to: '/problem-list'
    },
    {
      id: 'dsa',
      title: 'DSA Problem Solving',
      icon: SparklesIcon,
      shortDesc: 'Master Data Structures & Algorithms',
      longDesc: 'Create and practice flashcards for Data Structures and Algorithms problems. Devdecks allows you to store, tag, and link your flashcards. Each flashcard can include problem statements, hints, solutions, and even code snippets to help you understand and remember key concepts.',
      color: 'from-blue-500 to-purple-600',
      to: '/home?tab=content&view=decks&type=dsa'
    },
    {
      id: 'accounts',
      title: 'User Accounts',
      icon: UserGroupIcon,
      shortDesc: 'Personal learning journey tracking',
      longDesc: 'Create your personal account to create your own flashcards and decks. You can still access public flashcards without an account.',
      color: 'from-orange-500 to-red-600',
      action: () => {
        if (!isAuthenticated) {
          setIsAuthModalOpen(true);
        } else {
          navigate('/home?tab=content');
        }
      }
    },
    {
      id: 'tests',
      title: 'Interactive Testing',
      icon: AcademicCapIcon,
      shortDesc: 'Test your knowledge with interactive quizzes',
      longDesc: 'Take interactive tests using your flashcard collections. Our testing system supports multiple formats including markdown for technical questions and python code for programming problems. Perfect for DSA interview preparation and skill assessment.',
      color: 'from-purple-500 to-pink-600',
      to: '/test?section=technical'
    },
  ];

  const greFeatures = [
    {
      id: 'gre-words',
      title: 'GRE Words',
      icon: BookOpenIcon,
      shortDesc: 'Master GRE vocabulary with detailed word cards',
      longDesc: 'GRE Word cards provide comprehensive vocabulary learning with detailed definitions, example sentences, etymology, and similar words. Each card includes rich metadata to help you understand word roots, usage context, and related vocabulary. Perfect for building a strong GRE vocabulary foundation.',
      color: 'from-emerald-500 to-green-600',
      to: '/home?tab=content&view=cards&type=gre-word'
    },
    {
      id: 'gre-mcqs',
      title: 'GRE MCQs',
      icon: QuestionMarkCircleIcon,
      shortDesc: 'Practice GRE-style multiple choice questions',
      longDesc: 'GRE MCQ cards feature interactive multiple-choice questions with detailed explanations. Each question includes four options with immediate feedback on correct answers. The system tracks your performance and provides comprehensive explanations to help you understand the reasoning behind each answer.',
      color: 'from-cyan-500 to-blue-600',
      to: '/home?tab=content&view=decks&type=gre-mcq'
    },
    {
      id: 'gre-test',
      title: 'GRE Test Mode',
      icon: ClipboardDocumentCheckIcon,
      shortDesc: 'Take comprehensive GRE practice tests',
      longDesc: 'GRE Test mode combines both word and MCQ cards in an interactive testing environment. Practice with GRE Word cards to test your vocabulary knowledge and GRE MCQ cards to improve your reasoning skills. The test interface provides immediate feedback and detailed explanations for optimal learning.',
      color: 'from-violet-500 to-purple-600',
      to: '/test?section=gre'
    },
    {
      id: 'add-vocabulary',
      title: 'Add to Vocabulary',
      icon: BookOpenIcon,
      shortDesc: 'Build your vocabulary with dictionary lookup',
      longDesc: 'Type any word and automatically create a GRE-Word flashcard with dictionary data. Our system fetches definitions, example sentences, etymology, and synonyms from reliable dictionary sources, then pre-fills a flashcard for you to customize and save.',
      color: 'from-yellow-400 to-orange-500',
      action: () => handleAddToVocab()
    }
  ];

  const openCard = (cardId) => setExpandedCard(cardId);
  const closeCard = () => setExpandedCard(null);

  const expandedFeature = features.find(f => f.id === expandedCard) || greFeatures.find(f => f.id === expandedCard);

  const handleAddToVocab = () => {
    setIsVocabModalOpen(true);
    setVocabError('');
    setVocabSuccess('');
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
      const data = await fetchDictionaryWord(vocabWord.trim());
      
      // Debug: Log the API response
      // console.log('Merriam-Webster API Response:', data);
      
      const flashcardData = {
        question: data.word || vocabWord.trim(),
        explanation: data.definition || 'No definition available',
        hint: data.example || 'No example sentence available',
        problemStatement: data.synonyms && data.synonyms.length > 0 ? data.synonyms.join(', ') : 'No synonyms available',
        code: data.origin || 'No etymology information available',
        type: 'GRE-Word',
        tags: ['vocabulary', 'gre'],
        isPublic: false,
        metadata: {
          exampleSentence: data.example || '',
          wordRoot: data.origin || '',
          similarWords: data.synonyms || [],
        }
      };
      
      // Debug: Log the flashcard data
      // console.log('Flashcard Data:', flashcardData);
      
      await createFlashcard(flashcardData);
      setVocabSuccess(`Successfully created flashcard for "${vocabWord.trim()}"!`);
      setTimeout(() => {
        setIsVocabModalOpen(false);
        setVocabSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Error creating flashcard:', err);
      setVocabError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setVocabLoading(false);
    }
  };
  
  const handleVocabModalClose = () => setIsVocabModalOpen(false);

  const Card = ({ feature }) => {
    const content = (
      <div
        className={`relative p-8 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col justify-between bg-gradient-to-br ${feature.color}`}
      >
        <div>
          <div className="flex items-center space-x-4">
            <feature.icon className="h-10 w-10 text-white" />
            <h3 className="text-xl font-bold text-white">{feature.title}</h3>
          </div>
          <p className="mt-4 text-white text-opacity-90">{feature.shortDesc}</p>
        </div>
        <div className="mt-6">
          <span className="text-white font-semibold hover:underline" onClick={(e) => { e.preventDefault(); openCard(feature.id); }}>Learn more &rarr;</span>
        </div>
      </div>
    );

    const commonProps = {
        className: "block h-full cursor-pointer"
    };

    if (feature.to) {
        return <Link to={feature.to} {...commonProps}>{content}</Link>
    }

    return <div onClick={feature.action} {...commonProps}>{content}</div>
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <header className="relative px-4 py-6">
        <button
          onClick={toggleDarkMode}
          className="absolute top-6 left-4 flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 dark:text-gray-100 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>

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

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6">
            🧠 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">DevDecks</span>
          </h1>
          <p className="text-2xl text-gray-600 max-w-9xl mx-auto dark:text-gray-400 mb-8">
          DevDecks is an all-in-one platform created for CS Students and Developers for mastering DSA and System Design through customizable, intelligent, interactive flashcards. Click on the cards below to get started, happy learning!
          </p>
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            <span>Get Started</span>
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>


        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">
            Core Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {features.map((feature) => (
              <Card key={feature.id} feature={feature} />
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">
            🎓 DevDecks-GRE
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center max-w-3xl mx-auto mb-12">
            Specialized GRE preparation tools with interactive vocabulary learning and practice questions
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {greFeatures.map((feature) => (
              <Card key={feature.id} feature={feature} />
            ))}
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />

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

        {/* <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  🧠 DevDecks
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Made with ❤️ by Ameya Kolhatkar
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
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

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} DevDecks. All rights reserved.
              </p>
            </div>
          </div>
        </footer> */}
        {/* <Footer /> */}
      </main>

      {expandedFeature && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40"
          onClick={closeCard}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
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
              <div className="mt-8 text-right">
                <button
                  onClick={() => {
                    if (expandedFeature.to) {
                      navigate(expandedFeature.to);
                    } else if (expandedFeature.action) {
                      expandedFeature.action();
                    }
                    closeCard();
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Try it now
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