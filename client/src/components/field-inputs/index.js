import React from 'react';
import TextFieldInput from './TextFieldInput';
import LinkFieldInput from './LinkFieldInput';
import MarkdownFieldInput from './MarkdownFieldInput';
import CodeFieldInput from './CodeFieldInput';
import McqFieldInput from './McqFieldInput';

const FIELD_INPUT_COMPONENTS = {
  text: TextFieldInput,
  link: LinkFieldInput,
  markdown: MarkdownFieldInput,
  code: CodeFieldInput,
  mcq: McqFieldInput,
};

function UnknownFieldInput({ field }) {
  return (
    <div className="p-3 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-300">
      Unknown field type "{field.type}" for field "{field.displayName}".
    </div>
  );
}

// field: { name, displayName, type, role, required, placeholder, language, mcqType, style }
// value/onChange: the raw fieldData value for this field
export default function FieldInput({ field, value, onChange }) {
  const Component = FIELD_INPUT_COMPONENTS[field.type] || UnknownFieldInput;
  return <Component field={field} value={value} onChange={onChange} />;
}
