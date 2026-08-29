import React from 'react';

const inputClasses =
  "mt-1 block w-full rounded-md border-stone-300 dark:border-stone-600 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 p-3 text-base bg-white dark:bg-stone-700 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 transition-colors";

export default function TextFieldInput({ field, value, onChange }) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || ''}
      rows={3}
      required={field.required}
      className={inputClasses}
    />
  );
}
