import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useFlashcardStore from '../store/flashcardStore';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import DeckCard from './deck/DeckCard';
import {
  RectangleStackIcon,
  FolderIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { isGREMode, getNavigationLinks } from '../utils/greUtils';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const { darkMode, decks, flashcards, folders, fetchDecks, fetchFlashcards, fetchFolders, setShowFavoritesOnly } = useFlashcardStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState('profile'); // 'profile', 'your-decks', 'your-folders', 'recent-decks', 'completed-problems'
  const [userDecks, setUserDecks] = useState([]);
  const [userFolders, setUserFolders] = useState([]);
  const [recentDecks, setRecentDecks] = useState([]);
  const [completedProblems, setCompletedProblems] = useState([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  
  // Get navigation links based on current mode
  const navLinks = getNavigationLinks(location.pathname);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDecks();
      fetchFlashcards();
      fetchFolders();
    }
  }, [isAuthenticated, fetchDecks, fetchFlashcards, fetchFolders]);

  // Sync currentView with tab param on mount and when tab changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'myDecks') setCurrentView('your-decks');
    else if (tab === 'myFolders') setCurrentView('your-folders');
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

  // Filter folders to show only user's created folders
  useEffect(() => {
    if (folders && user) {
      const filteredFolders = folders.filter(folder => {
        if (typeof folder.user === 'string') {
          return folder.user === user._id;
        } else if (typeof folder.user === 'object' && folder.user._id) {
          return folder.user._id === user._id;
        }
        return false;
      });
      setUserFolders(filteredFolders);
    }
  }, [folders, user]);

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
      <div className="w-full min-h-screen bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center border border-stone-300 dark:border-stone-800 rounded-md bg-white dark:bg-stone-900/50 p-8">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4">
              Please log in to view your profile
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
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

  const handleYourFoldersClick = () => {
    setCurrentView('your-folders');
    setSearchParams({ tab: 'myFolders' });
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

  const handleEODRevisionClick = () => {
    navigate(`${navLinks.home.replace('/home', '')}/eod-revision`);
  };

  const handleAddCard = (problem) => {
            navigate(`${navLinks.home}?tab=create&type=DSA&question=${encodeURIComponent(problem.Title)}&isPublic=false`);
  };

  // If viewing "Your Decks", show the deck list
  if (currentView === 'your-decks') {
    return (
      <div className="w-full min-h-screen bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header with back button */}
          <div className="flex items-center mb-8 border-b border-stone-300 dark:border-stone-800 pb-6">
            <button
              onClick={handleBackToProfile}
              className="flex items-center px-3 py-2 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-400 rounded hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 transition-colors mr-4 active:scale-[0.98]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-2 text-sm">Back to Profile</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                Your Decks ({userDecks.length})
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Manage and view all the decks you've created
              </p>
            </div>
          </div>

          {/* Your Decks Grid */}
          {userDecks.length === 0 ? (
            <div className="text-center py-12 border border-stone-300 dark:border-stone-800 rounded-md bg-white dark:bg-stone-900/50 transition-colors">
              <RectangleStackIcon className="h-12 w-12 text-stone-400 dark:text-stone-600 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-2">
                No decks created yet
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
                Create your first deck to organize your flashcards!
              </p>
              <button
                onClick={() => navigate(`${navLinks.home}?tab=create`)}
                className="px-4 py-2 bg-brand-600 text-white text-sm rounded hover:bg-brand-500 transition-colors active:scale-[0.98] border border-brand-500"
              >
                Create Your First Deck
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

  // If viewing "Your Folders", show the folder list
  if (currentView === 'your-folders') {
    return (
      <div className="w-full min-h-screen bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header with back button */}
          <div className="flex items-center mb-8 border-b border-stone-300 dark:border-stone-800 pb-6">
            <button
              onClick={handleBackToProfile}
              className="flex items-center px-3 py-2 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-400 rounded hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 transition-colors mr-4 active:scale-[0.98]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-2 text-sm">Back to Profile</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                Your Folders ({userFolders.length})
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Organize your decks into collections
              </p>
            </div>
          </div>

          {/* Folders Grid */}
          {userFolders.length === 0 ? (
            <div className="text-center py-12 border border-stone-300 dark:border-stone-800 rounded-md bg-white dark:bg-stone-900/50 transition-colors">
              <FolderIcon className="h-12 w-12 text-stone-400 dark:text-stone-600 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-2">
                No folders yet
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
                Create your first folder to organize your decks into collections.
              </p>
              <button
                onClick={() => navigate(`${navLinks.home}?tab=manage`)}
                className="px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-500 transition-colors active:scale-[0.98] border border-amber-500"
              >
                Create Your First Folder
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userFolders.map((folder) => (
                <div
                  key={folder._id}
                  className="bg-white dark:bg-stone-900 rounded-lg border border-stone-300 dark:border-stone-800 hover:border-brand-400 dark:hover:border-stone-600 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-sm"
                  onClick={() => navigate(`/folderView?folder=${folder._id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                          <FolderIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{folder.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-stone-600 dark:text-stone-400">
                            <span>{folder.decks?.length || 0} {(folder.decks?.length || 0) === 1 ? 'deck' : 'decks'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {folder.description && (
                      <p className="text-stone-600 dark:text-stone-400 text-sm mb-4 line-clamp-2">
                        {folder.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-700">
                      <div className="text-xs text-stone-500 dark:text-stone-500">
                        {folder.createdAt && new Date(folder.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-stone-600 dark:text-stone-400">
                        <span className={`px-2 py-1 rounded-full ${
                          folder.isPublic 
                            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-800' 
                            : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-600'
                        }`}>
                          {folder.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
      <div className="w-full min-h-screen bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header with back button */}
          <div className="flex items-center mb-8 border-b border-stone-300 dark:border-stone-800 pb-6">
            <button
              onClick={handleBackToProfile}
              className="flex items-center px-3 py-2 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-400 rounded hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 transition-colors mr-4 active:scale-[0.98]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-2 text-sm">Back to Profile</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                Recent Decks ({recentDecks.length})
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Quick access to recently viewed decks
              </p>
            </div>
          </div>

          {/* Recent Decks Grid */}
          {recentDecks.length === 0 ? (
            <div className="text-center py-12 border border-stone-300 dark:border-stone-800 rounded-md bg-white dark:bg-stone-900/50 transition-colors">
              <ClockIcon className="h-12 w-12 text-stone-400 dark:text-stone-600 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-2">
                No recent decks
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
                Start browsing decks to see your recent activity here!
              </p>
              <button
                onClick={() => navigate('/home?view=decks')}
                className="px-4 py-2 bg-brand-600 text-white text-sm rounded hover:bg-brand-500 transition-colors active:scale-[0.98] border border-brand-500"
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
      <div className="w-full min-h-screen bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center mb-8 border-b border-stone-300 dark:border-stone-800 pb-6">
            <button
              onClick={handleBackToProfile}
              className="flex items-center px-3 py-2 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-400 rounded hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 transition-colors mr-4 active:scale-[0.98]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-2 text-sm">Back to Profile</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                Completed Problems ({completedProblems.length})
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Problems you've marked as completed
              </p>
            </div>
          </div>
          {loadingCompleted ? (
            <div className="text-center py-12 text-stone-600 dark:text-stone-400">Loading...</div>
          ) : completedProblems.length === 0 ? (
            <div className="text-center py-12 text-stone-600 dark:text-stone-400">No completed problems found.</div>
          ) : (
            <div className="overflow-x-auto mt-8 bg-white dark:bg-stone-900 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-stone-300 dark:divide-stone-700">
                <thead className="bg-stone-100 dark:bg-stone-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Companies</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Tags</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Add Card</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-stone-900 divide-y divide-stone-200 dark:divide-stone-700">
                  {completedProblems.map((problem, idx) => (
                    <tr key={problem.Title + idx} className="hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-600 dark:text-brand-400 hover:underline cursor-pointer" onClick={() => window.open(`https://leetcode.com/problems/${problem.Title}`, '_blank')}>{problem.Title.replace(/-/g, ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700 dark:text-stone-300">{problem.Rating}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-stone-600 dark:text-stone-400">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {problem.companies.slice(0, 3).map((company, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full">{company}</span>
                          ))}
                          {problem.companies.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-400 rounded-full">+{problem.companies.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-stone-600 dark:text-stone-400">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {problem.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-full">{tag}</span>
                          ))}
                          {problem.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-400 rounded-full">+{problem.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button onClick={() => handleAddCard(problem)} className="inline-flex items-center justify-center px-2 py-1 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors" title="Add Card">
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
      id: 'your-folders',
      title: 'Your Folders',
      description: 'Organize your decks into collections',
      count: userFolders.length,
      icon: FolderIcon,
      color: 'from-amber-500 to-orange-600',
      onClick: handleYourFoldersClick,
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
      id: 'eod-revision',
      title: 'Revise Today\'s Work',
      description: 'Test yourself on flashcards you created today',
      count: '📝',
      icon: AcademicCapIcon,
      color: 'from-teal-500 to-cyan-600',
      onClick: handleEODRevisionClick,
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

    return (
      <div
        onClick={card.onClick}
        className="group relative p-6 rounded-lg border border-stone-300 dark:border-stone-800 overflow-hidden h-full flex flex-col justify-between bg-white dark:bg-stone-900/50 hover:border-brand-400 dark:hover:border-stone-600 transition-colors cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <IconComponent className="h-6 w-6 text-stone-500 dark:text-stone-400" />
              <div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">{card.title}</h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  {typeof card.count === 'string' ? card.count : card.count}
                </span>
              </div>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-stone-400 dark:text-stone-500 group-hover:text-brand-600 dark:group-hover:text-stone-400 transition-colors" />
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">{card.description}</p>
        </div>
        <div className="mt-4">
          <span className="text-xs text-amber-600 dark:text-amber-500 font-mono">
            Explore →
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-12 border-b border-stone-300 dark:border-stone-800 pb-8">
          <h1 className="text-3xl font-bold mb-3 text-stone-900 dark:text-stone-100">
            Welcome back, {user.username}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
            Manage your decks, track your progress, and access your favorites all in one place.
          </p>
        </div>

        {/* Profile Stats Row - GitHub Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-lg border border-stone-300 dark:border-stone-800 shadow-sm transition-colors">
            <div className="text-center">
              <div className="text-4xl font-bold text-stone-900 dark:text-stone-100 mb-1 font-mono">
                {userDecks.length}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-500 font-medium">
                Decks Created
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-lg border border-stone-300 dark:border-stone-800 shadow-sm transition-colors">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1 font-mono">
                {user.problemsCompleted?.length || 0}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-500 font-medium">
                Problems Solved
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-stone-900 p-6 rounded-lg border border-stone-300 dark:border-stone-800 shadow-sm transition-colors">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-1 font-mono">
                {user.favorites?.length || 0}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-500 font-medium">
                Favorite Decks
              </div>
            </div>
          </div>
        </div>

        {/* Main Profile Cards - 2x3 Grid */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-6">
            Your Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profileCards.map((card) => (
              <ProfileCard key={card.id} card={card} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-stone-900 rounded-lg p-6 border border-stone-300 dark:border-stone-800 shadow-sm transition-colors">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => navigate(`${navLinks.home}?tab=manage`)}
              className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded hover:bg-brand-500 transition-colors active:scale-[0.98] border border-brand-500"
            >
              Create New Deck
            </button>
            <button 
              onClick={() => navigate('/home?view=decks')}
              className="px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-sm rounded hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors active:scale-[0.98] border border-stone-300 dark:border-stone-700"
            >
              Browse All Decks
            </button>
            <button 
              onClick={() => navigate('/problem-list')}
              className="px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-sm rounded hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors active:scale-[0.98] border border-stone-300 dark:border-stone-700"
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