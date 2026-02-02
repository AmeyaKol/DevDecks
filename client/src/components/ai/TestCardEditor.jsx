/**
 * Test Card Editor
 * 
 * A component for reviewing and editing AI-generated test cards
 * before saving them to a flashcard.
 */

import React, { useState, useEffect } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const TestCardEditor = ({
  cards = [],
  flashcardId,
  onSave,
  onClose,
  className = '',
}) => {
  const [editingCards, setEditingCards] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Initialize cards on mount or when cards prop changes
  useEffect(() => {
    setEditingCards(cards.map(card => ({ ...card, selected: true })));
  }, [cards]);

  // Toggle card selection
  const toggleCardSelection = (index) => {
    setEditingCards(prev => prev.map((card, i) => 
      i === index ? { ...card, selected: !card.selected } : card
    ));
  };

  // Update card field
  const updateCard = (index, field, value) => {
    setEditingCards(prev => prev.map((card, i) => 
      i === index ? { ...card, [field]: value } : card
    ));
  };

  // Delete card
  const deleteCard = (index) => {
    setEditingCards(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  // Add new card
  const addNewCard = () => {
    setEditingCards(prev => [
      ...prev,
      {
        question: '',
        answer: '',
        hint: '',
        difficulty: 'medium',
        aiGenerated: false,
        selected: true,
      }
    ]);
    setEditingIndex(editingCards.length);
  };

  // Save selected cards
  const handleSave = async () => {
    const selectedCards = editingCards.filter(card => card.selected && card.question && card.answer);
    
    if (selectedCards.length === 0) {
      setError('Please select at least one valid card to save');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (flashcardId) {
        // Save to backend
        const response = await api.post('/ai/save-test-cards', {
          flashcardId,
          testCards: selectedCards.map(({ question, answer, hint, difficulty, aiGenerated }) => ({
            question,
            answer,
            hint,
            difficulty,
            aiGenerated,
          })),
        });

        if (response.data.success) {
          setSuccess(`Saved ${selectedCards.length} test cards successfully!`);
          if (onSave) {
            onSave(selectedCards);
          }
          setTimeout(() => {
            if (onClose) onClose();
          }, 1500);
        }
      } else {
        // Just return the cards without saving
        if (onSave) {
          onSave(selectedCards);
        }
        if (onClose) onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save test cards');
    } finally {
      setIsSaving(false);
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'hard':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  if (editingCards.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <SparklesIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No test cards to review.</p>
          <p className="text-sm mt-2">Generate test cards from your study content first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            Review Test Cards ({editingCards.filter(c => c.selected).length}/{editingCards.length} selected)
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Cards list */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
        {editingCards.map((card, index) => (
          <div
            key={index}
            className={`
              border rounded-lg p-3 transition-all
              ${card.selected 
                ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' 
                : 'border-gray-200 dark:border-gray-700 opacity-60'
              }
            `}
          >
            {editingIndex === index ? (
              // Edit mode
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={card.question}
                    onChange={(e) => updateCard(index, 'question', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    placeholder="Enter question..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Answer
                  </label>
                  <textarea
                    value={card.answer}
                    onChange={(e) => updateCard(index, 'answer', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    rows={2}
                    placeholder="Enter answer..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Hint (optional)
                  </label>
                  <input
                    type="text"
                    value={card.hint}
                    onChange={(e) => updateCard(index, 'hint', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    placeholder="Enter hint..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={card.difficulty}
                      onChange={(e) => updateCard(index, 'difficulty', e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="mt-5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Done Editing
                  </button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={card.selected}
                  onChange={() => toggleCardSelection(index)}
                  className="mt-1 h-4 w-4 text-indigo-600 rounded border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(card.difficulty)}`}>
                      {card.difficulty}
                    </span>
                    {card.aiGenerated && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                    {card.question || <span className="text-gray-400 italic">No question</span>}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {card.answer || <span className="text-gray-400 italic">No answer</span>}
                  </p>
                  {card.hint && (
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 italic">
                      Hint: {card.hint}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingIndex(index)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => deleteCard(index)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Add new card button */}
        <button
          onClick={addNewCard}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Card Manually</span>
        </button>

        {/* Error/Success messages */}
        {error && (
          <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm flex items-center gap-2">
            <CheckIcon className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving || editingCards.filter(c => c.selected).length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              <span>Save {editingCards.filter(c => c.selected).length} Cards</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TestCardEditor;




