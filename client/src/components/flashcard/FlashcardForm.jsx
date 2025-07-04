import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useFlashcardStore from "../../store/flashcardStore";
import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import CodeEditor from "../common/CodeEditor";
import AnimatedDropdown from "../common/AnimatedDropdown";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../../context/AuthContext";

const FLASHCARD_TYPES = [
  "All",
  "DSA",
  "System Design",
  "Behavioral",
  "Technical Knowledge",
  "Other",
  "GRE-Word",
  "GRE-MCQ",
];

// Normalize a tag: lowercase, trim, replace spaces with dashes, singularize common plurals
function normalizeTag(tag) {
  let t = tag.trim().toLowerCase().replace(/\s+/g, '-');
  // Singularize simple plurals (e.g., stacks -> stack, arrays -> array)
  if (t.endsWith('s') && t.length > 3) {
    t = t.slice(0, -1);
  }
  return t;
}

// Add this custom link renderer for ReactMarkdown
const markdownComponents = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

function FlashcardForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    addFlashcard,
    updateFlashcard,
    editingFlashcard,
    cancelEdit,
    decks,
    fetchDecks,
    isLoading,
    error,
    dictionaryData,
    clearDictionaryData,
  } = useFlashcardStore();

  const isEditMode = !!editingFlashcard;

  // State declarations - moved before useEffect hooks
  const [question, setQuestion] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState('All');
  const [tags, setTags] = useState('');
  const [selectedDecks, setSelectedDecks] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [isExplanationPreview, setIsExplanationPreview] = useState(false);
  const [isProblemStatementPreview, setIsProblemStatementPreview] = useState(false);
  const [isCodePreview, setIsCodePreview] = useState(false);
  const [language, setLanguage] = useState('python');

  // GRE-Word specific states
  const [greExampleSentence, setGreExampleSentence] = useState('');
  const [greWordRoot, setGreWordRoot] = useState('');
  const [greSimilarWords, setGreSimilarWords] = useState('');

  // GRE-MCQ specific states
  const [mcqType, setMcqType] = useState('single-correct');
  const [mcqOptions, setMcqOptions] = useState([{ text: '', isCorrect: false }]);

  const LANGUAGE_OPTIONS = [
    { value: 'python', label: 'Python' },
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
    { value: 'javascript', label: 'JavaScript' },
  ];

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Handle URL parameters for auto-selection from DeckView
  useEffect(() => {
    const urlDeck = searchParams.get('deck');
    const urlType = searchParams.get('type');
    
    if (urlDeck && !isEditMode && !dictionaryData) {
      setSelectedDecks([urlDeck]);
    }
    
    if (urlType && !isEditMode && !dictionaryData) {
      setType(urlType);
    }
  }, [searchParams, isEditMode, dictionaryData]);

  useEffect(() => {
    console.log('Main useEffect triggered:', { editingFlashcard: !!editingFlashcard, dictionaryData: !!dictionaryData });
    
    if (dictionaryData) {
      // Handle dictionary data first - don't reset form, just set type and fields
      console.log('Processing dictionary data:', dictionaryData);
      setType('GRE-Word');
      setQuestion(dictionaryData.word || '');
      setExplanation(dictionaryData.definition || '');
      setGreExampleSentence(dictionaryData.example || '');
      setGreWordRoot(dictionaryData.origin || '');
      setGreSimilarWords(dictionaryData.synonyms ? dictionaryData.synonyms.join(', ') : '');
      
      // Clear other fields that aren't relevant for GRE-Word
      setHint('');
      setProblemStatement('');
      setCode('');
      setLink('');
      setTags('');
      setSelectedDecks([]);
      setIsPublic(true);
      
      // Clear the dictionary data after using it
      clearDictionaryData();
    } else if (editingFlashcard) {
      console.log('Editing flashcard data:', editingFlashcard); // Debug log
      console.log('Flashcard metadata:', editingFlashcard.metadata); // Debug log
      
      setQuestion(editingFlashcard.question || '');
      setHint(editingFlashcard.hint || '');
      setExplanation(editingFlashcard.explanation || '');
      setProblemStatement(editingFlashcard.problemStatement || '');
      setCode(editingFlashcard.code || '');
      setLink(editingFlashcard.link || '');
      setType(editingFlashcard.type || 'DSA');
      setTags(editingFlashcard.tags ? editingFlashcard.tags.join(', ') : '');
      setSelectedDecks(editingFlashcard.decks ? editingFlashcard.decks.map(d => d._id || d) : []);
      setIsPublic(editingFlashcard.isPublic !== undefined ? editingFlashcard.isPublic : true);
      setIsPreview(editingFlashcard.isPreview !== undefined ? editingFlashcard.isPreview : false);
      setIsExplanationPreview(editingFlashcard.isExplanationPreview !== undefined ? editingFlashcard.isExplanationPreview : false);
      setIsProblemStatementPreview(editingFlashcard.isProblemStatementPreview !== undefined ? editingFlashcard.isProblemStatementPreview : false);
      setIsCodePreview(editingFlashcard.isCodePreview !== undefined ? editingFlashcard.isCodePreview : false);
      setLanguage(editingFlashcard.language || 'python');
      
      // Handle GRE-specific fields
      if (editingFlashcard.type === 'GRE-Word') {
        console.log('Setting GRE-Word fields:', {
          exampleSentence: editingFlashcard.metadata?.exampleSentence,
          wordRoot: editingFlashcard.metadata?.wordRoot,
          similarWords: editingFlashcard.metadata?.similarWords
        }); // Debug log
        setGreExampleSentence(editingFlashcard.metadata?.exampleSentence || '');
        setGreWordRoot(editingFlashcard.metadata?.wordRoot || '');
        setGreSimilarWords(editingFlashcard.metadata?.similarWords ? editingFlashcard.metadata.similarWords.join(', ') : '');
      } else if (editingFlashcard.type === 'GRE-MCQ') {
        console.log('Setting GRE-MCQ fields:', {
          mcqType: editingFlashcard.metadata?.mcqType,
          options: editingFlashcard.metadata?.options
        }); // Debug log
        setMcqType(editingFlashcard.metadata?.mcqType || 'single-correct');
        setMcqOptions(editingFlashcard.metadata?.options || [{ text: '', isCorrect: false }]);
      }
    } else {
      // Only reset form if no dictionary data and no editing flashcard
      console.log('Resetting form to defaults');
      resetForm();
      // Set deck/type from URL params if present
      const urlDeck = searchParams.get('deck');
      const urlType = searchParams.get('type');
      if (urlDeck) setSelectedDecks([urlDeck]);
      if (urlType) setType(urlType);
    }
  }, [editingFlashcard, dictionaryData, clearDictionaryData, searchParams]);

  const resetForm = () => {
    setQuestion('');
    setHint('');
    setExplanation('');
    setProblemStatement('');
    setCode('');
    setLink('');
    setType('All');
    setTags('');
    setSelectedDecks([]);
    setIsPublic(true);
    setIsPreview(false);
    setIsExplanationPreview(false);
    setIsProblemStatementPreview(false);
    setIsCodePreview(false);
    
    // Reset GRE-specific fields
    setGreExampleSentence('');
    setGreWordRoot('');
    setGreSimilarWords('');
    setMcqType('single-correct');
    setMcqOptions([{ text: '', isCorrect: false }]);
    setLanguage('python');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const flashcardData = {
      question: question.trim(),
      hint: hint.trim(),
      explanation: explanation.trim(),
      problemStatement: problemStatement.trim(),
      code: code.trim(),
      link: link.trim(),
      type,
      tags: tags.split(',').map(tag => normalizeTag(tag)).filter(tag => tag.length > 0),
      decks: selectedDecks,
      isPublic,
      language,
      metadata: {},
    };

    // Add type-specific metadata
    if (type === 'GRE-Word') {
      flashcardData.metadata = {
        exampleSentence: greExampleSentence.trim(),
        wordRoot: greWordRoot.trim(),
        similarWords: greSimilarWords.split(',').map(word => word.trim()).filter(word => word.length > 0),
      };
      console.log('GRE-Word metadata being sent:', flashcardData.metadata); // Debug log
    } else if (type === 'GRE-MCQ') {
      flashcardData.metadata = {
        mcqType,
        options: mcqOptions.filter(option => option.text.trim().length > 0),
      };
      console.log('GRE-MCQ metadata being sent:', flashcardData.metadata); // Debug log
    }

    console.log('Complete flashcard data being sent:', flashcardData); // Debug log

    try {
      if (isEditMode) {
        await updateFlashcard(editingFlashcard._id, flashcardData);
        // After update, redirect to deck view for the first deck (if any)
        const deckId = selectedDecks && selectedDecks.length > 0 ? selectedDecks[0] : null;
        if (deckId) {
          navigate(`/deckView?deck=${deckId}`);
        }
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

  // MCQ option handlers
  const addMcqOption = () => {
    setMcqOptions([...mcqOptions, { text: '', isCorrect: false }]);
  };

  const removeMcqOption = (index) => {
    if (mcqOptions.length > 1) {
      setMcqOptions(mcqOptions.filter((_, i) => i !== index));
    }
  };

  const updateMcqOption = (index, field, value) => {
    const newOptions = [...mcqOptions];
    newOptions[index][field] = value;
    
    // If single-correct type and this option is being marked correct, unmark others
    if (field === 'isCorrect' && value && mcqType === 'single-correct') {
      newOptions.forEach((option, i) => {
        if (i !== index) option.isCorrect = false;
      });
    }
    
    setMcqOptions(newOptions);
  };

  const commonInputClasses =
    "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";
  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300";

  // Helper function to get field label based on type
  const getQuestionLabel = () => {
    if (type === 'GRE-Word') return 'Word';
    if (type === 'GRE-MCQ') return 'Question';
    return 'Question';
  };

  const getExplanationLabel = () => {
    if (type === 'GRE-Word') return 'Definition';
    return 'Explanation (Markdown)';
  };

  // Tab insertion handler for textarea
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

  const userOwnedDecks = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    return decks.filter(deck =>
      (deck.user?._id === user._id || deck.user?.username === user.username) &&
      (type === 'All' || deck.type === type)
    );
  }, [decks, user, isAuthenticated, type]);

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
          <label htmlFor="type" className={commonLabelClasses}>
            Type <span className="text-red-500">*</span>
          </label>
          <AnimatedDropdown
            options={FLASHCARD_TYPES.map(t => ({ value: t, label: t }))}
            value={type}
            onChange={(option) => setType(option.value)}
            placeholder="Select type"
          />
        </div>

        <div>
          <label htmlFor="question" className={commonLabelClasses}>
            {getQuestionLabel()} <span className="text-red-500">*</span>
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

        {/* GRE-Word specific fields */}
        {type === 'GRE-Word' && (
          <>
            <div>
              <label htmlFor="explanation" className={commonLabelClasses}>
                {getExplanationLabel()} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIsExplanationPreview(!isExplanationPreview)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isExplanationPreview ? "Edit" : "Preview"}
                </button>
              </div>
              {isExplanationPreview ? (
                <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                  <ReactMarkdown components={markdownComponents}>{explanation}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  id="explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  onKeyDown={(e) => handleTextareaTab(e, setExplanation)}
                  rows="3"
                  required
                  className={commonInputClasses}
                />
              )}
            </div>
            
            <div>
              <label htmlFor="greExampleSentence" className={commonLabelClasses}>
                Example Sentence
              </label>
              <textarea
                id="greExampleSentence"
                value={greExampleSentence}
                onChange={(e) => setGreExampleSentence(e.target.value)}
                rows="2"
                className={commonInputClasses}
                placeholder="Example sentence using the word..."
              />
            </div>

            <div>
              <label htmlFor="greWordRoot" className={commonLabelClasses}>
                Word Root/Etymology
              </label>
              <textarea
                id="greWordRoot"
                value={greWordRoot}
                onChange={(e) => setGreWordRoot(e.target.value)}
                rows="2"
                className={commonInputClasses}
                placeholder="Origin and etymology of the word..."
              />
            </div>

            <div>
              <label htmlFor="greSimilarWords" className={commonLabelClasses}>
                Similar Words (comma-separated)
              </label>
              <input
                type="text"
                id="greSimilarWords"
                value={greSimilarWords}
                onChange={(e) => setGreSimilarWords(e.target.value)}
                className={commonInputClasses}
                placeholder="synonyms, antonyms, related words..."
              />
            </div>
          </>
        )}

        {/* GRE-MCQ specific fields */}
        {type === 'GRE-MCQ' && (
          <>
            <div>
              <label htmlFor="explanation" className={commonLabelClasses}>
                {getExplanationLabel()} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIsExplanationPreview(!isExplanationPreview)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isExplanationPreview ? "Edit" : "Preview"}
                </button>
              </div>
              {isExplanationPreview ? (
                <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                  <ReactMarkdown components={markdownComponents}>{explanation}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  id="explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  onKeyDown={(e) => handleTextareaTab(e, setExplanation)}
                  rows="3"
                  required
                  className={commonInputClasses}
                  placeholder="Explanation for the correct answer(s)..."
                />
              )}
            </div>

            <div>
              <label className={commonLabelClasses}>
                Quiz Type <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="mcqType"
                    value="single-correct"
                    checked={mcqType === 'single-correct'}
                    onChange={() => setMcqType('single-correct')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Single Correct</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="mcqType"
                    value="multiple-correct"
                    checked={mcqType === 'multiple-correct'}
                    onChange={() => setMcqType('multiple-correct')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Multiple Correct</span>
                </label>
              </div>
            </div>

            <div>
              <label className={commonLabelClasses}>
                Options <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {mcqOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-md dark:border-gray-600">
                    <input
                      type={mcqType === 'single-correct' ? 'radio' : 'checkbox'}
                      name={mcqType === 'single-correct' ? 'correct-option' : `correct-option-${index}`}
                      checked={option.isCorrect}
                      onChange={(e) => updateMcqOption(index, 'isCorrect', e.target.checked)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateMcqOption(index, 'text', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                    {mcqOptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMcqOption(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                        title="Remove option"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMcqOption}
                  className="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  + Add Option
                </button>
              </div>
            </div>
          </>
        )}

        {/* Standard fields for DSA/System Design/etc. types */}
        {!['GRE-Word', 'GRE-MCQ'].includes(type) && (
          <>
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
                {getExplanationLabel()} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIsExplanationPreview(!isExplanationPreview)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isExplanationPreview ? "Edit" : "Preview"}
                </button>
              </div>
              {isExplanationPreview ? (
                <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                  <ReactMarkdown components={markdownComponents}>{explanation}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  id="explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  onKeyDown={(e) => handleTextareaTab(e, setExplanation)}
                  rows={type === 'GRE-Word' || type === 'GRE-MCQ' ? 3 : 5}
                  required
                  className={commonInputClasses}
                  placeholder={type === 'GRE-MCQ' ? 'Explanation for the correct answer(s)...' : undefined}
                />
              )}
            </div>
            <div>
              <label htmlFor="problemStatement" className={commonLabelClasses}>
                Problem Statement (Markdown)
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIsProblemStatementPreview(!isProblemStatementPreview)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isProblemStatementPreview ? "Edit" : "Preview"}
                </button>
              </div>
              {isProblemStatementPreview ? (
                <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                  <ReactMarkdown components={markdownComponents}>{problemStatement}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  id="problemStatement"
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  onKeyDown={(e) => handleTextareaTab(e, setProblemStatement)}
                  rows="5"
                  className={commonInputClasses}
                />
              )}
            </div>
            <div>
              <label htmlFor="language" className={commonLabelClasses}>
                Code Language <span className="text-red-500">*</span>
              </label>
              <select
                id="language"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className={commonInputClasses}
              >
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="code" className={commonLabelClasses}>
                Code (Tab, Shift+Tab to indent/unindent)
              </label>
              <CodeEditor value={code} onChange={setCode} language={language} />
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
          </>
        )}

        {/* Common fields for all types */}
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
          <label className={commonLabelClasses}>Decks (Your Decks Only)</label>
          {!isAuthenticated ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please log in to see your decks.
            </p>
          ) : userOwnedDecks.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You haven't created any decks yet. Create decks in the 'Manage Decks' section.
            </p>
          ) : (
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border p-3 rounded-md dark:border-gray-600">
              {userOwnedDecks.map((deck) => (
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
          )}
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
