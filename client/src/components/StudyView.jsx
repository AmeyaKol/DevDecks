import React, { useEffect, useLayoutEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import useFlashcardStore from '../store/flashcardStore';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeftIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  BookmarkIcon,
  EyeIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { updateRecentDecks } from '../services/api';
import { updateFlashcard } from '../services/api';
import ReactMarkdown from 'react-markdown';
import CodeEditor from './common/CodeEditor';
import AnimatedDropdown from './common/AnimatedDropdown';
import LiveMarkdownEditor from './common/LiveMarkdownEditor';
import { isGREMode, getNavigationLinks } from '../utils/greUtils';
import { autoResizeTextareaPreserveScroll } from '../utils/textareaResize';

// Custom link renderer for ReactMarkdown
const markdownComponents = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

const AUTO_SAVE_INTERVAL_MS = 30_000;
const VALID_FLASHCARD_TYPES = [
  'DSA',
  'System Design',
  'Behavioral',
  'Technical Knowledge',
  'Other',
  'GRE-Word',
  'GRE-MCQ',
];

function studyCardSnapshot(card) {
  if (!card) return '';
  const tags = [...(card.tags || [])]
    .map(String)
    .map((t) => t.trim())
    .filter(Boolean)
    .sort();
  return JSON.stringify({
    question: (card.question || '').trim(),
    hint: (card.hint || '').trim(),
    explanation: (card.explanation || '').trim(),
    problemStatement: (card.problemStatement || '').trim(),
    code: (card.code || '').trim(),
    link: (card.link || '').trim(),
    type: card.type || 'All',
    tags,
    language: card.language || 'python',
  });
}

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
  const location = useLocation();
  const { isAuthenticated, user, updateRecentsInContext } = useAuth();
  const navigate = useNavigate();
  const deckId = searchParams.get('deck');
  
  // Detect if we're in GRE mode
  const inGREMode = isGREMode(location.pathname);
  const navLinks = getNavigationLinks(location.pathname);

  const {
    fetchDecks,
    fetchFlashcards,
    setSelectedDeckForView,
    setSelectedDeckFilter,
    addFlashcard,
    decks,
    selectedDeckForView,
    flashcards,
    isLoadingDecks,
  } = useFlashcardStore();

  // Component state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sortOrder, setSortOrder] = useState('oldest'); // 'newest' or 'oldest'
  const [question, setQuestion] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState('All');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('python');
  const [isCodePreview, setIsCodePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState({ show: false, message: '', kind: 'success' });

  // Quick-add panel state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newType, setNewType] = useState('DSA');
  const [newQuestion, setNewQuestion] = useState('');
  const [newHint, setNewHint] = useState('');
  const [newExplanation, setNewExplanation] = useState('');
  const [newProblemStatement, setNewProblemStatement] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newLanguage, setNewLanguage] = useState('python');
  const [newGreExampleSentence, setNewGreExampleSentence] = useState('');
  const [newGreWordRoot, setNewGreWordRoot] = useState('');
  const [newGreSimilarWords, setNewGreSimilarWords] = useState('');
  const [newMcqType, setNewMcqType] = useState('single-correct');
  const [newMcqOptions, setNewMcqOptions] = useState([{ text: '', isCorrect: false }]);
  const [isCreating, setIsCreating] = useState(false);
  const [quickAddError, setQuickAddError] = useState('');

  // Refs for auto-resizing textareas
  const hintRef = useRef(null);
  
  // Ref to track if we've already updated recent decks for this deck
  const hasTrackedDeck = useRef(false);

  const lastSavedSnapshotRef = useRef('');
  const currentCardIdRef = useRef(null);
  const isSavingRef = useRef(false);
  const getFormSnapshotRef = useRef(() => '');
  const buildPayloadRef = useRef(() => ({}));
  const saveToastTimeoutRef = useRef(null);
  const handleSaveRef = useRef(() => {});

  const autoResizeTextarea = (ref) => {
    if (ref?.current) autoResizeTextareaPreserveScroll(ref.current);
  };

  const getSafeType = () => {
    if (VALID_FLASHCARD_TYPES.includes(type)) return type;
    if (VALID_FLASHCARD_TYPES.includes(currentCard?.type)) return currentCard.type;
    return 'DSA';
  };

  const getApiErrorMessage = (error, fallback) => {
    const firstValidationError = error?.response?.data?.errors?.[0]?.msg;
    return firstValidationError || error?.response?.data?.message || error?.message || fallback;
  };


  // Initialize data
  useEffect(() => {
    fetchDecks();
    // Fetch flashcards only for the specific deck if deckId is present
    if (deckId) {
      fetchFlashcards({ deck: deckId, paginate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]); // Only depend on deckId, not store functions

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

  // When currentCard changes, update all fields (layout effect avoids a tick where card id and form disagree)
  useLayoutEffect(() => {
    if (!currentCard) return;
    setQuestion(currentCard.question || '');
    setHint(currentCard.hint || '');
    setExplanation(currentCard.explanation || '');
    setProblemStatement(currentCard.problemStatement || '');
    setCode(currentCard.code || '');
    setLink(currentCard.link || '');
    setType(currentCard.type || 'All');
    setTags(currentCard.tags ? currentCard.tags.join(', ') : '');
    setLanguage(currentCard.language || 'python');
    lastSavedSnapshotRef.current = studyCardSnapshot(currentCard);
  }, [currentCard]);

  // Extract YouTube video ID from URL
  const extractVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  // Helper to extract timestamp from YouTube URL (supports &t=123s, &t=123, &start=123)
  const extractTimestampFromUrl = (url) => {
    if (!url) return null;
    // Match &t=123s or &t=123 or &start=123
    let match = url.match(/[?&]t=(\d+)s?/);
    if (match) return parseInt(match[1]);
    match = url.match(/[?&]start=(\d+)/);
    if (match) return parseInt(match[1]);
    return null;
  };

  // Helper to extract the first YouTube link from explanation, problem statement, or link
  const extractFirstYouTubeLink = () => {
    const youtubeRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s]*v=|youtu\.be\/)([\w-]+[^\s]*))/i;
    // Check link field first (for split cards with timestamp)
    let match = link && link.match(youtubeRegex);
    if (match) return match[1];
    // Check explanation
    match = explanation && explanation.match(youtubeRegex);
    if (match) return match[1];
    // Check problem statement
    match = problemStatement && problemStatement.match(youtubeRegex);
    if (match) return match[1];
    return null;
  };

  const firstYouTubeLink = extractFirstYouTubeLink();
  let videoId = null;
  let videoStartTime = null;
  if (firstYouTubeLink) {
    const idMatch = firstYouTubeLink.match(/(?:v=|be\/)([\w-]+)/);
    videoId = idMatch ? idMatch[1] : null;
    // Extract timestamp for auto-start
    videoStartTime = extractTimestampFromUrl(firstYouTubeLink);
  }

  // ── Quick-add helpers ──────────────────────────────────────────────────────
  const resetQuickAdd = () => {
    const defaultType = currentCard?.type && currentCard.type !== 'All'
      ? currentCard.type
      : 'DSA';
    setNewType(defaultType);
    setNewQuestion('');
    setNewHint('');
    setNewExplanation('');
    setNewProblemStatement('');
    setNewCode('');
    setNewLink('');
    setNewTags('');
    setNewLanguage('python');
    setNewGreExampleSentence('');
    setNewGreWordRoot('');
    setNewGreSimilarWords('');
    setNewMcqType('single-correct');
    setNewMcqOptions([{ text: '', isCorrect: false }]);
    setQuickAddError('');
  };

  const handleOpenQuickAdd = () => {
    resetQuickAdd();
    setIsQuickAddOpen(true);
  };

  const handleCloseQuickAdd = () => {
    setIsQuickAddOpen(false);
    setQuickAddError('');
  };

  const handleQuickAddSave = async () => {
    if (!newQuestion.trim()) {
      setQuickAddError('Question is required.');
      return;
    }
    setIsCreating(true);
    setQuickAddError('');
    try {
      const flashcardData = {
        question: newQuestion.trim(),
        hint: newHint.trim(),
        explanation: newExplanation.trim(),
        problemStatement: newProblemStatement.trim(),
        code: newCode.trim(),
        link: newLink.trim(),
        type: newType,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
        decks: [deckId],
        isPublic: true,
        language: newLanguage,
        metadata: {},
      };
      if (newType === 'GRE-Word') {
        flashcardData.metadata = {
          exampleSentence: newGreExampleSentence.trim(),
          wordRoot: newGreWordRoot.trim(),
          similarWords: newGreSimilarWords.split(',').map(w => w.trim()).filter(Boolean),
        };
      } else if (newType === 'GRE-MCQ') {
        flashcardData.metadata = {
          mcqType: newMcqType,
          options: newMcqOptions.filter(opt => opt.text.trim().length > 0),
        };
      }
      await addFlashcard(flashcardData);
      setIsQuickAddOpen(false);
      // Jump to the newest card so user can immediately see / edit the new card
      if (sortOrder === 'newest') setCurrentCardIndex(0);
    } catch (err) {
      setQuickAddError(err?.response?.data?.message || err.message || 'Failed to create card.');
    } finally {
      setIsCreating(false);
    }
  };

  // MCQ option handlers for quick-add
  const quickAddNewMcqOption = () =>
    setNewMcqOptions(prev => [...prev, { text: '', isCorrect: false }]);

  const quickRemoveMcqOption = (idx) => {
    if (newMcqOptions.length > 1)
      setNewMcqOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const quickUpdateMcqOption = (idx, field, value) => {
    setNewMcqOptions(prev => {
      const next = prev.map((opt, i) => i === idx ? { ...opt, [field]: value } : opt);
      if (field === 'isCorrect' && value && newMcqType === 'single-correct') {
        next.forEach((opt, i) => { if (i !== idx) opt.isCorrect = false; });
      }
      return next;
    });
  };
  // ──────────────────────────────────────────────────────────────────────────

  // Handle navigation
  const handleBackToHome = () => {
    if (selectedDeckForView) {
      // Check if the deck is a GRE type deck
      const isGREDeck = selectedDeckForView.type === 'GRE-Word' || selectedDeckForView.type === 'GRE-MCQ';
      
      // Navigate to the appropriate deckView route based on deck type
      if (isGREDeck) {
        navigate(`/gre/deckView?deck=${selectedDeckForView._id}`);
      } else {
        navigate(`/deckView?deck=${selectedDeckForView._id}`);
      }
    }
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

  const buildFlashcardUpdatePayload = () => ({
    question: question.trim(),
    hint: hint.trim(),
    explanation: explanation.trim(),
    problemStatement: problemStatement.trim(),
    code: code.trim(),
    link: link.trim(),
    type: getSafeType(),
    tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    language,
  });

  const getFormSnapshot = () =>
    studyCardSnapshot({
      question,
      hint,
      explanation,
      problemStatement,
      code,
      link,
      type: getSafeType(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      language,
    });

  currentCardIdRef.current = currentCard?._id ?? null;
  buildPayloadRef.current = buildFlashcardUpdatePayload;
  getFormSnapshotRef.current = getFormSnapshot;

  const showSaveToast = (message, kind = 'success') => {
    setSaveToast({ show: true, message, kind });
    if (saveToastTimeoutRef.current) {
      window.clearTimeout(saveToastTimeoutRef.current);
    }
    saveToastTimeoutRef.current = window.setTimeout(() => {
      setSaveToast((prev) => ({ ...prev, show: false }));
    }, 1800);
  };

  // Handle saving
  const handleSave = async (showFeedback = true) => {
    if (!currentCard) return;
    
    setIsSaving(true);
    try {
      await updateFlashcard(currentCard._id, buildFlashcardUpdatePayload());
      lastSavedSnapshotRef.current = getFormSnapshot();
      console.log('Flashcard updated successfully');
      if (showFeedback) showSaveToast('Card saved', 'success');
    } catch (error) {
      console.error('Error updating flashcard:', error?.response?.data || error);
      if (showFeedback) showSaveToast(getApiErrorMessage(error, 'Save failed'), 'error');
    } finally {
      setIsSaving(false);
    }
  };
  handleSaveRef.current = handleSave;

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    const tick = async () => {
      const cardId = currentCardIdRef.current;
      if (!cardId) return;
      if (isSavingRef.current) return;
      const snapshot = getFormSnapshotRef.current();
      if (snapshot === lastSavedSnapshotRef.current) return;
      try {
        await updateFlashcard(cardId, buildPayloadRef.current());
        lastSavedSnapshotRef.current = getFormSnapshotRef.current();
        console.log('Flashcard autosaved');
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    };
    const id = window.setInterval(tick, AUTO_SAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!isSavingRef.current) {
          handleSaveRef.current(true);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => () => {
    if (saveToastTimeoutRef.current) {
      window.clearTimeout(saveToastTimeoutRef.current);
    }
  }, []);

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
        latestVideoTimeRef.current = seconds;
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
  const latestVideoTimeRef = useRef(videoStartTime || 0);

  useEffect(() => {
    latestVideoTimeRef.current = videoStartTime || 0;
  }, [videoId, videoStartTime]);

  useEffect(() => {
    const handleYouTubeMessage = (event) => {
      if (!event.origin.includes('youtube.com')) return;

      const iframe = document.querySelector('#youtube-player');
      if (!iframe?.contentWindow || event.source !== iframe.contentWindow) return;

      let payload = event.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      const currentTime = payload?.info?.currentTime;
      if (typeof currentTime === 'number' && Number.isFinite(currentTime)) {
        latestVideoTimeRef.current = currentTime;
      }
    };
    
    window.addEventListener('message', handleYouTubeMessage);
    return () => {
      window.removeEventListener('message', handleYouTubeMessage);
    };
  }, []);

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
          const startTime = Math.max(0, Math.floor(latestVideoTimeRef.current || 0));

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
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&start=${startTime}&origin=${encodeURIComponent(window.location.origin)}"
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
                className="text-brand-600 hover:text-brand-800 underline mx-1 cursor-pointer bg-brand-50 dark:bg-brand-900/30 px-1 rounded inline-block"
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
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
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
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
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

  const commonInputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 p-3 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";
  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300";

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <div className="flex-1">
        <div className="container mx-auto px-4">
          <Navbar />
          {saveToast.show && (
            <div className="fixed top-4 right-4 z-50">
              <div
                className={`px-4 py-2 rounded-md shadow-lg text-sm font-medium transition-colors ${
                  saveToast.kind === 'success'
                    ? 'bg-emerald-600 text-white'
                    : saveToast.kind === 'error'
                      ? 'bg-red-600 text-white'
                      : 'bg-stone-800 text-stone-100'
                }`}
                role="status"
                aria-live="polite"
              >
                {saveToast.message}
              </div>
            </div>
          )}
          
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
                  onClick={handleOpenQuickAdd}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm"
                  title="Quick-add a new card of the same type"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Quick Add</span>
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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
                      src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0${videoStartTime ? `&start=${videoStartTime}` : ''}`}
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
                      : 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 dark:bg-blue-500 dark:hover:bg-blue-600'
                  }`}
                  title={isPiPActive ? "Exit Picture-in-Picture mode" : "Enable Picture-in-Picture mode"}
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>{isPiPActive ? 'Exit PiP' : 'Enable PiP'}</span>
                </button>
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
              <div className="mb-4">
                <label className={commonLabelClasses}>Explanation (Live Markdown)</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Type markdown and see it rendered in real-time. Use the toolbar or keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic).
                </p>
              </div>
              <LiveMarkdownEditor
                value={explanation}
                onChange={setExplanation}
                placeholder="Start writing your notes in Markdown... Use the toolbar above or keyboard shortcuts to format your text."
                minHeight="300px"
                showToolbar={true}
                onTimestampClick={handleTimestampClick}
              />
            </div>

            {/* Problem Statement Field */}
            <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
              <div className="mb-4">
                <label className={commonLabelClasses}>Problem Statement (Live Markdown)</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Type markdown and see it rendered in real-time. Use the toolbar or keyboard shortcuts to format your text.
                </p>
              </div>
              <LiveMarkdownEditor
                value={problemStatement}
                onChange={setProblemStatement}
                placeholder="Describe the problem statement in Markdown... Use the toolbar above or keyboard shortcuts to format your text."
                minHeight="200px"
                showToolbar={true}
                onTimestampClick={handleTimestampClick}
              />
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

      {/* ── Quick-Add Modal ───────────────────────────────────────────────── */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto pt-8 pb-8">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <PlusIcon className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Quick Add Card
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                  — will be added to <em>{selectedDeckForView?.name}</em>
                </span>
              </div>
              <button
                onClick={handleCloseQuickAdd}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

              {quickAddError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-md text-sm">
                  {quickAddError}
                </div>
              )}

              {/* Type selector */}
              <div>
                <label className={commonLabelClasses}>
                  Type <span className="text-red-500">*</span>
                </label>
                <AnimatedDropdown
                  options={FLASHCARD_TYPES.filter(t => t !== 'All').map(t => ({ value: t, label: t }))}
                  value={newType}
                  onChange={(opt) => setNewType(opt.value)}
                  placeholder="Select type"
                />
              </div>

              {/* Question / Word */}
              <div>
                <label className={commonLabelClasses}>
                  {newType === 'GRE-Word' ? 'Word' : 'Question'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  rows={2}
                  className={commonInputClasses}
                  placeholder={newType === 'GRE-Word' ? 'Enter the word…' : 'Enter your question…'}
                />
              </div>

              {/* ── GRE-Word fields ── */}
              {newType === 'GRE-Word' && (
                <>
                  <div>
                    <label className={commonLabelClasses}>Definition</label>
                    <textarea
                      value={newExplanation}
                      onChange={(e) => setNewExplanation(e.target.value)}
                      rows={3}
                      className={commonInputClasses}
                      placeholder="Definition of the word…"
                    />
                  </div>
                  <div>
                    <label className={commonLabelClasses}>Example Sentence</label>
                    <textarea
                      value={newGreExampleSentence}
                      onChange={(e) => setNewGreExampleSentence(e.target.value)}
                      rows={2}
                      className={commonInputClasses}
                      placeholder="Example sentence using the word…"
                    />
                  </div>
                  <div>
                    <label className={commonLabelClasses}>Word Root / Etymology</label>
                    <textarea
                      value={newGreWordRoot}
                      onChange={(e) => setNewGreWordRoot(e.target.value)}
                      rows={2}
                      className={commonInputClasses}
                      placeholder="Origin and etymology…"
                    />
                  </div>
                  <div>
                    <label className={commonLabelClasses}>Similar Words (comma-separated)</label>
                    <input
                      type="text"
                      value={newGreSimilarWords}
                      onChange={(e) => setNewGreSimilarWords(e.target.value)}
                      className={commonInputClasses}
                      placeholder="synonyms, antonyms…"
                    />
                  </div>
                </>
              )}

              {/* ── GRE-MCQ fields ── */}
              {newType === 'GRE-MCQ' && (
                <>
                  <div>
                    <label className={commonLabelClasses}>Explanation / Context</label>
                    <textarea
                      value={newExplanation}
                      onChange={(e) => setNewExplanation(e.target.value)}
                      rows={3}
                      className={commonInputClasses}
                      placeholder="Explanation or additional context…"
                    />
                  </div>
                  <div>
                    <label className={commonLabelClasses}>Quiz Type</label>
                    <div className="flex items-center space-x-6 mt-1">
                      {['single-correct', 'multiple-correct'].map((val) => (
                        <label key={val} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="radio"
                            name="newMcqType"
                            value={val}
                            checked={newMcqType === val}
                            onChange={() => setNewMcqType(val)}
                            className="mr-2 text-brand-600 focus:ring-brand-500"
                          />
                          {val === 'single-correct' ? 'Single Correct' : 'Multiple Correct'}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={commonLabelClasses}>Options</label>
                    <div className="space-y-2 mt-1">
                      {newMcqOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 border rounded-md dark:border-gray-600">
                          <input
                            type={newMcqType === 'single-correct' ? 'radio' : 'checkbox'}
                            name="newCorrectOption"
                            checked={opt.isCorrect}
                            onChange={(e) => quickUpdateMcqOption(idx, 'isCorrect', e.target.checked)}
                            className="text-brand-600 focus:ring-brand-500"
                          />
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => quickUpdateMcqOption(idx, 'text', e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          {newMcqOptions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => quickRemoveMcqOption(idx)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={quickAddNewMcqOption}
                        className="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── Standard (DSA / System Design / etc.) fields ── */}
              {!['GRE-Word', 'GRE-MCQ'].includes(newType) && (
                <>
                  <div>
                    <label className={commonLabelClasses}>Hint</label>
                    <textarea
                      value={newHint}
                      onChange={(e) => setNewHint(e.target.value)}
                      rows={2}
                      className={commonInputClasses}
                      placeholder="Optional hint…"
                    />
                  </div>
                  <div>
                    <label className={commonLabelClasses}>Explanation</label>
                    <LiveMarkdownEditor
                      value={newExplanation}
                      onChange={setNewExplanation}
                      placeholder="Write your explanation in Markdown…"
                      minHeight="160px"
                      showToolbar={true}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClasses}>Problem Statement</label>
                    <LiveMarkdownEditor
                      value={newProblemStatement}
                      onChange={setNewProblemStatement}
                      placeholder="Describe the problem…"
                      minHeight="120px"
                      showToolbar={false}
                    />
                  </div>
                  <div>
                    <label className={commonLabelClasses}>Code Language</label>
                    <select
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      className={commonInputClasses}
                    >
                      {[
                        { value: 'python', label: 'Python' },
                        { value: 'cpp', label: 'C++' },
                        { value: 'java', label: 'Java' },
                        { value: 'javascript', label: 'JavaScript' },
                      ].map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={commonLabelClasses}>Code</label>
                    <CodeEditor value={newCode} onChange={setNewCode} language={newLanguage} />
                  </div>
                  <div>
                    <label className={commonLabelClasses}>Link</label>
                    <input
                      type="url"
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      className={commonInputClasses}
                      placeholder="https://…"
                    />
                  </div>
                </>
              )}

              {/* Tags — all types */}
              <div>
                <label className={commonLabelClasses}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className={commonInputClasses}
                  placeholder="e.g. arrays, two-pointers"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end items-center gap-3 px-6 py-4 border-t dark:border-gray-700">
              <button
                onClick={handleCloseQuickAdd}
                className="px-5 py-2 rounded-md text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAddSave}
                disabled={isCreating || !newQuestion.trim()}
                className="flex items-center space-x-2 px-5 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <PlusIcon className="h-4 w-4" />
                )}
                <span>{isCreating ? 'Creating…' : 'Create Card'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ──────────────────────────────────────────────────────────────────── */}
    </div>
  );
};

export default StudyView; 