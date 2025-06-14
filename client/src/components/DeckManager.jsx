// client/src/components/DeckManager.jsx (New Component - Simplified)
import React, { useState, useEffect } from "react";
import useFlashcardStore from "../store/flashcardStore";
import DeckForm from "./DeckForm";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

function DeckManager() {
  const { 
    decks, 
    addDeck, 
    updateDeckStore, 
    confirmDeleteDeck, 
    startEditDeck, 
    cancelEditDeck, 
    editingDeck,
    isLoadingDecks 
  } = useFlashcardStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (editingDeck) {
      setName(editingDeck.name);
      setDescription(editingDeck.description || '');
      setIsPublic(editingDeck.isPublic);
    } else {
      setName('');
      setDescription('');
      setIsPublic(true);
    }
  }, [editingDeck]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingDeck) {
      updateDeckStore(editingDeck._id, { name, description, isPublic });
    } else {
      addDeck({ name, description, isPublic });
    }
    handleCancelEdit(); // Reset form after submit
  };

  const handleCancelEdit = () => {
    cancelEditDeck();
    setName('');
    setDescription('');
    setIsPublic(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 dark:bg-gray-800">
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
        <h3 className="text-xl font-semibold text-gray-700 mb-4 dark:text-gray-200">Your Decks</h3>
        {isLoadingDecks ? (
          <p className="text-gray-500 dark:text-gray-400">Loading decks...</p>
        ) : decks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">You haven't created any decks yet.</p>
        ) : (
          <ul className="space-y-3">
            {decks.map((deck) => (
              <li
                key={deck._id}
                className="p-4 rounded-md flex justify-between items-center transition-colors bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{deck.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{deck.description}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${deck.isPublic ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                    {deck.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditDeck(deck)}
                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Edit Deck"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => confirmDeleteDeck(deck._id, deck.name)}
                    className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete Deck"
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
