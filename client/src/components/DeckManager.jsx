// client/src/components/DeckManager.jsx (New Component - Simplified)
import React, { useEffect } from "react";
import useFlashcardStore from "../store/flashcardStore";
import DeckForm from "./DeckForm";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

function DeckManager() {
  const { decks, fetchDecks, startEditDeck, confirmDeleteDeck, editingDeck } =
    useFlashcardStore();

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  return (
    <section
      id="deck-manager"
      className="mb-10 p-6 bg-white rounded-lg shadow-xl"
    >
      <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">
        Manage Decks
      </h2>
      <DeckForm />
      <h3 className="text-xl font-medium mt-6 mb-3">Existing Decks</h3>
      {decks.length === 0 ? (
        <p>No decks created yet.</p>
      ) : (
        <ul className="space-y-2">
          {decks.map((deck) => (
            <li
              key={deck._id}
              className={`p-3 rounded-md flex justify-between items-center ${
                editingDeck && editingDeck._id === deck._id
                  ? "bg-indigo-100"
                  : "bg-gray-50 border"
              }`}
            >
              <div>
                <p className="font-semibold">{deck.name}</p>
                {deck.description && (
                  <p className="text-sm text-gray-600">{deck.description}</p>
                )}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => startEditDeck(deck)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => confirmDeleteDeck(deck._id, deck.name)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
export default DeckManager;
