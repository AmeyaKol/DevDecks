import React from 'react';

export default function TextFieldRenderer({ value }) {
  if (!value) return null;
  return <p className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap">{value}</p>;
}
