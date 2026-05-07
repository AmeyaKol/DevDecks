import React, { useState, useEffect, useMemo } from "react";
import useFlashcardStore from "../store/flashcardStore";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import CodeEditor from "./common/CodeEditor";
import AnimatedDropdown from "./common/AnimatedDropdown";
import CodeDiff from "./common/CodeDiff";
import ReactMarkdown from "react-markdown";
import { useNavigate, useLocation } from "react-router-dom";
import { isGREMode, filterByMode } from "../utils/greUtils";

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

/** ATX headings (# .. ######); skips lines inside fenced code blocks */
function extractMarkdownHeadings(markdown) {
  if (!markdown || typeof markdown !== "string") return [];
  const lines = markdown.split("\n");
  const headings = [];
  let inFence = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(`{3,}|~{3,})/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = trimmed.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (m) {
      headings.push({ level: m[1].length, text: m[2].trim() });
    }
  }
  return headings;
}

/** Nest flat headings into a tree by markdown levels (## under #, ### under ##, …) */
function buildHeadingTree(headings) {
  const root = [];
  const stack = [];
  headings.forEach((h, index) => {
    const node = { level: h.level, text: h.text, index, children: [] };
    while (stack.length && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  });
  return root;
}

function branchHasAnyNotes(node, headingNotes) {
  if ((headingNotes[node.index] ?? "").trim().length > 0) return true;
  return node.children.some((c) => branchHasAnyNotes(c, headingNotes));
}

function headingLabelClasses(level) {
  if (level <= 1) return "text-base font-bold text-stone-900 dark:text-stone-100";
  if (level === 2) return "text-sm font-semibold text-stone-800 dark:text-stone-200";
  if (level === 3) return "text-sm font-medium text-stone-800 dark:text-stone-200";
  return "text-xs font-medium text-stone-700 dark:text-stone-300";
}

function HeadingRecallEditor({ nodes, headingNotes, setHeadingNotes }) {
  if (!nodes.length) return null;
  return (
    <ul className="list-none space-y-3 pl-0 m-0">
      {nodes.map((n) => (
        <li key={n.index} className="m-0">
          <div className="rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50/90 dark:bg-stone-900/50 p-3">
            <label
              className={`block mb-2 ${headingLabelClasses(n.level)}`}
            >
              <span className="font-mono text-brand-600 dark:text-brand-400 mr-2 tabular-nums">
                {`${"#".repeat(n.level)} `}
              </span>
              {n.text}
            </label>
            <textarea
              className="w-full min-h-[5.5rem] p-3 text-sm border rounded-md border-stone-300 dark:bg-stone-800 dark:border-stone-600 dark:text-white placeholder-stone-400 dark:placeholder-stone-500"
              placeholder="What you remember for this section…"
              value={headingNotes[n.index] ?? ""}
              onChange={(e) =>
                setHeadingNotes((prev) => ({ ...prev, [n.index]: e.target.value }))
              }
            />
          </div>
          {n.children.length > 0 ? (
            <div className="mt-3 ml-2 sm:ml-3 border-l-2 border-stone-300/80 dark:border-stone-600 pl-3 sm:pl-4">
              <HeadingRecallEditor
                nodes={n.children}
                headingNotes={headingNotes}
                setHeadingNotes={setHeadingNotes}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function HeadingRecapTree({ nodes, headingNotes }) {
  if (!nodes.length) return null;
  return (
    <ul className="list-none space-y-3 pl-0 m-0">
      {nodes.map((n) => {
        if (!branchHasAnyNotes(n, headingNotes)) return null;
        const note = (headingNotes[n.index] ?? "").trim();
        const childBlock =
          n.children.length > 0 ? (
            <div className="mt-2 ml-2 sm:ml-3 border-l-2 border-amber-400/50 dark:border-amber-600/40 pl-3 sm:pl-4">
              <HeadingRecapTree nodes={n.children} headingNotes={headingNotes} />
            </div>
          ) : null;
        return (
          <li key={n.index} className="m-0">
            <div className={headingLabelClasses(n.level)}>
              <span className="font-mono text-brand-600 dark:text-brand-400 text-xs mr-2">
                {`${"#".repeat(n.level)}`}
              </span>
              {n.text}
            </div>
            {note ? (
              <p className="mt-1 text-sm whitespace-pre-wrap text-stone-700 dark:text-stone-300 pl-0 sm:pl-1">
                {note}
              </p>
            ) : null}
            {childBlock}
          </li>
        );
      })}
    </ul>
  );
}

// Add this custom link renderer for ReactMarkdown
const markdownComponents = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

function TestTab({ section = 'all', deckId, tagFilter, onTestStart, onTestEnd }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    flashcards: allFlashcards,
    fetchFlashcards,
    decks: allDecks,
    fetchDecks,
    currentPage,
  } = useFlashcardStore();
  
  // Filter flashcards and decks based on GRE mode
  const inGREMode = isGREMode(location.pathname);
  const flashcards = filterByMode(allFlashcards, inGREMode);
  const decks = filterByMode(allDecks, inGREMode);
  
  // Debug logging
  console.log('TestTab Debug:', {
    inGREMode,
    allFlashcardsCount: allFlashcards.length,
    filteredFlashcardsCount: flashcards.length,
    allDecksCount: allDecks.length,
    filteredDecksCount: decks.length,
    section
  });

  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [testStarted, setTestStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [showProblemStatement, setShowProblemStatement] = useState(false);
  const [selectedMCQOption, setSelectedMCQOption] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  /** Notes keyed by heading index when explanation uses # headings */
  const [headingNotes, setHeadingNotes] = useState({});

  useEffect(() => {
    if (decks.length === 0) fetchDecks();
    if (flashcards.length === 0) fetchFlashcards();
  }, [fetchDecks, fetchFlashcards, decks.length, flashcards.length]);

  // Filter decks based on the section prop
  const filteredDecks = useMemo(() => {
    if (section === 'technical') {
      return decks.filter(deck => deck.type !== 'GRE-Word' && deck.type !== 'GRE-MCQ');
    }
    if (section === 'gre') {
      return decks.filter(deck => deck.type === 'GRE-Word' || deck.type === 'GRE-MCQ');
    }
    return decks; // 'all' or default
  }, [decks, section]);

  // When the filtered decks change (e.g., due to section change),
  // update the selected deck if it's no longer in the list.
  useEffect(() => {
    if (filteredDecks.length > 0) {
      const isSelectedDeckInList = filteredDecks.some(deck => deck._id === selectedDeckId);
      if (!isSelectedDeckInList) {
        setSelectedDeckId(filteredDecks[0]._id);
      }
    } else {
      setSelectedDeckId("");
    }
  }, [filteredDecks, selectedDeckId]);

  // Handle deckId prop - automatically select the deck if provided
  useEffect(() => {
    if (deckId && filteredDecks.some(deck => deck._id === deckId)) {
      setSelectedDeckId(deckId);
      if (!testStarted) {
        setTestStarted(true);
        setCurrentIndex(0);
        if (onTestStart) onTestStart();
      }
    }
  }, [deckId, filteredDecks, testStarted, onTestStart]);

  const deckFlashcards = useMemo(() => {
    let filtered;
    if (selectedDeckId) {
      filtered = flashcards.filter((fc) =>
        fc.decks && fc.decks.some((d) => d._id === selectedDeckId)
      );
    } else if (tagFilter) {
      filtered = flashcards.filter((fc) =>
        fc.tags && Array.isArray(fc.tags) && fc.tags.includes(tagFilter)
      );
    } else {
      return [];
    }

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [selectedDeckId, tagFilter, flashcards, sortOrder]);

  const currentCard = deckFlashcards[currentIndex];

  const explanationHeadings = useMemo(
    () => extractMarkdownHeadings(currentCard?.explanation),
    [currentCard?.explanation]
  );

  const headingTree = useMemo(
    () => buildHeadingTree(explanationHeadings),
    [explanationHeadings]
  );

  const showHeadingRecall =
    currentCard &&
    currentCard.type !== "DSA" &&
    currentCard.type !== "GRE-Word" &&
    currentCard.type !== "GRE-MCQ" &&
    explanationHeadings.length > 0;

  // Reset view when switching cards
  useEffect(() => {
    setShowHint(false);
    setShowAnswer(false);
    setShowProblemStatement(false);
    setSelectedMCQOption(null);
    setHeadingNotes({});
    // Reset user response depending on type and language
    if (currentCard) {
      if (currentCard.type === "DSA") {
        let starter = "";
        switch (currentCard.language) {
          case "python":
          default:
            starter = extractFunctionHeader(currentCard.code) + "\n    pass";
            break;
          case "java":
            starter = "public class Solution {\n    // your code here\n}";
            break;
          case "cpp":
            starter = "class Solution {\npublic:\n    // your code here\n};";
            break;
          case "javascript":
            starter = "function solution() {\n    // your code here\n}";
            break;
        }
        setUserResponse(starter);
      } else {
        setUserResponse("");
      }
    }
  }, [currentIndex, currentCard]);

  // Reset current index when sort order changes to ensure valid index
  useEffect(() => {
    if (deckFlashcards.length > 0 && currentIndex >= deckFlashcards.length) {
      setCurrentIndex(0);
    }
  }, [deckFlashcards.length, currentIndex]);

  const handleBegin = async () => {
    if (!selectedDeckId) return;
    
    // Fetch flashcards for the selected deck before starting
    await fetchFlashcards({ deck: selectedDeckId, paginate: false });
    
    setTestStarted(true);
    setCurrentIndex(0);
    
    // Update URL to appropriate testing route based on mode
    const testingRoute = inGREMode ? `/gre/testing?deck=${selectedDeckId}` : `/testing?deck=${selectedDeckId}`;
    navigate(testingRoute);
    
    if (onTestStart) onTestStart();
  };

  const handleEndTest = () => {
    setTestStarted(false);
    setCurrentIndex(0);
    setShowHint(false);
    setShowAnswer(false);
    setShowProblemStatement(false);
    setSelectedMCQOption(null);
    setUserResponse("");
    setHeadingNotes({});
    
    // Navigate back to appropriate test page based on mode
    const testRoute = inGREMode ? '/gre/test' : '/test';
    navigate(testRoute);
    
    if (onTestEnd) onTestEnd();
  };

  const navigateQuestions = (dir) => {
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
            <h4 className="text-lg font-semibold mb-2 text-stone-900 dark:text-white flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-blue-500" />
              Definition
            </h4>
            <div className="prose dark:prose-invert max-w-none bg-stone-50 dark:bg-stone-900 p-4 rounded-md">
              <ReactMarkdown components={markdownComponents}>{explanation}</ReactMarkdown>
            </div>
          </div>

          {metadata.exampleSentence && (
            <div>
              <h4 className="text-lg font-semibold mb-2 text-stone-900 dark:text-white">Example Sentence</h4>
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-300 dark:border-blue-600 p-3 rounded-md text-stone-800 dark:text-blue-100">
                <em>"{metadata.exampleSentence}"</em>
              </div>
            </div>
          )}

          {metadata.wordRoot && (
            <div>
              <h4 className="text-lg font-semibold mb-2 text-stone-900 dark:text-white">Etymology</h4>
              <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-300 dark:border-green-600 p-3 rounded-md text-stone-800 dark:text-green-100">
                {metadata.wordRoot}
              </div>
            </div>
          )}

          {metadata.similarWords && metadata.similarWords.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-2 text-stone-900 dark:text-white">Similar Words</h4>
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
            border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 
            text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer`;

          if (showAnswer) {
            if (isCorrect) {
              optionClasses = `p-3 rounded-md border-2 transition-colors w-full text-left flex items-center gap-3
                border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200`;
            } else if (isSelected && !isCorrect) {
              optionClasses = `p-3 rounded-md border-2 transition-colors w-full text-left flex items-center gap-3
                border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200`;
            } else {
               optionClasses = `p-3 rounded-md border-2 transition-colors w-full text-left flex items-center gap-3
                border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white`;
            }
          }

          return (
            <button key={index} onClick={() => handleMCQOptionClick(option, index)} disabled={showAnswer} className={optionClasses}>
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-600 flex items-center justify-center text-sm font-medium">
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

  // Auto-start when tagFilter is provided
  useEffect(() => {
    if (tagFilter && !testStarted && !selectedDeckId) {
      setTestStarted(true);
      setCurrentIndex(0);
      if (onTestStart) onTestStart();
    }
  }, [tagFilter, testStarted, selectedDeckId, onTestStart]);

  if (!testStarted && !deckId && !tagFilter) {
    return (
      <div className="text-center">
        <div className="inline-block bg-white dark:bg-stone-800 p-8 rounded-lg shadow-2xl w-full max-w-lg mx-auto transition-colors">
          <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-6">Start a Test Session</h2>
          <div className="mb-6">
            <label htmlFor="deck-select" className="block text-lg font-medium text-stone-700 dark:text-stone-300 mb-2">
              Choose a Deck
            </label>
            <AnimatedDropdown
              value={selectedDeckId}
              onChange={(option) => setSelectedDeckId(option.value)}
              options={filteredDecks.length > 0 
                ? filteredDecks.map((deck) => ({
                    value: deck._id,
                    label: `${deck.name} (${deck.type})`,
                  }))
                : [{ value: '', label: 'No decks available for this section' }]
              }
              placeholder="Choose a deck"
              disabled={filteredDecks.length === 0}
            />
          </div>
          <button
            disabled={!selectedDeckId}
            onClick={handleBegin}
            className="px-4 py-2 bg-brand-600 text-white rounded-md disabled:opacity-50 hover:bg-brand-700 transition-colors dark:disabled:bg-brand-800"
          >
            Begin Test
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard || deckFlashcards.length === 0) {
    return (
      <div className="text-center">
        <div className="inline-block bg-white dark:bg-stone-800 p-8 rounded-lg shadow-2xl w-full max-w-lg mx-auto transition-colors">
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">No Flashcards Found</h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            {tagFilter
              ? `No flashcards found with tag "${tagFilter}". Try a different topic.`
              : 'The selected deck has no flashcards. Please add some flashcards to this deck or choose a different deck.'}
          </p>
          <button
            onClick={handleEndTest}
            className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
          >
            Back to Deck Selection
          </button>
        </div>
      </div>
    );
  }

  const isDSA = currentCard.type === "DSA";
  const isGREWord = currentCard.type === "GRE-Word";
  const isGREMCQ = currentCard.type === "GRE-MCQ";

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-lg dark:bg-stone-800 transition-colors">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
              Question {currentIndex + 1} / {deckFlashcards.length}
            </h2>
            <button
              onClick={handleEndTest}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              {/* Show X icon on small screens, text on md+ */}
              <span className="block md:hidden"><XMarkIcon className="h-5 w-5" /></span>
              <span className="hidden md:block">End Test</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-brand-600 border border-brand-700 rounded-md hover:bg-brand-700 transition-colors dark:bg-brand-700 dark:border-brand-800 dark:hover:bg-brand-600"
              title={`Currently showing ${sortOrder} first. Click to switch to ${sortOrder === 'newest' ? 'oldest' : 'newest'} first`}
            >
              {sortOrder === 'newest' ? (
                <>
                  <ChevronRightIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Newest First</span>
                  <span className="sm:hidden">New</span>
                </>
              ) : (
                <>
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Oldest First</span>
                  <span className="sm:hidden">Old</span>
                </>
              )}
            </button>
            <div className="space-x-2 flex">
              <button
                onClick={() => navigateQuestions(-1)}
                disabled={currentIndex === 0}
                className="p-2 rounded-md bg-stone-100 disabled:opacity-50 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:disabled:opacity-50 dark:hover:bg-stone-600"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigateQuestions(1)}
                disabled={currentIndex === deckFlashcards.length - 1}
                className="p-2 rounded-md bg-stone-100 disabled:opacity-50 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:disabled:opacity-50 dark:hover:bg-stone-600"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <p className="text-stone-800 whitespace-pre-wrap mb-4 dark:text-stone-200">
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
              className="text-brand-600 hover:underline dark:text-amber-500"
            >
              {showProblemStatement ? "Hide Problem Statement" : "Show Problem Statement"}
            </button>
            {showProblemStatement && (
              <div className="mt-2 p-3 bg-stone-50 border rounded dark:bg-stone-700/50 dark:border-stone-600 dark:text-stone-300 prose dark:prose-invert">
                <ReactMarkdown components={markdownComponents}>{currentCard.problemStatement}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
        {/* Hint Toggle */}
        {currentCard.hint && (
          <div className="mb-4">
            <button
              onClick={() => setShowHint((s) => !s)}
              className="text-brand-600 hover:underline dark:text-amber-500"
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
            {showHint && (
              <p className="mt-2 p-3 bg-stone-50 border rounded whitespace-pre-wrap dark:bg-stone-700/50 dark:border-stone-600 dark:text-stone-300">
                {currentCard.hint}
              </p>
            )}
          </div>
        )}

        {/* Response area - Show side-by-side only after checking answer */}
        <div className="mb-4">
          {isDSA ? (
            currentCard.code && currentCard.code.trim() && showAnswer ? (
              // Side-by-side code comparison (only after clicking Check)
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-stone-700 dark:text-stone-300">
                    Your Implementation
                  </h3>
                  <CodeEditor value={userResponse} onChange={setUserResponse} language={currentCard.language || 'python'} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-stone-700 dark:text-stone-300">
                    Reference Solution
                  </h3>
                  <CodeEditor 
                    value={currentCard.code} 
                    onChange={() => {}} // Read-only
                    language={currentCard.language || 'python'}
                    readOnly={true}
                  />
                </div>
              </div>
            ) : (
              // Single editor (before checking or when no reference code)
              <CodeEditor value={userResponse} onChange={setUserResponse} language={currentCard.language || 'python'} />
            )
          ) : isGREWord || isGREMCQ ? (
            // No response area for GRE types
            null
          ) : showHeadingRecall ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Recall by explanation headings
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Headings are taken from this card&apos;s explanation (markdown lines starting with{' '}
                  <code className="text-xs bg-stone-100 dark:bg-stone-700 px-1 rounded">#</code>
                  ). Fill in what you remember, then use <strong className="font-medium text-stone-700 dark:text-stone-300">Check</strong> to
                  read the full explanation.
                </p>
              </div>
              <HeadingRecallEditor
                nodes={headingTree}
                headingNotes={headingNotes}
                setHeadingNotes={setHeadingNotes}
              />
            </div>
          ) : (
            <textarea
              className="w-full h-40 p-3 border rounded-md dark:bg-stone-700 dark:border-stone-600 dark:text-white"
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
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-6 dark:bg-stone-800 transition-colors">
          {/* Code Display for non-DSA questions or when no reference code */}
          {!isDSA && currentCard.code && (
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold mb-2">Code</h3>
              <SyntaxHighlighter language={currentCard.language || 'python'} style={atomDark}>
                {currentCard.code}
              </SyntaxHighlighter>
            </div>
          )}
          
          {showHeadingRecall &&
            headingTree.some((n) => branchHasAnyNotes(n, headingNotes)) && (
              <div className="rounded-lg border border-amber-200/80 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-950/25 p-4">
                <h3 className="text-lg font-semibold mb-3 text-stone-900 dark:text-stone-100">
                  Your notes (by heading)
                </h3>
                <HeadingRecapTree nodes={headingTree} headingNotes={headingNotes} />
              </div>
            )}

          {/* Explanation */}
          {currentCard.explanation && !isGREWord && (
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold mb-2">Explanation</h3>
              <ReactMarkdown components={markdownComponents}>
                {currentCard.explanation}
              </ReactMarkdown>
            </div>
          )}
          
          {isGREWord && renderGREWordAnswer()}
        </div>
      )}
    </div>
  );
}

export default TestTab; 