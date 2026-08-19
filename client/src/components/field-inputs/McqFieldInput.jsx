import React from 'react';

const inputClasses =
  "flex-1 rounded-md border-stone-300 dark:border-stone-600 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 bg-white dark:bg-stone-700 text-stone-900 dark:text-white";

// value shape: { mcqType: 'single-correct' | 'multiple-correct', options: [{ text, isCorrect }] }
export default function McqFieldInput({ field, value, onChange }) {
  const mcqType = value?.mcqType || field.mcqType || 'single-correct';
  const options = value?.options?.length ? value.options : [{ text: '', isCorrect: false }];

  const setOptions = (nextOptions) => onChange({ mcqType, options: nextOptions });
  const setMcqType = (nextType) => {
    // Single-correct can only keep the first correct option, if any.
    const nextOptions = nextType === 'single-correct'
      ? options.map((opt, i) => ({ ...opt, isCorrect: opt.isCorrect && i === options.findIndex((o) => o.isCorrect) }))
      : options;
    onChange({ mcqType: nextType, options: nextOptions });
  };

  const addOption = () => setOptions([...options, { text: '', isCorrect: false }]);
  const removeOption = (index) => {
    if (options.length > 1) setOptions(options.filter((_, i) => i !== index));
  };
  const updateOption = (index, key, val) => {
    const next = options.map((opt, i) => {
      if (i !== index) return opt;
      return { ...opt, [key]: val };
    });
    if (key === 'isCorrect' && val && mcqType === 'single-correct') {
      next.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }
    setOptions(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            name={`mcqType-${field.name}`}
            checked={mcqType === 'single-correct'}
            onChange={() => setMcqType('single-correct')}
            className="text-brand-600 focus:ring-brand-500"
          />
          <span className="ml-2 text-sm text-stone-700 dark:text-stone-300">Single Correct</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name={`mcqType-${field.name}`}
            checked={mcqType === 'multiple-correct'}
            onChange={() => setMcqType('multiple-correct')}
            className="text-brand-600 focus:ring-brand-500"
          />
          <span className="ml-2 text-sm text-stone-700 dark:text-stone-300">Multiple Correct</span>
        </label>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-3 p-3 border border-stone-300 dark:border-stone-600 rounded-md bg-stone-50 dark:bg-stone-900/50 transition-colors">
            <input
              type={mcqType === 'single-correct' ? 'radio' : 'checkbox'}
              name={mcqType === 'single-correct' ? `mcq-correct-${field.name}` : undefined}
              checked={!!option.isCorrect}
              onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
              className="text-brand-600 focus:ring-brand-500"
            />
            <input
              type="text"
              value={option.text}
              onChange={(e) => updateOption(index, 'text', e.target.value)}
              placeholder={`Option ${index + 1}`}
              className={inputClasses}
            />
            {options.length > 1 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
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
          onClick={addOption}
          className="w-full py-2 px-4 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-md text-stone-600 dark:text-stone-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          + Add Option
        </button>
      </div>
    </div>
  );
}
