import React, { useState } from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

const incorrectOptionClasses = 'border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white';

// Mirrors FlashcardItem.jsx's renderGREMCQContent() -- numbered options,
// click-to-reveal, Show/Hide Answer toggle, correct-answer summary -- so a
// Custom deck's mcq field looks and behaves the same as a GRE-MCQ card.
// value shape: { mcqType, options: [{ text, isCorrect }] }
export default function McqFieldRenderer({ field, value }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const options = value?.options || [];
  if (options.length === 0) return null;

  const correctOptions = options.filter((option) => option.isCorrect);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-stone-900 dark:text-white flex items-center gap-2">
        <AcademicCapIcon className="h-4 w-4 text-amber-500" />
        {field.displayName} ({(value?.mcqType || 'single-correct') === 'single-correct' ? 'Single Correct' : 'Multiple Correct'})
      </h4>

      <div className="space-y-2">
        {options.map((option, index) => (
          <div
            key={index}
            className={`p-3 rounded-md border-2 transition-colors ${
              showAnswer
                ? option.isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : incorrectOptionClasses
                : `${incorrectOptionClasses} hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer`
            }`}
            onClick={() => !showAnswer && setShowAnswer(true)}
          >
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-600 flex items-center justify-center text-sm font-medium">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1 text-sm">{option.text}</span>
              {showAnswer && option.isCorrect && (
                <span className="text-green-600 dark:text-green-400 font-medium">✓</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!showAnswer ? (
        <button
          type="button"
          onClick={() => setShowAnswer(true)}
          className="w-full py-2 px-4 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors text-sm"
        >
          Show Answer
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowAnswer(false)}
          className="w-full py-2 px-4 bg-stone-600 text-white rounded-md hover:bg-stone-700 transition-colors text-sm"
        >
          Hide Answer
        </button>
      )}

      {showAnswer && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-stone-900 dark:text-white">Correct Answer(s)</h4>
          <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-300 dark:border-green-600 p-3 rounded-md">
            <div className="space-y-1">
              {correctOptions.map((option, index) => (
                <div key={index} className="text-green-800 dark:text-green-200 font-medium text-sm">
                  {String.fromCharCode(65 + options.indexOf(option))}. {option.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
