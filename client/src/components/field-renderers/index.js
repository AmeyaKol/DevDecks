import React from 'react';
import TextFieldRenderer from './TextFieldRenderer';
import LinkFieldRenderer from './LinkFieldRenderer';
import MarkdownFieldRenderer from './MarkdownFieldRenderer';
import CodeFieldRenderer from './CodeFieldRenderer';
import McqFieldRenderer from './McqFieldRenderer';

const FIELD_RENDERER_COMPONENTS = {
  text: TextFieldRenderer,
  link: LinkFieldRenderer,
  markdown: MarkdownFieldRenderer,
  code: CodeFieldRenderer,
  mcq: McqFieldRenderer,
};

function UnknownFieldRenderer({ field }) {
  return (
    <div className="p-2 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-300">
      Unknown field type "{field.type}"
    </div>
  );
}

const STYLE_WRAPPER_CLASSES = {
  plain: '',
  callout: 'p-3 rounded-md border-l-4 border-brand-400 dark:border-brand-600 bg-brand-50 dark:bg-brand-900/20',
  accent: 'p-3 rounded-md bg-stone-100 dark:bg-stone-800',
};

// field: { name, displayName, type, role, language, style }
// value: the raw fieldData value for this field
export default function FieldRenderer({ field, value }) {
  const Component = FIELD_RENDERER_COMPONENTS[field.type] || UnknownFieldRenderer;
  const wrapperClass = STYLE_WRAPPER_CLASSES[field.style] || '';
  return (
    <div className={wrapperClass}>
      <Component field={field} value={value} />
    </div>
  );
}
