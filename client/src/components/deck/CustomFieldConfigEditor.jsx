import React from 'react';
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import AnimatedDropdown from '../common/AnimatedDropdown';

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'link', label: 'Link' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'code', label: 'Code' },
  { value: 'mcq', label: 'Multiple Choice' },
];

const FIELD_ROLE_OPTIONS = [
  { value: 'prompt', label: 'Prompt (question side)' },
  { value: 'answer', label: 'Answer (reveal side)' },
  { value: 'hint', label: 'Hint (optional)' },
];

const FIELD_STYLE_OPTIONS = [
  { value: 'plain', label: 'Plain' },
  { value: 'callout', label: 'Callout' },
  { value: 'accent', label: 'Accent' },
];

const CODE_LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
];

export const MAX_CUSTOM_FIELDS = 6;

// Derives a schema-safe field `name` (identifier) from a human-typed displayName,
// disambiguated against sibling field names -- mirrors the server's
// /^[a-zA-Z][a-zA-Z0-9_]*$/ constraint on Deck.fieldConfig.fields[].name.
function deriveFieldName(displayName, existingNames, skipIndex) {
  let base = displayName
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/^[^a-zA-Z]+/, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!base) base = 'field';
  if (/^[0-9]/.test(base)) base = `f_${base}`;

  const taken = new Set(existingNames.filter((_, i) => i !== skipIndex));
  let candidate = base;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}

const inputClasses =
  "block w-full rounded-md border-stone-300 dark:border-stone-600 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 p-2 text-sm bg-white dark:bg-stone-700 text-stone-900 dark:text-white transition-colors";

// fields: array of { name, displayName, type, role, required, order, language, style }
// onChange: (nextFields) => void
export default function CustomFieldConfigEditor({ fields, onChange }) {
  const addField = () => {
    if (fields.length >= MAX_CUSTOM_FIELDS) return;
    const displayName = `Field ${fields.length + 1}`;
    onChange([
      ...fields,
      {
        name: deriveFieldName(displayName, fields.map((f) => f.name), -1),
        displayName,
        type: 'text',
        role: 'answer',
        required: false,
        order: fields.length,
        style: 'plain',
      },
    ]);
  };

  const updateField = (index, patch) => {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(next);
  };

  const renameField = (index, displayName) => {
    const name = deriveFieldName(displayName, fields.map((f) => f.name), index);
    updateField(index, { displayName, name });
  };

  const removeField = (index) => {
    const next = fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i }));
    onChange(next);
  };

  const moveField = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((f, i) => ({ ...f, order: i })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          Fields ({fields.length}/{MAX_CUSTOM_FIELDS})
        </label>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-stone-500 dark:text-stone-400 italic">
          No fields yet. Every card in this deck will follow the field structure you define here.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={index}
            className="p-3 border border-stone-300 dark:border-stone-600 rounded-md bg-stone-50 dark:bg-stone-900/50 space-y-2"
          >
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-0.5 pt-1">
                <button
                  type="button"
                  onClick={() => moveField(index, -1)}
                  disabled={index === 0}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveField(index, 1)}
                  disabled={index === fields.length - 1}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-stone-500 dark:text-stone-400 mb-0.5">Field name</label>
                  <input
                    type="text"
                    value={field.displayName}
                    onChange={(e) => renameField(index, e.target.value)}
                    className={inputClasses}
                    placeholder="e.g. Front"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 dark:text-stone-400 mb-0.5">Type</label>
                  <AnimatedDropdown
                    options={FIELD_TYPE_OPTIONS}
                    value={field.type}
                    onChange={(opt) => updateField(index, { type: opt.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 dark:text-stone-400 mb-0.5">Role</label>
                  <AnimatedDropdown
                    options={FIELD_ROLE_OPTIONS}
                    value={field.role}
                    onChange={(opt) => updateField(index, { role: opt.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 dark:text-stone-400 mb-0.5">Style</label>
                  <AnimatedDropdown
                    options={FIELD_STYLE_OPTIONS}
                    value={field.style || 'plain'}
                    onChange={(opt) => updateField(index, { style: opt.value })}
                  />
                </div>
                {field.type === 'code' && (
                  <div>
                    <label className="block text-xs text-stone-500 dark:text-stone-400 mb-0.5">Language</label>
                    <AnimatedDropdown
                      options={CODE_LANGUAGE_OPTIONS}
                      value={field.language || 'python'}
                      onChange={(opt) => updateField(index, { language: opt.value })}
                    />
                  </div>
                )}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 mt-4">
                    <input
                      type="checkbox"
                      checked={!!field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    Required
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeField(index)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 mt-1"
                title="Remove field"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addField}
        disabled={fields.length >= MAX_CUSTOM_FIELDS}
        className="w-full py-2 px-4 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-md text-stone-600 dark:text-stone-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
      >
        <PlusIcon className="h-4 w-4" /> Add Field
      </button>
    </div>
  );
}
