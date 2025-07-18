// client/src/components/DeckManager.jsx (New Component - Simplified)
import React, { useState, useEffect } from "react";
import useFlashcardStore from "../../store/flashcardStore";
import DeckForm from "./DeckForm";
import AnimatedDropdown from "../common/AnimatedDropdown";
import { PencilIcon, TrashIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

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
