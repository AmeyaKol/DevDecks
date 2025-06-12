import React, { useState, useEffect, useMemo } from "react";
import useFlashcardStore from "../store/flashcardStore";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

function extractFunctionHeader(code = "") {
  // Very naive extraction of the first line that starts with 'def '
  const lines = code.split("\n");
  for (const line of lines) {
    if (line.trim().startsWith("def ")) {
      return line.trim();
    }
  }
  return "def solution():"; // fallback header
}

const CodeTextarea = ({ value, onChange, readOnly = false }) => (
  <textarea
    className="w-full min-h-[200px] font-mono text-sm p-3 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    readOnly={readOnly}
  />
);

function TestTab() {
  const {
    flashcards,
    fetchFlashcards,
    decks,
    fetchDecks,
  } = useFlashcardStore();

  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [testStarted, setTestStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userResponse, setUserResponse] = useState("");

  useEffect(() => {
    if (decks.length === 0) fetchDecks();
    if (flashcards.length === 0) fetchFlashcards();
  }, [fetchDecks, fetchFlashcards, decks.length, flashcards.length]);

  const deckFlashcards = useMemo(() => {
    if (!selectedDeckId) return [];
    return flashcards.filter((fc) =>
      fc.decks && fc.decks.some((d) => d._id === selectedDeckId)
    );
  }, [selectedDeckId, flashcards]);

  const currentCard = deckFlashcards[currentIndex];

  // Reset view when switching cards
  useEffect(() => {
    setShowHint(false);
    setShowAnswer(false);
    // Reset user response depending on type
    if (currentCard) {
      if (currentCard.type === "DSA") {
        const header = extractFunctionHeader(currentCard.code);
        setUserResponse(`${header}\n    pass`);
      } else {
        setUserResponse("");
      }
    }
  }, [currentIndex, currentCard]);

  const handleBegin = () => {
    if (!selectedDeckId) return;
    if (deckFlashcards.length === 0) return;
    setTestStarted(true);
    setCurrentIndex(0);
  };

  const navigate = (dir) => {
    setCurrentIndex((prev) => {
      const next = prev + dir;
      if (next < 0 || next >= deckFlashcards.length) return prev;
      return next;
    });
  };

  if (!testStarted) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Start a Test</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Deck
            </label>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="block w-full p-2 border rounded-md"
            >
              <option value="">-- Choose Deck --</option>
              {decks.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <button
            disabled={!selectedDeckId || deckFlashcards.length === 0}
            onClick={handleBegin}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
          >
            Begin Test
          </button>
          {selectedDeckId && deckFlashcards.length === 0 && (
            <p className="text-sm text-red-500">
              Selected deck has no flashcards.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return <p>No flashcards in this deck.</p>;
  }

  const isDSA = currentCard.type === "DSA";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold">
            Question {currentIndex + 1} / {deckFlashcards.length}
          </h2>
          <div className="space-x-2">
            <button
              onClick={() => navigate(-1)}
              disabled={currentIndex === 0}
              className="p-2 rounded-md bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate(1)}
              disabled={currentIndex === deckFlashcards.length - 1}
              className="p-2 rounded-md bg-gray-100 disabled:opacity-50"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="text-gray-800 whitespace-pre-wrap mb-4">
          {currentCard.question}
        </p>
        {/* Hint */}
        {currentCard.hint && (
          <div className="mb-4">
            <button
              onClick={() => setShowHint((s) => !s)}
              className="text-indigo-600 hover:underline"
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
            {showHint && (
              <p className="mt-2 p-3 bg-gray-50 border rounded whitespace-pre-wrap">
                {currentCard.hint}
              </p>
            )}
          </div>
        )}

        {/* Response area */}
        <div className="mb-4">
          {isDSA ? (
            <CodeTextarea value={userResponse} onChange={setUserResponse} />
          ) : (
            <textarea
              className="w-full h-40 p-3 border rounded-md"
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
            />
          )}
        </div>

        <button
          onClick={() => setShowAnswer(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md"
        >
          Check
        </button>
      </div>

      {showAnswer && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-semibold">Explanation & Comparison</h3>
          {isDSA ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Your Code</h4>
                <CodeTextarea value={userResponse} onChange={() => {}} readOnly />
              </div>
              <div>
                <h4 className="font-medium mb-2">Reference Code</h4>
                <CodeTextarea value={currentCard.code} onChange={() => {}} readOnly />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Your Answer</h4>
                <textarea
                  className="w-full h-40 p-3 border rounded-md"
                  value={userResponse}
                  readOnly
                />
              </div>
              <div>
                <h4 className="font-medium mb-2">Reference Explanation</h4>
                <div className="p-3 border rounded-md bg-gray-50 whitespace-pre-wrap">
                  {currentCard.explanation}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TestTab; 