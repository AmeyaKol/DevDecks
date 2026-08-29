import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeFieldRenderer({ field, value }) {
  if (!value) return null;
  return (
    <div className="overflow-x-auto text-sm">
      <SyntaxHighlighter
        language={field.language || 'python'}
        style={atomDark}
        showLineNumbers
        wrapLines
        customStyle={{ margin: 0, borderRadius: '0.375rem', fontSize: '0.75rem' }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
