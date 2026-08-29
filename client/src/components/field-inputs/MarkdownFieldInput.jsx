import React from 'react';
import LiveMarkdownEditor from '../common/LiveMarkdownEditor';

export default function MarkdownFieldInput({ field, value, onChange }) {
  return (
    <LiveMarkdownEditor
      value={value || ''}
      onChange={onChange}
      placeholder={field.placeholder || 'Start writing in Markdown...'}
      minHeight="150px"
    />
  );
}
