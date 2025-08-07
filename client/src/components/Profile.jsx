import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useFlashcardStore from '../store/flashcardStore';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import DeckCard from './deck/DeckCard';
import {
  RectangleStackIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { isGREMode, getNavigationLinks } from '../utils/greUtils';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const { darkMode, decks, flashcards, fetchDecks, fetchFlashcards, setShowFavoritesOnly } = useFlashcardStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState('profile'); // 'profile', 'your-decks', 'recent-decks', 'completed-problems'
  const [userDecks, setUserDecks] = useState([]);
  const [recentDecks, setRecentDecks] = useState([]);
  const [completedProblems, setCompletedProblems] = useState([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  
  // Get navigation links based on current mode
  const navLinks = getNavigationLinks(location.pathname);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDecks();
      fetchFlashcards();
    }
  }, [isAuthenticated, fetchDecks, fetchFlashcards]);

  // Sync currentView with tab param on mount and when tab changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'myDecks') setCurrentView('your-decks');
    else if (tab === 'favorites') setCurrentView('favorites');
    else if (tab === 'recents') setCurrentView('recent-decks');
    else if (tab === 'completedProblems') setCurrentView('completed-problems');
    else setCurrentView('profile');
  }, [searchParams]);

  // Filter decks to show only user's created decks
  useEffect(() => {
    if (decks && user) {
      const filteredDecks = decks.filter(deck => {
        if (typeof deck.user === 'string') {
          return deck.user === user._id;
        } else if (typeof deck.user === 'object' && deck.user._id) {
          return deck.user._id === user._id;
        }
        return false;
      });
      setUserDecks(filteredDecks);
    }
  }, [decks, user]);

  // Filter recent decks based on user's recents array
  useEffect(() => {
    if (decks && user && user.recents) {
      // Sort recents by lastAccessed (most recent first) and get corresponding deck objects
      const sortedRecents = [...user.recents].sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
      const recentDeckObjects = sortedRecents
        .map(recent => decks.find(deck => deck._id === recent.deckId))
        .filter(deck => deck !== undefined); // Remove any decks that no longer exist
      setRecentDecks(recentDeckObjects);
    }
  }, [decks, user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please log in to view your profile
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You need to be logged in to access your profile page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate flashcard count for each deck
  const getDeckFlashcardCount = (deckId) => {
    if (!flashcards || !Array.isArray(flashcards)) return 0;
    return flashcards.filter(card => 
      card.decks && card.decks.some(d => 
        typeof d === 'string' ? d === deckId : d._id === deckId
      )
    ).length;
  };

  const handleDeckClick = (deck) => {
    navigate(`${navLinks.deckView}?deck=${deck._id}`);
  };

  const handleYourDecksClick = () => {
    setCurrentView('your-decks');
    setSearchParams({ tab: 'myDecks' });
  };

  const handleBackToProfile = () => {
    setCurrentView('profile');
  };

  const handleFavoritesClick = () => {
    navigate(`${navLinks.home}?tab=content&view=decks&showFavoritesOnly=true`);
  };

  const handleRecentDecksClick = () => {
    setCurrentView('recent-decks');
    setSearchParams({ tab: 'recents' });
  };

  const handleCompletedProblemsClick = async () => {
    setCurrentView('completed-problems');
    setSearchParams({ tab: 'completedProblems' });
    setLoadingCompleted(true);
    try {
      const response = await fetch('/leetcode_companies_zerotrac.csv');
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      const problemsData = lines.slice(1).map((line) => {
        const values = line.split(',');
        const companies = values[2] ? values[2].split(';').map(c => c.trim()).filter(Boolean) : [];
        const tags = values[3] ? values[3].split(';').map(tag => tag.trim()).filter(Boolean) : [];
        return {
          Title: values[0] || '',
          Rating: parseFloat(values[1]) || 0,
          companies: companies,
          tags: tags
        };
      });
      // Filter only completed problems
      const completed = problemsData.filter(p => user.problemsCompleted?.includes(p.Title));
      setCompletedProblems(completed);
    } catch (err) {
      setCompletedProblems([]);
    }
    setLoadingCompleted(false);
  };

  const handleAddCard = (problem) => {
            navigate(`${navLinks.home}?tab=create&type=DSA&question=${encodeURIComponent(problem.Title)}&isPublic=false`);
  };

  // If viewing "Your Decks", show the deck list
  if (currentView === 'your-decks') {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header with back button */}
          <div className="flex items-center mb-8">
            <button
              onClick={handleBackToProfile}
              className="flex items-center p-2 sm:px-4 sm:py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline ml-2">Back to Profile</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Your Decks ({userDecks.length})
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and view all the decks you've created
              </p>
            </div>
          </div>

          {/* Your Decks Grid */}
          {userDecks.length === 0 ? (
            <div className="text-center py-12">
              <RectangleStackIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No decks created yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first deck to organize your flashcards!
              </p>
              <button
                onClick={() => navigate(`${navLinks.home}?tab=create`)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Your First Deck
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userDecks.map((deck) => (
                <DeckCard
                  key={deck._id}
                  deck={deck}
                  onDeckClick={handleDeckClick}
                  flashcardCount={getDeckFlashcardCount(deck._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If viewing "Recent Decks", show the deck list
  if (currentView === 'recent-decks') {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header with back button */}
          <div className="flex items-center mb-8">
            <button
              onClick={handleBackToProfile}
              className="flex items-center p-2 sm:px-4 sm:py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline ml-2">Back to Profile</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Recent Decks ({recentDecks.length})
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Quick access to recently viewed decks
              </p>
            </div>
          </div>

          {/* Recent Decks Grid */}
          {recentDecks.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No recent decks
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start browsing decks to see your recent activity here!
              </p>
              <button
                onClick={() => navigate('/home?view=decks')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Browse Decks
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentDecks.map((deck) => (
                <DeckCard
                  key={deck._id}
                  deck={deck}
                  onDeckClick={handleDeckClick}
                  flashcardCount={getDeckFlashcardCount(deck._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'completed-problems') {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={handleBackToProfile}
              className="flex items-center p-2 sm:px-4 sm:py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline ml-2">Back to Profile</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Completed Problems ({completedProblems.length})
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Problems you've marked as completed
              </p>
            </div>
          </div>
          {loadingCompleted ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-300">Loading...</div>
          ) : completedProblems.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-300">No completed problems found.</div>
          ) : (
            <div className="overflow-x-auto mt-8">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Companies</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tags</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Add Card</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {completedProblems.map((problem, idx) => (
                    <tr key={problem.Title + idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer" onClick={() => window.open(`https://leetcode.com/problems/${problem.Title}`, '_blank')}>{problem.Title.replace(/-/g, ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{problem.Rating}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {problem.companies.slice(0, 3).map((company, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">{company}</span>
                          ))}
                          {problem.companies.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">+{problem.companies.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {problem.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">{tag}</span>
                          ))}
                          {problem.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">+{problem.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button onClick={() => handleAddCard(problem)} className="inline-flex items-center justify-center px-2 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors" title="Add Card">
                          <span className="text-lg font-bold">+</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Helper function to adjust gradient colors based on dark mode
  const getAdjustedColor = (color) => {
    if (darkMode) {
      return color.replace(/from-(\w+)-(\d+)/, 'from-$1-$2').replace(/to-(\w+)-(\d+)/, (match, colorName, shade) => {
        const newShade = Math.min(parseInt(shade) + 100, 900);
        return `to-${colorName}-${newShade}`;
      });
    } else {
      return color;
    }
  };

  const profileCards = [
    {
      id: 'your-decks',
      title: 'Your Decks',
      description: 'View and manage all the decks you\'ve created',
      count: userDecks.length,
      icon: RectangleStackIcon,
      color: 'from-blue-500 to-purple-600',
      onClick: handleYourDecksClick,
    },
    {
      id: 'favorites',
      title: 'Your Favorites',
      description: 'Browse decks you\'ve marked as favorites',
      count: user.favorites?.length || 0,
      icon: HeartIcon,
      color: 'from-red-500 to-pink-600',
      onClick: handleFavoritesClick,
    },
    {
      id: 'recent-decks',
      title: 'Recent Decks',
      description: 'Quick access to recently viewed decks',
      count: recentDecks.length,
      icon: ClockIcon,
      color: 'from-green-500 to-emerald-600',
      onClick: handleRecentDecksClick,
    },
    {
      id: 'completed-problems',
      title: 'Completed Problems',
      description: 'View your LeetCode progress and related flashcards',
      count: user.problemsCompleted?.length || 0,
      icon: CheckCircleIcon,
      color: 'from-purple-500 to-violet-600',
      onClick: handleCompletedProblemsClick,
    },
  ];

  const ProfileCard = ({ card }) => {
    const IconComponent = card.icon;
    const adjustedColor = getAdjustedColor(card.color);

    return (
      <div
        onClick={card.onClick}
        className={`relative p-8 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col justify-between bg-gradient-to-br ${adjustedColor} transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:-translate-y-3 cursor-pointer group`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <IconComponent className="h-10 w-10 text-white" />
              <div>
                <h3 className="text-xl font-bold text-white">{card.title}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                  {card.count}
                </span>
              </div>
            </div>
            <ArrowRightIcon className="h-6 w-6 text-white opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <p className="text-white text-opacity-90">{card.description}</p>
        </div>
        <div className="mt-6">
          <span className="text-white font-semibold">
            Explore &rarr;
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-6">
            👤 <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Welcome back, {user.username}!
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Manage your decks, track your progress, and access your favorites all in one place.
          </p>
        </div>

        {/* Profile Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                {userDecks.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Decks Created
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {user.problemsCompleted?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Problems Solved
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {user.favorites?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Favorite Decks
              </div>
            </div>
          </div>
        </div>

        {/* Main Profile Cards - 2x2 Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">
            Your Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {profileCards.map((card) => (
              <ProfileCard key={card.id} card={card} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Quick Actions
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate(`${navLinks.home}?tab=manage`)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              Create New Deck
            </button>
            <button 
              onClick={() => navigate('/home?view=decks')}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
            >
              Browse All Decks
            </button>
            <button 
              onClick={() => navigate('/problem-list')}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
            >
              View LeetCode Problems
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 