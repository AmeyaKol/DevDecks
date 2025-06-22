import React, { useState, useEffect, useMemo } from "react";
import useFlashcardStore from "../store/flashcardStore";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import CodeEditor from "./common/CodeEditor";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function extractFunctionHeader(code = "") {
  // Very naive extraction of the first line that starts with 'def '
  const lines = code.split("\n");
  for (const line of lines) {
    if (line.trim().startsWith("def ")) {
      return line.trim();
    }
  }
  return "def solution(): #your reference code should ideally have a function description with arguments in the first line"; // fallback header
}

function TestTab() {
  const {
    flashcards,
    fetchFlashcards,
    decks,
    fetchDecks,
    currentPage,
  } = useFlashcardStore();

  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [testStarted, setTestStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [showProblemStatement, setShowProblemStatement] = useState(false);
  const [selectedMCQOption, setSelectedMCQOption] = useState(null);

  useEffect(() => {
    if (decks.length === 0) fetchDecks();
    if (flashcards.length === 0) fetchFlashcards();
  }, [fetchDecks, fetchFlashcards, decks.length, flashcards.length]);

  // Filter decks to show only GRE-related decks when coming from GRE Test button
  const filteredDecks = useMemo(() => {
    // If we came from the GRE Test button (indicated by currentPage being 'test' and no deck selected yet)
    if (currentPage === 'test' && !selectedDeckId && decks.length > 0) {
      // Check if there are any GRE decks available
      const greDecks = decks.filter(deck => 
        deck.type === 'GRE-Word' || deck.type === 'GRE-MCQ'
      );
      
      // If GRE decks exist, return only GRE decks
      if (greDecks.length > 0) {
        return greDecks;
      }
    }
    
    // Otherwise, return all decks
    return decks;
  }, [decks, currentPage, selectedDeckId]);

  // Auto-select first GRE deck if available and we're in GRE test mode
  useEffect(() => {
    if (currentPage === 'test' && !selectedDeckId && filteredDecks.length > 0) {
      const greDecks = filteredDecks.filter(deck => 
        deck.type === 'GRE-Word' || deck.type === 'GRE-MCQ'
      );
      if (greDecks.length > 0) {
        setSelectedDeckId(greDecks[0]._id);
      }
    }
  }, [filteredDecks, currentPage, selectedDeckId]);

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
    setShowProblemStatement(false);
    setSelectedMCQOption(null);
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

  const handleMCQOptionClick = (option, index) => {
    setSelectedMCQOption(index);
    setShowAnswer(true);
  };

  const handleLookUp = () => {
    const searchQuery = encodeURIComponent(`${currentCard.question} meaning, example use, root word, synonyms, antonyms`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  const renderGREWordAnswer = () => {
    if (!currentCard || !currentCard.metadata) return null;
    const { metadata, explanation } = currentCard;

    return (
      <div className="space-y-4">
        {/* Look Up Button */}
        <div className="flex justify-end">
          <button
            onClick={handleLookUp}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            Look Up
          </button>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5 text-blue-500" />
            Definition
          </h4>
          <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{explanation}</ReactMarkdown>
          </div>
        </div>

        {metadata.exampleSentence && (
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example Sentence</h4>
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-300 dark:border-blue-600 p-3 rounded-md text-gray-800 dark:text-blue-100">
              <em>"{metadata.exampleSentence}"</em>
            </div>
          </div>
        )}

        {metadata.wordRoot && (
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Etymology</h4>
            <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-300 dark:border-green-600 p-3 rounded-md text-gray-800 dark:text-green-100">
              {metadata.wordRoot}
            </div>
          </div>
        )}

        {metadata.similarWords && metadata.similarWords.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Similar Words</h4>
            <div className="flex flex-wrap gap-2">
              {metadata.similarWords.map((word, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGREMCQOptions = () => {
    if (!currentCard || !currentCard.metadata) return null;
    const { options = [] } = currentCard.metadata;

    return (
      <div className="space-y-3">
        {/* Look Up Button */}
        <div className="flex justify-end">
          <button
            onClick={handleLookUp}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            Look Up
          </button>
        </div>

        {options.map((option, index) => {
          const isSelected = selectedMCQOption === index;
          const isCorrect = option.isCorrect;

          let optionClasses = `p-3 rounded-md border-2 transition-colors w-full text-left flex items-center gap-3
            border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 
            text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`;

          if (showAnswer) {
            if (isCorrect) {
              optionClasses = `p-3 rounded-md border-2 transition-colors w-full text-left flex items-center gap-3
                border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200`;
            } else if (isSelected && !isCorrect) {
              optionClasses = `p-3 rounded-md border-2 transition-colors w-full text-left flex items-center gap-3
                border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200`;
            } else {
               optionClasses = `p-3 rounded-md border-2 transition-colors w-full text-left flex items-center gap-3
                border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white`;
            }
          }

          return (
            <button key={index} onClick={() => handleMCQOptionClick(option, index)} disabled={showAnswer} className={optionClasses}>
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1">{option.text}</span>
              {showAnswer && isCorrect && <span className="text-green-600 dark:text-green-400 font-medium">✓</span>}
              {showAnswer && isSelected && !isCorrect && <span className="text-red-600 dark:text-red-400 font-medium">✗</span>}
            </button>
          );
        })}
      </div>
    );
  };

  if (!testStarted) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Start a Test</h2>
        
        {/* Show GRE filter notice if applicable */}
        {filteredDecks.length < decks.length && filteredDecks.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Showing GRE-related decks only. Switch to the main view to see all decks.
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Select Deck
            </label>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">-- Choose Deck --</option>
              {filteredDecks.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.type})
                </option>
              ))}
            </select>
          </div>
          <button
            disabled={!selectedDeckId || deckFlashcards.length === 0}
            onClick={handleBegin}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50 dark:disabled:bg-indigo-800"
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
    return <p className="dark:text-gray-300">No flashcards in this deck.</p>;
  }

  const isDSA = currentCard.type === "DSA";
  const isGREWord = currentCard.type === "GRE-Word";
  const isGREMCQ = currentCard.type === "GRE-MCQ";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-lg dark:bg-gray-800">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Question {currentIndex + 1} / {deckFlashcards.length}
          </h2>
          <div className="space-x-2">
            <button
              onClick={() => navigate(-1)}
              disabled={currentIndex === 0}
              className="p-2 rounded-md bg-gray-100 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:disabled:opacity-50"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate(1)}
              disabled={currentIndex === deckFlashcards.length - 1}
              className="p-2 rounded-md bg-gray-100 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:disabled:opacity-50"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="text-gray-800 whitespace-pre-wrap mb-4 dark:text-gray-200">
          {currentCard.question}
        </p>
        
        {isGREMCQ && (
            <div className="mb-4">
                {renderGREMCQOptions()}
            </div>
        )}

        {/* Problem Statement Toggle */}
        {currentCard.problemStatement && (
          <div className="mb-4">
            <button
              onClick={() => setShowProblemStatement((s) => !s)}
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {showProblemStatement ? "Hide Problem Statement" : "Show Problem Statement"}
            </button>
            {showProblemStatement && (
              <div className="mt-2 p-3 bg-gray-50 border rounded dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-300 prose dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{currentCard.problemStatement}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
        {/* Hint Toggle */}
        {currentCard.hint && (
          <div className="mb-4">
            <button
              onClick={() => setShowHint((s) => !s)}
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
            {showHint && (
              <p className="mt-2 p-3 bg-gray-50 border rounded whitespace-pre-wrap dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-300">
                {currentCard.hint}
              </p>
            )}
          </div>
        )}

        {/* Response area */}
        <div className="mb-4">
          {isDSA ? (
            <CodeEditor value={userResponse} onChange={setUserResponse} />
          ) : isGREWord || isGREMCQ ? (
            // No response area for GRE types
            null
          ) : (
            <textarea
              className="w-full h-40 p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
            />
          )}
        </div>

        {
          !isGREMCQ && (
             <button
              onClick={() => setShowAnswer(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md"
            >
              Check
            </button>
          )
        }
      </div>

      {showAnswer && (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-6 dark:bg-gray-800">
          {/* Explanation */}
          {currentCard.explanation && !isGREWord && (
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold mb-2">Explanation</h3>
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {currentCard.explanation}
              </ReactMarkdown>
            </div>
          )}
          
          {isGREWord && renderGREWordAnswer()}

          {/* Code */}
          {currentCard.code && (
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold mb-2">Code</h3>
              <SyntaxHighlighter language="python" style={atomDark}>
                {currentCard.code}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TestTab; 