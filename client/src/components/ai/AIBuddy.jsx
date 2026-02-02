/**
 * AI Buddy Panel
 * 
 * A floating panel that provides AI-powered features:
 * - Generate outline from transcript
 * - Analyze notes
 * - Analyze code
 * - Generate test cards
 * - Get transcript from video
 */

import React, { useState } from 'react';
import {
  SparklesIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ClipboardDocumentListIcon,
  VideoCameraIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const AIBuddy = ({
  studyContent,
  code,
  language = 'python',
  videoUrl,
  cardType = 'Technical Knowledge',
  flashcardId,
  onOutlineGenerated,
  onNotesAnalyzed,
  onCodeAnalyzed,
  onTestCardsGenerated,
  onTranscriptFetched,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Generate outline from video transcript
  const handleGenerateOutline = async () => {
    if (!videoUrl) {
      setError('Please add a video URL first');
      return;
    }

    setIsLoading(true);
    setActiveFeature('outline');
    setError(null);

    try {
      const response = await api.post('/ai/generate-outline', {
        videoUrl,
        topic: 'Study Notes',
      });

      if (response.data.success) {
        setResult({ type: 'outline', data: response.data.outline });
        if (onOutlineGenerated) {
          onOutlineGenerated(response.data.outline);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate outline');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze current notes
  const handleAnalyzeNotes = async () => {
    if (!studyContent || studyContent.length < 50) {
      setError('Please add more notes to analyze (at least 50 characters)');
      return;
    }

    setIsLoading(true);
    setActiveFeature('notes');
    setError(null);

    try {
      const response = await api.post('/ai/analyze-notes', {
        notes: studyContent,
      });

      if (response.data.success) {
        setResult({ type: 'notes', data: response.data.analysis });
        if (onNotesAnalyzed) {
          onNotesAnalyzed(response.data.analysis);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze notes');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze code
  const handleAnalyzeCode = async () => {
    if (!code || code.length < 10) {
      setError('Please add code to analyze');
      return;
    }

    setIsLoading(true);
    setActiveFeature('code');
    setError(null);

    try {
      const response = await api.post('/ai/analyze-code', {
        code,
        language,
      });

      if (response.data.success) {
        setResult({ type: 'code', data: response.data.analysis });
        if (onCodeAnalyzed) {
          onCodeAnalyzed(response.data.analysis);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze code');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate test cards
  const handleGenerateTestCards = async () => {
    if (!studyContent || studyContent.length < 50) {
      setError('Please add more study content to generate test cards');
      return;
    }

    setIsLoading(true);
    setActiveFeature('testcards');
    setError(null);

    try {
      const response = await api.post('/ai/generate-test-cards', {
        studyContent,
        cardType,
        maxCards: 5,
        flashcardId,
      });

      if (response.data.success) {
        setResult({ type: 'testcards', data: response.data.cards });
        if (onTestCardsGenerated) {
          onTestCardsGenerated(response.data.cards);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate test cards');
    } finally {
      setIsLoading(false);
    }
  };

  // Get video transcript
  const handleGetTranscript = async () => {
    if (!videoUrl) {
      setError('Please add a video URL first');
      return;
    }

    setIsLoading(true);
    setActiveFeature('transcript');
    setError(null);

    try {
      const response = await api.post('/ai/get-transcript', {
        videoUrl,
        formatted: true,
      });

      if (response.data.success) {
        setResult({ type: 'transcript', data: response.data.transcript });
        if (onTranscriptFetched) {
          onTranscriptFetched(response.data.transcript);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get transcript');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear results
  const clearResults = () => {
    setResult(null);
    setError(null);
    setActiveFeature(null);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-indigo-500" />
          <span className="font-medium text-gray-800 dark:text-gray-200">AI Buddy</span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleGenerateOutline}
              disabled={isLoading || !videoUrl}
              className="flex items-center gap-2 p-2 text-sm rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DocumentTextIcon className="h-4 w-4" />
              <span>Outline</span>
            </button>

            <button
              onClick={handleAnalyzeNotes}
              disabled={isLoading || !studyContent}
              className="flex items-center gap-2 p-2 text-sm rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ClipboardDocumentListIcon className="h-4 w-4" />
              <span>Analyze Notes</span>
            </button>

            <button
              onClick={handleAnalyzeCode}
              disabled={isLoading || !code}
              className="flex items-center gap-2 p-2 text-sm rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CodeBracketIcon className="h-4 w-4" />
              <span>Analyze Code</span>
            </button>

            <button
              onClick={handleGenerateTestCards}
              disabled={isLoading || !studyContent}
              className="flex items-center gap-2 p-2 text-sm rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Test Cards</span>
            </button>

            <button
              onClick={handleGetTranscript}
              disabled={isLoading || !videoUrl}
              className="flex items-center gap-2 p-2 text-sm rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors col-span-2"
            >
              <VideoCameraIcon className="h-4 w-4" />
              <span>Get Transcript</span>
            </button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Processing...
              </span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="relative">
              <button
                onClick={clearResults}
                className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <XMarkIcon className="h-4 w-4 text-gray-500" />
              </button>

              {result.type === 'notes' && result.data && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm space-y-2">
                  <div className="font-medium text-green-800 dark:text-green-300">
                    Notes Analysis (Score: {result.data.overallScore}/10)
                  </div>
                  {result.data.strengths?.length > 0 && (
                    <div>
                      <span className="font-medium">Strengths:</span>
                      <ul className="list-disc list-inside text-green-700 dark:text-green-400">
                        {result.data.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {result.data.gaps?.length > 0 && (
                    <div>
                      <span className="font-medium">Gaps:</span>
                      <ul className="list-disc list-inside text-amber-700 dark:text-amber-400">
                        {result.data.gaps.map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {result.type === 'code' && result.data && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm space-y-2">
                  <div className="font-medium text-purple-800 dark:text-purple-300">
                    Code Analysis
                  </div>
                  <div className="text-purple-700 dark:text-purple-400">
                    <strong>Time:</strong> {result.data.timeComplexity}
                  </div>
                  <div className="text-purple-700 dark:text-purple-400">
                    <strong>Space:</strong> {result.data.spaceComplexity}
                  </div>
                  <div className="text-purple-700 dark:text-purple-400">
                    {result.data.explanation}
                  </div>
                </div>
              )}

              {result.type === 'testcards' && result.data && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                  <div className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                    Generated {result.data.length} Test Cards
                  </div>
                  <p className="text-amber-700 dark:text-amber-400 text-xs">
                    Use the Test Card Editor to review and save these cards.
                  </p>
                </div>
              )}

              {result.type === 'outline' && result.data && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                  <div className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Outline Generated
                  </div>
                  <p className="text-blue-700 dark:text-blue-400 text-xs">
                    The outline has been inserted into your notes.
                  </p>
                </div>
              )}

              {result.type === 'transcript' && result.data && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-sm">
                  <div className="font-medium text-rose-800 dark:text-rose-300 mb-2">
                    Transcript Fetched
                  </div>
                  <div className="max-h-32 overflow-y-auto text-rose-700 dark:text-rose-400 text-xs">
                    {result.data.substring(0, 500)}...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIBuddy;




