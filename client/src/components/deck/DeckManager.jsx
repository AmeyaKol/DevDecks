// client/src/components/DeckManager.jsx (New Component - Simplified)
import React, { useState, useEffect } from "react";
import useFlashcardStore from "../../store/flashcardStore";
import DeckForm from "./DeckForm";
import AnimatedDropdown from "../common/AnimatedDropdown";
import { PencilIcon, TrashIcon, FunnelIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Helper function to validate timestamp format (MM:SS or HH:MM:SS)
const isValidTimestamp = (timestamp) => {
  const regex = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;
  return regex.test(timestamp);
};

// Helper function to parse timestamp to seconds
const parseTimestampToSeconds = (timestamp) => {
  const parts = timestamp.split(':').reverse();
  let seconds = 0;
  if (parts[0]) seconds += parseInt(parts[0]); // seconds
  if (parts[1]) seconds += parseInt(parts[1]) * 60; // minutes
  if (parts[2]) seconds += parseInt(parts[2]) * 3600; // hours
  return seconds;
};

// Helper to extract video ID from YouTube URL
const extractVideoIdFromUrl = (url) => {
  // Match youtube.com/watch?v=VIDEO_ID
  let match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  
  // Match youtu.be/VIDEO_ID
  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  
  // Match youtube.com/embed/VIDEO_ID
  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  
  return null;
};

function DeckManager() {
  const { user, isAuthenticated } = useAuth();
  const { 
    decks, 
    addDeck, 
    updateDeckStore, 
    confirmDeleteDeck, 
    startEditDeck, 
    cancelEditDeck, 
    editingDeck,
    isLoadingDecks,
    addFlashcard
  } = useFlashcardStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('DSA');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedType, setSelectedType] = useState('All');

  // --- YouTube Playlist Import State ---
  const [ytUrl, setYtUrl] = useState('');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState('');
  const [ytSuccess, setYtSuccess] = useState('');
  const [showYtFields, setShowYtFields] = useState(false);
  const [ytDeckName, setYtDeckName] = useState('');
  const [ytDeckType, setYtDeckType] = useState('DSA');

  // --- Split Card Feature State ---
  const [splitVideoUrl, setSplitVideoUrl] = useState('');
  const [splitVideoData, setSplitVideoData] = useState(null); // { videoId, title, videoUrl }
  const [showSplitUI, setShowSplitUI] = useState(false);
  const [checkpoints, setCheckpoints] = useState([]); // [{ id, timestamp: '1:01', title: 'intro' }]
  const [splitDeckName, setSplitDeckName] = useState('');
  const [splitDeckType, setSplitDeckType] = useState('DSA');
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitError, setSplitError] = useState('');
  const [splitSuccess, setSplitSuccess] = useState('');
  // Form state for adding new checkpoint
  const [newCheckpointTimestamp, setNewCheckpointTimestamp] = useState('');
  const [newCheckpointTitle, setNewCheckpointTitle] = useState('');

  const deckTypes = ['All', 'DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'];

  useEffect(() => {
    if (editingDeck) {
      setName(editingDeck.name);
      setDescription(editingDeck.description || '');
      setType(editingDeck.type || 'DSA');
      setIsPublic(editingDeck.isPublic);
      
      // Scroll to the top of the manage decks section when editing starts
      setTimeout(() => {
        const deckManagerElement = document.getElementById('deck-manager-section');
        if (deckManagerElement) {
          deckManagerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      setName('');
      setDescription('');
      setType('DSA');
      setIsPublic(true);
    }
  }, [editingDeck]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingDeck) {
      updateDeckStore(editingDeck._id, { name, description, type, isPublic });
    } else {
      addDeck({ name, description, type, isPublic });
    }
    handleCancelEdit(); // Reset form after submit
  };

  const handleCancelEdit = () => {
    cancelEditDeck();
    setName('');
    setDescription('');
    setType('DSA');
    setIsPublic(true);
  };

  // Only show decks owned by the current user
  const userDecks = decks.filter(deck =>
    user && (deck.user?._id === user._id || deck.user?.username === user.username)
  );

  // Filter decks by selected type
  const filteredDecks = selectedType === 'All' 
    ? userDecks 
    : userDecks.filter(deck => deck.type === selectedType);

  // Check if current user can edit/delete a deck
  const canModifyDeck = (deck) => {
    return isAuthenticated && (
      user?._id === deck.user?._id || 
      deck.user?.username === user?.username
    );
  };

  // Handle YouTube playlist import (step 1: show fields)
  const handleShowImportFields = (e) => {
    e.preventDefault();
    setYtError('');
    setYtSuccess('');
    if (!ytUrl.trim()) {
      setYtError('Please enter a YouTube playlist URL.');
      return;
    }
    setShowYtFields(true);
  };

  // Handle YouTube playlist import (step 2: submit actual import)
  const handleImportPlaylistSubmit = async (e) => {
    e.preventDefault();
    setYtError('');
    setYtSuccess('');
    if (!ytUrl.trim()) {
      setYtError('Please enter a YouTube playlist URL.');
      return;
    }
    if (!ytDeckName.trim()) {
      setYtError('Please enter a name for the new deck.');
      return;
    }
    if (!ytDeckType) {
      setYtError('Please select a type for the new deck.');
      return;
    }
    setYtLoading(true);

    // Use full backend URL in production, relative in development
    const API_BASE = process.env.NODE_ENV === 'production'
      ? 'https://devdecks-api.onrender.com'
      : '';
    const requestUrl = `${API_BASE}/api/youtube/playlist`;
    const requestBody = { playlistUrl: ytUrl.trim() };
    console.log(`[DEBUG] Making POST request to: ${requestUrl}`);
    console.log('[DEBUG] Request body:', JSON.stringify(requestBody, null, 2));

    try {
      const resp = await axios.post(requestUrl, requestBody);
      
      // --- START BROWSER DEBUG LOGGING ---
      console.log('[DEBUG] Received response from server:');
      console.log(JSON.stringify(resp.data, null, 2));
      // --- END BROWSER DEBUG LOGGING ---
      
      const { videos } = resp.data;
      if (!videos || videos.length === 0) {
        setYtError('No videos found in playlist. Check debug info in server response.');
        setYtLoading(false);
        return;
      }
      // Create the deck
      const newDeck = await addDeck({ name: ytDeckName, description: `Imported from YouTube playlist: ${ytUrl}`, type: ytDeckType, isPublic: true });
      // Create flashcards for each video
      for (const video of videos) {
        await addFlashcard({
          question: video.title,
          link: video.videoUrl,
          type: ytDeckType,
          tags: ['youtube', 'imported'],
          decks: [newDeck._id],
          isPublic: true,
          explanation: 'Enter explanation here',
        });
      }
      setYtSuccess(`Imported ${videos.length} videos as flashcards!`);
      setYtUrl('');
      setShowYtFields(false);
      setYtDeckName('');
      setYtDeckType('DSA');
    } catch (err) {
      // --- START BROWSER DEBUG LOGGING ---
      console.error('[DEBUG] An error occurred during the import request.');
      if (err.response) {
        console.error('[DEBUG] Error response data:', JSON.stringify(err.response.data, null, 2));
        console.error('[DEBUG] Error response status:', err.response.status);
      } else {
        console.error('[DEBUG] Axios error message:', err.message);
      }
      // --- END BROWSER DEBUG LOGGING ---
      setYtError(err.response?.data?.error || err.message || 'Failed to import playlist.');
    } finally {
      setYtLoading(false);
    }
  };

  // Reset extra fields if URL is cleared
  useEffect(() => {
    if (!ytUrl) {
      setShowYtFields(false);
      setYtDeckName('');
      setYtDeckType('DSA');
    }
  }, [ytUrl]);

  // --- Split Card Feature Handlers ---
  
  // Handle split video URL validation (step 1)
  const handleSplitVideoValidate = async (e) => {
    e.preventDefault();
    setSplitError('');
    setSplitSuccess('');
    
    if (!splitVideoUrl.trim()) {
      setSplitError('Please enter a YouTube video URL.');
      return;
    }
    
    // Client-side validation: check for playlist URL
    if (splitVideoUrl.includes('list=')) {
      setSplitError('Playlist URLs are not supported for split cards. Please use a single video URL.');
      return;
    }
    
    // Extract video ID client-side
    const videoId = extractVideoIdFromUrl(splitVideoUrl);
    if (!videoId) {
      setSplitError('Invalid YouTube video URL. Please use a valid youtube.com or youtu.be link.');
      return;
    }
    
    setSplitLoading(true);
    
    try {
      // Use full backend URL in production
      const API_BASE = process.env.NODE_ENV === 'production'
        ? 'https://devdecks-api.onrender.com'
        : '';
      const requestUrl = `${API_BASE}/api/youtube/video`;
      
      const resp = await axios.post(requestUrl, { videoUrl: splitVideoUrl.trim() });
      
      console.log('[DEBUG] Video validation response:', resp.data);
      console.log('[DEBUG] Chapters found:', resp.data.chapters?.length || 0);
      
      setSplitVideoData({
        videoId: resp.data.videoId,
        title: resp.data.title || '',
        videoUrl: resp.data.videoUrl,
        channelTitle: resp.data.channelTitle || '',
        chapters: resp.data.chapters || [], // Store detected chapters
      });
      
      // Pre-fill deck name with video title if available
      if (resp.data.title && !splitDeckName) {
        setSplitDeckName(resp.data.title);
      }
      
      setShowSplitUI(true);
    } catch (err) {
      console.error('Error validating video:', err);
      setSplitError(err.response?.data?.error || err.message || 'Failed to validate video URL.');
    } finally {
      setSplitLoading(false);
    }
  };
  
  // Add a new checkpoint
  const handleAddCheckpoint = (e) => {
    e.preventDefault();
    setSplitError('');
    
    if (!newCheckpointTimestamp.trim()) {
      setSplitError('Please enter a timestamp.');
      return;
    }
    
    if (!isValidTimestamp(newCheckpointTimestamp.trim())) {
      setSplitError('Invalid timestamp format. Use MM:SS or HH:MM:SS (e.g., 1:30 or 1:05:30).');
      return;
    }
    
    if (!newCheckpointTitle.trim()) {
      setSplitError('Please enter a title for this checkpoint.');
      return;
    }
    
    // Check for duplicate timestamps
    const isDuplicate = checkpoints.some(cp => cp.timestamp === newCheckpointTimestamp.trim());
    if (isDuplicate) {
      setSplitError('A checkpoint with this timestamp already exists.');
      return;
    }
    
    const newCheckpoint = {
      id: Date.now(), // unique ID for React key
      timestamp: newCheckpointTimestamp.trim(),
      title: newCheckpointTitle.trim(),
    };
    
    // Add and sort by timestamp
    const updatedCheckpoints = [...checkpoints, newCheckpoint].sort((a, b) => {
      return parseTimestampToSeconds(a.timestamp) - parseTimestampToSeconds(b.timestamp);
    });
    
    setCheckpoints(updatedCheckpoints);
    setNewCheckpointTimestamp('');
    setNewCheckpointTitle('');
  };
  
  // Add a chapter from detected chapters as a checkpoint
  const handleAddChapterAsCheckpoint = (chapter) => {
    setSplitError('');
    
    // Check for duplicate timestamps
    const isDuplicate = checkpoints.some(cp => cp.timestamp === chapter.timestamp);
    if (isDuplicate) {
      setSplitError(`Checkpoint at ${chapter.timestamp} already exists.`);
      return;
    }
    
    const newCheckpoint = {
      id: Date.now(),
      timestamp: chapter.timestamp,
      title: chapter.title,
    };
    
    // Add and sort by timestamp
    const updatedCheckpoints = [...checkpoints, newCheckpoint].sort((a, b) => {
      return parseTimestampToSeconds(a.timestamp) - parseTimestampToSeconds(b.timestamp);
    });
    
    setCheckpoints(updatedCheckpoints);
  };
  
  // Add all detected chapters as checkpoints
  const handleAddAllChapters = () => {
    setSplitError('');
    
    if (!splitVideoData?.chapters || splitVideoData.chapters.length === 0) {
      setSplitError('No chapters detected in this video.');
      return;
    }
    
    // Filter out chapters that already exist as checkpoints
    const newChapters = splitVideoData.chapters.filter(
      chapter => !checkpoints.some(cp => cp.timestamp === chapter.timestamp)
    );
    
    if (newChapters.length === 0) {
      setSplitError('All chapters have already been added.');
      return;
    }
    
    const newCheckpoints = newChapters.map((chapter, index) => ({
      id: Date.now() + index,
      timestamp: chapter.timestamp,
      title: chapter.title,
    }));
    
    // Merge and sort by timestamp
    const updatedCheckpoints = [...checkpoints, ...newCheckpoints].sort((a, b) => {
      return parseTimestampToSeconds(a.timestamp) - parseTimestampToSeconds(b.timestamp);
    });
    
    setCheckpoints(updatedCheckpoints);
  };
  
  // Remove a checkpoint
  const handleRemoveCheckpoint = (checkpointId) => {
    setCheckpoints(checkpoints.filter(cp => cp.id !== checkpointId));
  };
  
  // Submit split card deck creation
  const handleSplitVideoSubmit = async (e) => {
    e.preventDefault();
    setSplitError('');
    setSplitSuccess('');
    
    if (!splitDeckName.trim()) {
      setSplitError('Please enter a name for the deck.');
      return;
    }
    
    if (!splitDeckType) {
      setSplitError('Please select a deck type.');
      return;
    }
    
    if (checkpoints.length === 0) {
      setSplitError('Please add at least one checkpoint.');
      return;
    }
    
    setSplitLoading(true);
    
    try {
      // Create the deck
      const newDeck = await addDeck({
        name: splitDeckName.trim(),
        description: `Split card deck from YouTube video: ${splitVideoData.title || splitVideoData.videoUrl}`,
        type: splitDeckType,
        isPublic: true,
      });
      
      // Create flashcards for each checkpoint
      for (const checkpoint of checkpoints) {
        const timestampSeconds = parseTimestampToSeconds(checkpoint.timestamp);
        const videoUrlWithTimestamp = `${splitVideoData.videoUrl}&t=${timestampSeconds}s`;
        
        await addFlashcard({
          question: checkpoint.title,
          explanation: `${checkpoint.title}: [${checkpoint.timestamp}]`,
          link: videoUrlWithTimestamp,
          type: splitDeckType,
          tags: ['youtube', 'split-card'],
          decks: [newDeck._id],
          isPublic: true,
        });
      }
      
      setSplitSuccess(`Created deck "${splitDeckName}" with ${checkpoints.length} flashcards!`);
      
      // Reset form
      setSplitVideoUrl('');
      setSplitVideoData(null);
      setShowSplitUI(false);
      setCheckpoints([]);
      setSplitDeckName('');
      setSplitDeckType('DSA');
      setNewCheckpointTimestamp('');
      setNewCheckpointTitle('');
    } catch (err) {
      console.error('Error creating split card deck:', err);
      setSplitError(err.response?.data?.message || err.message || 'Failed to create deck.');
    } finally {
      setSplitLoading(false);
    }
  };
  
  // Reset split card form when URL is cleared
  const handleResetSplitForm = () => {
    setSplitVideoUrl('');
    setSplitVideoData(null);
    setShowSplitUI(false);
    setCheckpoints([]);
    setSplitDeckName('');
    setSplitDeckType('DSA');
    setNewCheckpointTimestamp('');
    setNewCheckpointTitle('');
    setSplitError('');
    setSplitSuccess('');
  };

  return (
    <div id="deck-manager-section" className="bg-white rounded-lg shadow-xl p-6 lg:p-8 dark:bg-gray-800">
      {/* Import from YouTube Playlist */}
      <div className="mb-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
        <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">Import Deck from YouTube Playlist</h3>
        <form onSubmit={showYtFields ? handleImportPlaylistSubmit : handleShowImportFields} className="flex flex-col gap-3 items-stretch">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="url"
              className="flex-1 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
              placeholder="Paste YouTube playlist URL..."
              value={ytUrl}
              onChange={e => setYtUrl(e.target.value)}
              disabled={ytLoading}
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
              disabled={ytLoading}
            >
              {ytLoading ? 'Importing...' : (showYtFields ? 'Edit URL' : 'Continue')}
            </button>
          </div>
          {showYtFields && (
            <div className="flex flex-col sm:flex-row gap-3 items-center mt-2">
              <input
                type="text"
                className="flex-1 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                placeholder="Enter deck name..."
                value={ytDeckName}
                onChange={e => setYtDeckName(e.target.value)}
                disabled={ytLoading}
                required
              />
              <div className="flex-1">
                <AnimatedDropdown
                  options={deckTypes.slice(1).map(deckType => ({ value: deckType, label: deckType }))}
                  value={ytDeckType}
                  onChange={option => setYtDeckType(option.value)}
                  placeholder="Select deck type"
                  disabled={ytLoading}
                />
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-60"
                onClick={handleImportPlaylistSubmit}
                disabled={ytLoading || !ytDeckName || !ytDeckType}
              >
                {ytLoading ? 'Importing...' : 'Submit'}
              </button>
            </div>
          )}
        </form>
        {ytError && <div className="text-red-600 mt-2 text-sm">{ytError}</div>}
        {ytSuccess && <div className="text-green-600 mt-2 text-sm">{ytSuccess}</div>}
      </div>

      {/* Split Card from YouTube Video */}
      <div className="mb-8 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700">
        <h3 className="text-lg font-semibold mb-2 text-purple-800 dark:text-purple-200">
          Split YouTube Video into Cards
        </h3>
        <p className="text-sm text-purple-600 dark:text-purple-300 mb-3">
          Break a long video into multiple flashcards using timestamps.
        </p>
        
        {!showSplitUI ? (
          // Step 1: URL Input
          <form onSubmit={handleSplitVideoValidate} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="url"
                className="flex-1 rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                placeholder="Paste YouTube video URL (not playlist)..."
                value={splitVideoUrl}
                onChange={e => setSplitVideoUrl(e.target.value)}
                disabled={splitLoading}
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-60"
                disabled={splitLoading}
              >
                {splitLoading ? 'Validating...' : 'Continue'}
              </button>
            </div>
          </form>
        ) : (
          // Step 2: Intermediate UI with video embed and checkpoint list
          <div className="space-y-4">
            {/* Video Info Header */}
            <div className="flex justify-between items-start">
              <div>
                {splitVideoData?.title && (
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    {splitVideoData.title}
                  </h4>
                )}
                {splitVideoData?.channelTitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {splitVideoData.channelTitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleResetSplitForm}
                className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Change Video
              </button>
            </div>
            
            {/* YouTube Embed */}
            {splitVideoData?.videoId && (
              <div className="aspect-video w-full max-w-2xl mx-auto">
                <iframe
                  src={`https://www.youtube.com/embed/${splitVideoData.videoId}?enablejsapi=1&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}
            
            {/* Detected Chapters */}
            {splitVideoData && (
              <div className={`rounded-lg p-4 border ${
                splitVideoData.chapters && splitVideoData.chapters.length > 0
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                {splitVideoData.chapters && splitVideoData.chapters.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-blue-800 dark:text-blue-200">
                        Detected Chapters ({splitVideoData.chapters.length})
                      </h5>
                      <button
                        type="button"
                        onClick={handleAddAllChapters}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Add All
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mb-3">
                      Click any chapter to add it as a checkpoint
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {splitVideoData.chapters.map((chapter, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleAddChapterAsCheckpoint(chapter)}
                          className="flex items-start gap-2 p-2 rounded-md bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left border border-blue-200 dark:border-blue-700"
                        >
                          <span className="font-mono text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded shrink-0">
                            {chapter.timestamp}
                          </span>
                          <span className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                            {chapter.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No chapters detected in video description. Add checkpoints manually below.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Add Checkpoint Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Add Checkpoint</h5>
              <form onSubmit={handleAddCheckpoint} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  className="w-28 rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 text-center"
                  placeholder="MM:SS"
                  value={newCheckpointTimestamp}
                  onChange={e => setNewCheckpointTimestamp(e.target.value)}
                  disabled={splitLoading}
                />
                <input
                  type="text"
                  className="flex-1 rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                  placeholder="Checkpoint title (e.g., Introduction, Components, etc.)"
                  value={newCheckpointTitle}
                  onChange={e => setNewCheckpointTitle(e.target.value)}
                  disabled={splitLoading}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center gap-1"
                  disabled={splitLoading}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </form>
            </div>
            
            {/* Checkpoint List */}
            {checkpoints.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  Checkpoints ({checkpoints.length})
                </h5>
                <ul className="space-y-2">
                  {checkpoints.map((checkpoint) => (
                    <li
                      key={checkpoint.id}
                      className="flex items-center justify-between p-2 rounded-md bg-purple-50 dark:bg-purple-900/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                          [{checkpoint.timestamp}]
                        </span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {checkpoint.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCheckpoint(checkpoint.id)}
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove checkpoint"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Deck Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Deck Configuration</h5>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  className="flex-1 rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                  placeholder="Deck name..."
                  value={splitDeckName}
                  onChange={e => setSplitDeckName(e.target.value)}
                  disabled={splitLoading}
                />
                <div className="w-full sm:w-48">
                  <AnimatedDropdown
                    options={deckTypes.slice(1).map(deckType => ({ value: deckType, label: deckType }))}
                    value={splitDeckType}
                    onChange={option => setSplitDeckType(option.value)}
                    placeholder="Select deck type"
                    disabled={splitLoading}
                  />
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSplitVideoSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-60"
                disabled={splitLoading || checkpoints.length === 0 || !splitDeckName.trim()}
              >
                {splitLoading ? 'Creating...' : `Create Deck with ${checkpoints.length} Cards`}
              </button>
            </div>
          </div>
        )}
        
        {splitError && <div className="text-red-600 mt-2 text-sm">{splitError}</div>}
        {splitSuccess && <div className="text-green-600 mt-2 text-sm">{splitSuccess}</div>}
      </div>

      <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3 dark:text-gray-200 dark:border-gray-700">
        {editingDeck ? 'Edit Deck' : 'Create New Deck'}
      </h2>
      
      {/* Form for creating/editing a deck */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Deck Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type
          </label>
          <AnimatedDropdown
            options={deckTypes.slice(1).map(deckType => ({ value: deckType, label: deckType }))}
            value={type}
            onChange={(option) => setType(option.value)}
            placeholder="Select deck type"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          ></textarea>
        </div>
        <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Publicly visible
          </label>
        </div>
        <div className="flex justify-end gap-4">
          {editingDeck && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {editingDeck ? 'Update Deck' : 'Create Deck'}
          </button>
        </div>
      </form>

      {/* List of existing decks */}
      <div className="border-t pt-6 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Your Decks</h3>
          
          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <AnimatedDropdown
              options={deckTypes.map(deckType => ({ value: deckType, label: deckType }))}
              value={selectedType}
              onChange={(option) => setSelectedType(option.value)}
              placeholder="Filter by type"
              className="text-sm min-w-[90px] md:min-w-[180px]"
            />
          </div>
        </div>
        
        {isLoadingDecks ? (
          <p className="text-gray-500 dark:text-gray-400">Loading decks...</p>
        ) : filteredDecks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            {selectedType === 'All' 
              ? "You haven't created any decks yet." 
              : `No ${selectedType} decks found.`
            }
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredDecks.map((deck) => (
              <li
                key={deck._id}
                className="p-4 rounded-md flex justify-between items-center transition-colors bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{deck.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{deck.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${deck.isPublic ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                      {deck.isPublic ? 'Public' : 'Private'}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                      {deck.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      By: {deck.user?.username || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditDeck(deck)}
                    className={`p-2 rounded-md transition-colors ${
                      canModifyDeck(deck)
                        ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-gray-700'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    title={canModifyDeck(deck) ? 'Edit Deck' : 'You can only edit your own decks'}
                    disabled={!canModifyDeck(deck)}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => canModifyDeck(deck) && confirmDeleteDeck(deck._id, deck.name)}
                    className={`p-2 rounded-md transition-colors ${
                      canModifyDeck(deck)
                        ? 'text-red-600 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-gray-700'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    title={canModifyDeck(deck) ? 'Delete Deck' : 'You can only delete your own decks'}
                    disabled={!canModifyDeck(deck)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
export default DeckManager;
