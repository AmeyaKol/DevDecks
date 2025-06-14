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
    createFlashcard,
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
        await createFlashcard(flashcardData);
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
    "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 text-base";
  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <section id="flashcard-form-section" className="bg-white rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">
        {isEditMode ? "Edit Flashcard" : "Create New Flashcard"}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
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
            <p className="text-sm text-gray-500">
              No decks available. Create decks in the 'Manage Decks' section.
            </p>
          )}
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border p-3 rounded-md">
            {decks.map((deck) => (
              <label
                key={deck._id}
                className="flex items-center space-x-2 text-sm"
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
              <span className="ml-2 text-sm text-gray-700">Public</span>
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
              <span className="ml-2 text-sm text-gray-700">Private</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Public flashcards can be viewed by all users. Private flashcards are only visible to you.
          </p>
        </div>
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {isEditMode ? <PencilSquareIcon className="h-5 w-5 mr-2" /> : <PlusIcon className="h-5 w-5 mr-2" />}
                {isEditMode ? 'Update Flashcard' : 'Create Flashcard'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default FlashcardForm;
