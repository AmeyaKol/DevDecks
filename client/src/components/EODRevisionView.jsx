import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFlashcardStore from '../store/flashcardStore';
import Navbar from './Navbar';
import { getFlashcardsCreatedOnDate } from '../services/api';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import CodeEditor from './common/CodeEditor';

// Custom link renderer for ReactMarkdown
const markdownComponents = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

const EODRevisionView = () => {
  const { isAuthenticated, user } = useAuth();
  const { darkMode } = useFlashcardStore();
  const navigate = useNavigate();

  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState([]); // Array of { flashcardId, isCorrect }
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/profile');
      return;
    }

    const fetchTodaysFlashcards = async () => {
      try {
        setLoading(true);
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        
        const data = await getFlashcardsCreatedOnDate(dateString);
        setFlashcards(data);
      } catch (err) {
        console.error('Error fetching flashcards:', err);
        setError('Failed to load flashcards. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysFlashcards();
  }, [isAuthenticated, navigate]);

  const currentCard = flashcards[currentCardIndex];

  const handleSubmitResponse = () => {
    setShowAnswer(true);
  };

  const handleMarkCorrect = () => {
    setResults([...results, { flashcardId: currentCard._id, isCorrect: true }]);
    moveToNextCard();
  };

  const handleMarkIncorrect = () => {
    setResults([...results, { flashcardId: currentCard._id, isCorrect: false }]);
    moveToNextCard();
  };

  const moveToNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setUserResponse('');
      setShowAnswer(false);
    } else {
      // All cards completed
      setIsCompleted(true);
    }
  };

  const handleBackToProfile = () => {
    navigate('/profile');
  };

  const handleRetry = () => {
    setCurrentCardIndex(0);
    setUserResponse('');
    setShowAnswer(false);
    setResults([]);
    setIsCompleted(false);
  };

  // Calculate score
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = results.length;
  const scorePercentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Loading today's flashcards...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              {error}
            </h2>
            <button
              onClick={handleBackToProfile}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={handleBackToProfile}
              className="flex items-center p-2 sm:px-4 sm:py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline ml-2">Back to Profile</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              End of Day Revision
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <TrophyIcon className="h-24 w-24 text-gray-400 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              No flashcards created today
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't created any flashcards today. Come back after creating some cards to revise them!
            </p>
            <button
              onClick={handleBackToProfile}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={handleBackToProfile}
              className="flex items-center p-2 sm:px-4 sm:py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline ml-2">Back to Profile</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              End of Day Revision - Complete! 🎉
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="mb-8">
              <TrophyIcon className={`h-32 w-32 mx-auto ${scorePercentage >= 70 ? 'text-yellow-500' : scorePercentage >= 50 ? 'text-gray-400' : 'text-orange-500'}`} />
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Score
            </h2>
            
            <div className="text-6xl font-bold mb-6">
              <span className={`${scorePercentage >= 70 ? 'text-green-600 dark:text-green-400' : scorePercentage >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                {scorePercentage}%
              </span>
            </div>
            
            <p className="text-2xl text-gray-700 dark:text-gray-300 mb-8">
              {correctCount} out of {totalCount} correct
            </p>

            <div className="mb-8">
              {scorePercentage >= 90 && (
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  🌟 Excellent work! You've mastered today's content!
                </p>
              )}
              {scorePercentage >= 70 && scorePercentage < 90 && (
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  👍 Great job! You have a solid understanding of today's material.
                </p>
              )}
              {scorePercentage >= 50 && scorePercentage < 70 && (
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  📚 Good effort! Consider reviewing the topics you missed.
                </p>
              )}
              {scorePercentage < 50 && (
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  💪 Keep practicing! Review the material and try again.
                </p>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToProfile}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={handleBackToProfile}
              className="flex items-center p-2 sm:px-4 sm:py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline ml-2">Back to Profile</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Revise Today's Work
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Card {currentCardIndex + 1} of {flashcards.length}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Progress</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {currentCardIndex} / {flashcards.length}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(currentCardIndex / flashcards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Question
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {currentCard.question}
          </p>

          {currentCard.hint && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                💡 Hint
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {currentCard.hint}
              </p>
            </div>
          )}

          {!showAnswer ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type your explanation or summary:
              </label>
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                rows="6"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 text-base dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Write your explanation here..."
              />
              <button
                onClick={handleSubmitResponse}
                disabled={!userResponse.trim()}
                className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Response
                <ChevronRightIcon className="h-5 w-5 ml-2" />
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">
                  Your Response:
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {userResponse}
                </p>
              </div>

              <div className="space-y-6">
                {/* Explanation */}
                {currentCard.explanation && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Explanation
                    </h3>
                    <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                      <ReactMarkdown components={markdownComponents}>
                        {currentCard.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Problem Statement */}
                {currentCard.problemStatement && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Problem Statement
                    </h3>
                    <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                      <ReactMarkdown components={markdownComponents}>
                        {currentCard.problemStatement}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Code */}
                {currentCard.code && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Code
                    </h3>
                    <CodeEditor 
                      value={currentCard.code} 
                      language={currentCard.language || 'python'}
                      readOnly={true}
                    />
                  </div>
                )}

                {/* Link */}
                {currentCard.link && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Link
                    </h3>
                    <a
                      href={currentCard.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {currentCard.link}
                    </a>
                  </div>
                )}
              </div>

              {/* Mark Correct/Incorrect */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-gray-700 dark:text-gray-300 mb-4 font-medium">
                  Was your response correct?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleMarkIncorrect}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Incorrect
                  </button>
                  <button
                    onClick={handleMarkCorrect}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Correct
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EODRevisionView;




