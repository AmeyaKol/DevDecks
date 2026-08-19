import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

// value shape: { mcqType, options: [{ text, isCorrect }] }
export default function McqFieldRenderer({ value }) {
  const options = value?.options || [];
  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div
          key={index}
          className={`flex items-center gap-2 p-2 rounded-md border text-sm ${
            option.isCorrect
              ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
              : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
          }`}
        >
          {option.isCorrect && <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />}
          <span>{option.text}</span>
        </div>
      ))}
    </div>
  );
}
