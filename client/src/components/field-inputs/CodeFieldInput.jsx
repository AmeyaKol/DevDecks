import React from 'react';
import CodeEditor from '../common/CodeEditor';

export default function CodeFieldInput({ field, value, onChange }) {
  return <CodeEditor value={value || ''} onChange={onChange} language={field.language || 'python'} />;
}
