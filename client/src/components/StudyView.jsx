import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useFlashcardStore from '../store/flashcardStore';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeftIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  BookmarkIcon,
  EyeIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { updateRecentDecks } from '../services/api';
import { updateFlashcard } from '../services/api';
import ReactMarkdown from 'react-markdown';
import CodeEditor from './common/CodeEditor';
import AnimatedDropdown from './common/AnimatedDropdown';

// Custom link renderer for ReactMarkdown
const markdownComponents = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

const FLASHCARD_TYPES = [
  'All',
  'DSA',
  'System Design',
  'Behavioral',
  'Technical Knowledge',
  'Other',
  'GRE-Word',
  'GRE-MCQ',
];

const StudyView = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, updateRecentsInContext } = useAuth();
  const navigate = useNavigate();
  const deckId = searchParams.get('deck');

  const {
    fetchDecks,
    fetchFlashcards,
    setSelectedDeckForView,
    setSelectedDeckFilter,
    decks,
    selectedDeckForView,
    flashcards,
    isLoadingDecks,
  } = useFlashcardStore();

  // Component state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [question, setQuestion] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState('All');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('python');
  const [isExplanationPreview, setIsExplanationPreview] = useState(false);
  const [isProblemStatementPreview, setIsProblemStatementPreview] = useState(false);
  const [isCodePreview, setIsCodePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for auto-resizing textareas
  const hintRef = useRef(null);
  const explanationRef = useRef(null);
  const problemStatementRef = useRef(null);
  
  // Ref to track if we've already updated recent decks for this deck
  const hasTrackedDeck = useRef(false);

  // Helper to auto-resize textarea
  const autoResizeTextarea = (ref) => {
    if (ref && ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  };

  // Auto-resize when toggling from preview to edit
  useEffect(() => {
    if (!isExplanationPreview) autoResizeTextarea(explanationRef);
  }, [isExplanationPreview]);

  useEffect(() => {
    if (!isProblemStatementPreview) autoResizeTextarea(problemStatementRef);
  }, [isProblemStatementPreview]);

  // Initialize data
  useEffect(() => {
    fetchDecks();
    fetchFlashcards();
  }, [fetchDecks, fetchFlashcards]);

  useEffect(() => {
    if (deckId) {
      setSelectedDeckFilter(deckId);
      setSelectedDeckForView(decks.find(deck => deck._id === deckId));
    }
  }, [deckId, decks, setSelectedDeckFilter, setSelectedDeckForView]);

  // Track deck access for recent decks - only once per deck
  useEffect(() => {
    if (selectedDeckForView && isAuthenticated && deckId && !hasTrackedDeck.current) {
      hasTrackedDeck.current = true;
      const trackDeckAccess = async () => {
        try {
          const response = await updateRecentDecks(deckId);
          updateRecentsInContext(response.recents);
        } catch (error) {
          console.error('Failed to update recent decks:', error);
        }
      };
      trackDeckAccess();
    }
  }, [selectedDeckForView, isAuthenticated, deckId, updateRecentsInContext]);

  // Reset tracking when deck changes
  useEffect(() => {
    hasTrackedDeck.current = false;
  }, [deckId]);

  // Get filtered and sorted flashcards for this deck
  const deckFlashcards = useMemo(() => {
    if (!flashcards || !selectedDeckForView) return [];
    const filtered = flashcards.filter(card => 
      card.decks && card.decks.some(d => 
        typeof d === 'string' ? d === selectedDeckForView._id : d._id === selectedDeckForView._id
      )
    );
    // Sort by createdAt or updatedAt
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
  }, [flashcards, selectedDeckForView, sortOrder]);

  const currentCard = deckFlashcards[currentCardIndex];

  // When currentCard changes, update all fields
  useEffect(() => {
    if (currentCard) {
      setQuestion(currentCard.question || '');
      setHint(currentCard.hint || '');
      setExplanation(currentCard.explanation || '');
      setProblemStatement(currentCard.problemStatement || '');
      setCode(currentCard.code || '');
      setLink(currentCard.link || '');
      setType(currentCard.type || 'All');
      setTags(currentCard.tags ? currentCard.tags.join(', ') : '');
      setLanguage(currentCard.language || 'python');
    }
  }, [currentCard]);

  // Extract YouTube video ID from URL
  const extractVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  // Helper to extract the first YouTube link from explanation, problem statement, or link
  const extractFirstYouTubeLink = () => {
    const youtubeRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+))/i;
    // Check explanation
    let match = explanation && explanation.match(youtubeRegex);
    if (match) return match[1];
    // Check problem statement
    match = problemStatement && problemStatement.match(youtubeRegex);
    if (match) return match[1];
    // Check link field
    match = link && link.match(youtubeRegex);
    if (match) return match[1];
    return null;
  };

  const firstYouTubeLink = extractFirstYouTubeLink();
  let videoId = null;
  if (firstYouTubeLink) {
    const idMatch = firstYouTubeLink.match(/(?:v=|be\/)([\w-]+)/);
    videoId = idMatch ? idMatch[1] : null;
  }

  // Handle navigation
  const handleBackToHome = () => {
    navigate(`/deckView?deck=${selectedDeckForView._id}`);
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < deckFlashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  // Handle saving
  const handleSave = async () => {
    if (!currentCard) return;
    
    setIsSaving(true);
    try {
      await updateFlashcard(currentCard._id, {
        question: question.trim(),
        hint: hint.trim(),
        explanation: explanation.trim(),
        problemStatement: problemStatement.trim(),
        code: code.trim(),
        link: link.trim(),
        type,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        language,
      });
      
      // Show success feedback (you might want to add a toast notification)
      console.log('Flashcard updated successfully');
    } catch (error) {
      console.error('Error updating flashcard:', error);
      // Show error feedback
    } finally {
      setIsSaving(false);
    }
  };

  // Handle keyboard shortcuts for markdown
  const handleMarkdownShortcuts = (e, value, valueSetter) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      const before = value.substring(0, start);
      const after = value.substring(end);
      valueSetter(before + '**' + selected + '**' + after);
      setTimeout(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = end + 2;
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      const before = value.substring(0, start);
      const after = value.substring(end);
      valueSetter(before + '*' + selected + '*' + after);
      setTimeout(() => {
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = end + 1;
      }, 0);
    }
  };

  // Tab insertion handler for textarea (same as in FlashcardForm)
  const handleTextareaTab = (e, valueSetter) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      valueSetter(value.substring(0, start) + '\t' + value.substring(end));
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  // Handle timestamp clicks in explanation
  const handleTimestampClick = (timestamp) => {
    // Parse timestamp (e.g., "1:23", "12:34", "1:23:45")
    const parts = timestamp.split(':').reverse();
    let seconds = 0;
    
    if (parts[0]) seconds += parseInt(parts[0]); // seconds
    if (parts[1]) seconds += parseInt(parts[1]) * 60; // minutes
    if (parts[2]) seconds += parseInt(parts[2]) * 3600; // hours
    
    console.log(`Seeking to timestamp: ${timestamp} (${seconds} seconds)`);
    
    // Try to use YouTube API to seek without reloading
    const iframe = document.querySelector('#youtube-player');
    if (iframe && videoId) {
      try {
        // Use postMessage to communicate with YouTube iframe
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [seconds, true]
          }),
          'https://www.youtube.com'
        );
      } catch (error) {
        console.error('Error seeking video:', error);
        // Fallback: reload with timestamp
        const baseUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
        const newUrl = `${baseUrl}&start=${seconds}&autoplay=1`;
        iframe.src = newUrl;
      }
    }
  };

  // Picture-in-Picture state
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Handle Picture-in-Picture mode using Document PiP API
  const handlePictureInPicture = async () => {
    if (isPiPActive) {
      // Exit PiP mode
      try {
        if (window.documentPictureInPicture && window.documentPictureInPicture.window) {
          window.documentPictureInPicture.window.close();
        }
        setIsPiPActive(false);
      } catch (error) {
        console.error('Error exiting PiP:', error);
        setIsPiPActive(false);
      }
    } else {
      // Enter PiP mode using Document Picture-in-Picture API
      try {
        console.log('Attempting Document Picture-in-Picture...');
        
        // Check if Document PiP is supported
        if ('documentPictureInPicture' in window) {
          console.log('Document PiP API supported, creating PiP window...');
          
          const pipWindow = await window.documentPictureInPicture.requestWindow({
            width: 560,
            height: 315,
          });

          // Create the iframe content in the PiP window
          pipWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Video - Picture in Picture</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 0; 
                  background: #000; 
                  overflow: hidden;
                }
                iframe { 
                  width: 100vw; 
                  height: 100vh; 
                  border: none; 
                  display: block;
                }
              </style>
            </head>
            <body>
              <iframe 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&origin=${encodeURIComponent(window.location.origin)}"
                allowfullscreen
                allow="autoplay; encrypted-media; picture-in-picture">
              </iframe>
            </body>
            </html>
          `);
          pipWindow.document.close();

          // Listen for window close
          pipWindow.addEventListener('beforeunload', () => {
            setIsPiPActive(false);
          });

          setIsPiPActive(true);
          console.log('Document PiP window created successfully');
          
        } else {
          // Fallback to regular video PiP if Document PiP not supported
          console.log('Document PiP not supported, trying regular video PiP...');
          
          // Check if regular PiP is supported
          if (!document.pictureInPictureEnabled) {
            throw new Error('Picture-in-Picture not supported');
          }

          // Try to get YouTube video URL and create a video element
          // Note: This is a simplified approach and may not work due to CORS
          const video = document.createElement('video');
          video.controls = true;
          video.muted = true;
          video.style.position = 'fixed';
          video.style.top = '-9999px';
          video.style.left = '-9999px';
          video.style.width = '320px';
          video.style.height = '240px';
          
          // Add to DOM temporarily
          document.body.appendChild(video);
          
          // Set a placeholder video source (this won't work with YouTube directly)
          // This is just to demonstrate the PiP functionality
          video.src = 'data:video/mp4;base64,AAAAHGZ0eXBNNFYgTTRBIGlzb200YXZjMWF2YzEAAAAIZnJlZQAAAAhtZGF0';
          
          try {
            await video.play();
            await video.requestPictureInPicture();
            
            video.addEventListener('leavepictureinpicture', () => {
              setIsPiPActive(false);
              if (document.body.contains(video)) {
                document.body.removeChild(video);
              }
            });
            
            setIsPiPActive(true);
            console.log('Regular video PiP activated');
            
          } catch (pipError) {
            console.error('Regular PiP failed:', pipError);
            if (document.body.contains(video)) {
              document.body.removeChild(video);
            }
            throw pipError;
          }
        }

      } catch (error) {
        console.error('Error entering PiP:', error);
        
        // Final fallback: instruct user to use manual PiP
        alert(`Picture-in-Picture not available programmatically. 
        
To use PiP with this video:
1. Right-click on the video
2. Select "Picture in Picture" from the menu
        
Or you can open the video in a new tab where PiP will be available.`);
        
        // Optionally open in new tab
        const openInNewTab = window.confirm('Would you like to open the video in a new tab for manual PiP?');
        if (openInNewTab) {
          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          window.open(videoUrl, '_blank');
        }
      }
    }
  };

  // Intersection Observer for automatic PiP
  useEffect(() => {
    if (!videoId) return;

    const videoContainer = document.querySelector('#youtube-player')?.parentElement;
    if (!videoContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If video is less than 50% visible and PiP is not active
          if (entry.intersectionRatio < 0.5 && !isPiPActive) {
            console.log('Video less than 50% visible, auto-triggering PiP...');
            handlePictureInPicture();
          }
        });
      },
      {
        threshold: [0.5], // Trigger when 50% visible
        rootMargin: '0px'
      }
    );

    observer.observe(videoContainer);

    return () => {
      observer.disconnect();
    };
  }, [videoId, isPiPActive, handlePictureInPicture]);

  // Component to render text with clickable timestamps
  const TextWithTimestamps = ({ text }) => {
    if (!text) return null;
    
    const timestampRegex = /(\[(?:\d{1,2}:\d{2}(?::\d{2})?)\])/g;
    const parts = text.split(timestampRegex);
    
    return (
      <>
        {parts.map((part, i) => {
          const timestampMatch = part.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]$/);
          if (timestampMatch) {
            const timestamp = timestampMatch[1];
            return (
              <button
                key={i}
                onClick={() => handleTimestampClick(timestamp)}
                className="text-blue-600 hover:text-blue-800 underline mx-1 cursor-pointer bg-blue-50 dark:bg-blue-900/30 px-1 rounded inline-block"
              >
                [{timestamp}]
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  // Enhanced markdown components
  const enhancedMarkdownComponents = {
    ...markdownComponents,
    p: ({ children }) => {
      // If children is a string, apply timestamp parsing. Otherwise, render as-is.
      if (typeof children === 'string') {
        return (
          <p>
            <TextWithTimestamps text={children} />
          </p>
        );
      }
      // If children is an array, flatten and apply timestamp parsing only to string parts
      if (Array.isArray(children)) {
        return (
          <p>
            {children.map((child, i) =>
              typeof child === 'string' ? <TextWithTimestamps key={i} text={child} /> : child
            )}
          </p>
        );
      }
      // Otherwise, just render children
      return <p>{children}</p>;
    },
    // Remove the 'text' override to avoid [object Object] bug
  };

  if (!selectedDeckForView) {
    if (isLoadingDecks) {
      return (
        <div className="min-h-screen flex flex-col bg-transparent">
          <div className="flex-1">
            <div className="container mx-auto px-4">
              <Navbar />
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Loading deck...
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col bg-transparent">
        <div className="flex-1">
          <div className="container mx-auto px-4">
            <Navbar />
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Deck not found
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  The deck you're looking for doesn't exist or has been removed.
                </p>
                <button
                  onClick={handleBackToHome}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Back to Deck</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (deckFlashcards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-transparent">
        <div className="flex-1">
          <div className="container mx-auto px-4">
            <Navbar />
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  No flashcards found
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  This deck doesn't have any flashcards yet.
                </p>
                <button
                  onClick={handleBackToHome}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Back to Deck</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const commonInputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";
  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300";

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <div className="flex-1">
        <div className="container mx-auto px-4">
          <Navbar />
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleBackToHome} 
                  className="flex items-center space-x-2 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Back to Deck</span>
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                    Study Mode: {selectedDeckForView.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Card {currentCardIndex + 1} of {deckFlashcards.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  title={`Sort by ${sortOrder === 'newest' ? 'oldest' : 'newest'} first`}
                >
                  {sortOrder === 'newest' ? (
                    <>
                      <ChevronRightIcon className="h-4 w-4" />
                      <span>Newest First</span>
                    </>
                  ) : (
                    <>
                      <ChevronLeftIcon className="h-4 w-4" />
                      <span>Oldest First</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrevCard}
                  disabled={currentCardIndex === 0}
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span>Prev</span>
                </button>
                <button
                  onClick={handleNextCard}
                  disabled={currentCardIndex === deckFlashcards.length - 1}
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <span>Next</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <BookmarkIcon className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Card Title */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {currentCard?.question || 'No title'}
            </h2>
          </div>

          {/* YouTube Video */}
          {videoId && (
            <div className="bg-white rounded-lg shadow p-4 mb-6 dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Video</h3>
              <div className="aspect-video" id="video-container">
                {isPiPActive ? (
                  // Show a placeholder when PiP is active
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <PlayIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">Video playing in Picture-in-Picture</p>
                      <button
                        onClick={handlePictureInPicture}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Return Video Here
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <iframe
                      id="youtube-player"
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg"
                    />
                    <video
                      id="hidden-video"
                      style={{ display: 'none' }}
                      controls
                      crossOrigin="anonymous"
                    />
                  </>
                )}
              </div>
              {/* Picture-in-Picture Button */}
              <div className="mt-3 flex justify-center">
                <button
                  onClick={handlePictureInPicture}
                  className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isPiPActive 
                      ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600'
                  }`}
                  title={isPiPActive ? "Exit Picture-in-Picture mode" : "Enable Picture-in-Picture mode (auto-triggers when scrolling)"}
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>{isPiPActive ? 'Exit PiP' : 'Enable PiP'}</span>
                </button>
                {!isPiPActive && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    PiP will automatically activate when you scroll past the video
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Study Fields */}
          <div className="grid grid-cols-1 gap-6">
            {/* Hint Field */}
            <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
              <div className="mb-4">
                <label className={commonLabelClasses}>Hint</label>
              </div>
              <textarea
                ref={hintRef}
                value={hint}
                onChange={(e) => { setHint(e.target.value); autoResizeTextarea(hintRef); }}
                onKeyDown={(e) => handleMarkdownShortcuts(e, hint, setHint)}
                rows="3"
                className={commonInputClasses}
                style={{overflow: 'hidden', minHeight: '100px'}}
                placeholder="Add your hint here..."
              />
            </div>

            {/* Explanation Field */}
            <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
              <div className="flex justify-between items-center mb-4">
                <label className={commonLabelClasses}>Explanation (Markdown)</label>
                <button
                  type="button"
                  onClick={() => setIsExplanationPreview(!isExplanationPreview)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>{isExplanationPreview ? "Edit" : "Preview"}</span>
                </button>
              </div>
              {isExplanationPreview ? (
                <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md min-h-[200px]">
                  {explanation ? (
                    <ReactMarkdown components={enhancedMarkdownComponents}>
                      {explanation}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-gray-500 italic">No content to preview</div>
                  )}
                </div>
              ) : (
                <textarea
                  ref={explanationRef}
                  value={explanation}
                  onChange={(e) => { setExplanation(e.target.value); autoResizeTextarea(explanationRef); }}
                  onKeyDown={(e) => { handleTextareaTab(e, setExplanation); handleMarkdownShortcuts(e, explanation, setExplanation); }}
                  rows="8"
                  className={commonInputClasses}
                  style={{overflow: 'hidden', minHeight: '200px'}}
                  placeholder={`Start writing your notes in Markdown...\n\n# Heading\n**Bold text**\n*Italic text*\n> Quote\n\`code\`\n- List item\n[Link](url)`}
                />
              )}
            </div>

            {/* Problem Statement Field */}
            <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
              <div className="flex justify-between items-center mb-4">
                <label className={commonLabelClasses}>Problem Statement (Markdown)</label>
                <button
                  type="button"
                  onClick={() => setIsProblemStatementPreview(!isProblemStatementPreview)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>{isProblemStatementPreview ? "Edit" : "Preview"}</span>
                </button>
              </div>
              {isProblemStatementPreview ? (
                <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md min-h-[150px]">
                  {problemStatement ? (
                    <ReactMarkdown components={enhancedMarkdownComponents}>
                      {problemStatement}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-gray-500 italic">No content to preview</div>
                  )}
                </div>
              ) : (
                <textarea
                  ref={problemStatementRef}
                  value={problemStatement}
                  onChange={(e) => { setProblemStatement(e.target.value); autoResizeTextarea(problemStatementRef); }}
                  onKeyDown={(e) => { handleTextareaTab(e, setProblemStatement); handleMarkdownShortcuts(e, problemStatement, setProblemStatement); }}
                  rows="6"
                  className={commonInputClasses}
                  style={{overflow: 'hidden', minHeight: '150px'}}
                  placeholder={`# Heading\n**Bold text**\n*Italic text*\n\`code\`\n- List item\n[Link](url)`}
                />
              )}
            </div>

            {/* Code Field */}
            <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
              <div className="mb-4">
                <label className={commonLabelClasses}>Code</label>
              </div>
              <CodeEditor value={code} onChange={setCode} language={language} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyView; 