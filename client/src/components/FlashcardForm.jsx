import React, { useState, useEffect } from "react";
import useFlashcardStore from "../store/flashcardStore";
import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import CodeEditor from "./CodeEditor";

const FLASHCARD_TYPES = [
  "DSA",
  "System Design",
  "Behavioral",
  "Technical Knowledge",
  "Other",
];

function FlashcardForm() {
  const {
    addFlashcard,
    updateFlashcard,
    editingFlashcard,
    cancelEdit,
    decks,
    fetchDecks,
    isLoading,
    error,
  } = useFlashcardStore();

  const isEditMode = !!editingFlashcard;

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  useEffect(() => {
    if (editingFlashcard) {
      setQuestion(editingFlashcard.question || '');
      setHint(editingFlashcard.hint || '');
      setExplanation(editingFlashcard.explanation || '');
      setCode(editingFlashcard.code || '');
      setLink(editingFlashcard.link || '');
      setType(editingFlashcard.type || 'DSA');
      setTags(editingFlashcard.tags ? editingFlashcard.tags.join(', ') : '');
      setSelectedDecks(editingFlashcard.decks ? editingFlashcard.decks.map(d => d._id || d) : []);
      setIsPublic(editingFlashcard.isPublic !== undefined ? editingFlashcard.isPublic : true);
    } else {
      resetForm();
    }
  }, [editingFlashcard]);

  const [question, setQuestion] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState('DSA');
  const [tags, setTags] = useState('');
  const [selectedDecks, setSelectedDecks] = useState([]);
  const [isPublic, setIsPublic] = useState(true);

  const resetForm = () => {
    setQuestion('');
    setHint('');
    setExplanation('');
    setCode('');
    setLink('');
    setType('DSA');
    setTags('');
    setSelectedDecks([]);
    setIsPublic(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const flashcardData = {
      question: question.trim(),
      hint: hint.trim(),
      explanation: explanation.trim(),
      code: code.trim(),
      link: link.trim(),
      type,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      decks: selectedDecks,
      isPublic,
    };

    try {
      if (isEditMode) {
        await updateFlashcard(editingFlashcard._id, flashcardData);
      } else {
        await addFlashcard(flashcardData);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving flashcard:', error);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      cancelEdit();
    } else {
      resetForm();
    }
  };

  const handleDeckChange = (deckId) => {
    setSelectedDecks(prev =>
      prev.includes(deckId)
        ? prev.filter(id => id !== deckId)
        : [...prev, deckId]
    );
  };

  const commonInputClasses =
    "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";
  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300";

  return (
    <section id="flashcard-form-section" className="bg-white rounded-lg shadow-xl p-6 dark:bg-gray-800">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3 dark:text-gray-200 dark:border-gray-700">
        {isEditMode ? "Edit Flashcard" : "Create New Flashcard"}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="question" className={commonLabelClasses}>
            Question <span className="text-red-500">*</span>
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows="3"
            className={commonInputClasses}
            required
          />
        </div>
        <div>
          <label htmlFor="hint" className={commonLabelClasses}>
            Hint
          </label>
          <textarea
            id="hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            rows="3"
            className={commonInputClasses}
          />
        </div>
        <div>
          <label htmlFor="explanation" className={commonLabelClasses}>
            Explanation (Markdown) <span className="text-red-500">*</span>
          </label>
          <textarea
            id="explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows="5"
            required
            className={commonInputClasses}
          />
        </div>
        <div>
          <label htmlFor="code" className={commonLabelClasses}>
            Python Code (Tab to indent)
          </label>
          <CodeEditor value={code} onChange={setCode} />
        </div>
        <div>
          <label htmlFor="link" className={commonLabelClasses}>
            Link
          </label>
          <input
            type="url"
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className={commonInputClasses}
          />
        </div>
        <div>
          <label htmlFor="type" className={commonLabelClasses}>
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={commonInputClasses}
          >
            {FLASHCARD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tags" className={commonLabelClasses}>
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={commonInputClasses}
            placeholder="e.g., arrays, two-pointers, dynamic programming"
          />
        </div>
        <div>
          <label className={commonLabelClasses}>Decks</label>
          {decks.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No decks available. Create decks in the 'Manage Decks' section.
            </p>
          )}
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border p-3 rounded-md dark:border-gray-600">
            {decks.map((deck) => (
              <label
                key={deck._id}
                className="flex items-center space-x-2 text-sm dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={deck._id}
                  checked={selectedDecks.includes(deck._id)}
                  onChange={() => handleDeckChange(deck._id)}
                />
                <span>{deck.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={commonLabelClasses}>Privacy Setting</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="privacy"
                value="public"
                checked={isPublic}
                onChange={() => setIsPublic(true)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Public</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="privacy"
                value="private"
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Private</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Public flashcards can be viewed by all users. Private flashcards are only visible to you.
          </p>
        </div>
        <div className="flex justify-end items-center gap-4 pt-6 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            {isEditMode ? "Cancel" : "Clear"}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center px-6 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors dark:disabled:bg-indigo-800"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isEditMode ? (
              <PencilSquareIcon className="h-5 w-5 mr-2" />
            ) : (
              <PlusIcon className="h-5 w-5 mr-2" />
            )}
            {isLoading ? "Saving..." : (isEditMode ? "Update Flashcard" : "Create Flashcard")}
          </button>
        </div>
      </form>
    </section>
  );
}

export default FlashcardForm;
