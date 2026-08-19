import React from 'react';
import ReactMarkdown from 'react-markdown';

const markdownComponents = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 underline" />,
};

export default function MarkdownFieldRenderer({ value }) {
  if (!value) return null;
  return (
    <div className="prose dark:prose-invert max-w-none text-sm">
      <ReactMarkdown components={markdownComponents}>{value}</ReactMarkdown>
    </div>
  );
}
