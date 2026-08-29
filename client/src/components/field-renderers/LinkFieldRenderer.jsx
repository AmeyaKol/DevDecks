import React from 'react';

export default function LinkFieldRenderer({ value }) {
  if (!value) return null;
  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-600 hover:text-brand-800 dark:text-brand-400 underline break-all"
    >
      {value}
    </a>
  );
}
