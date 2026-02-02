/**
 * TipTap Rich Text Editor
 * 
 * A Notion-like editor with:
 * - Live preview (WYSIWYG)
 * - Slash commands (/)
 * - Keyboard shortcuts
 * - Code blocks with syntax highlighting
 * - Timestamp insertion
 * - Auto-save support
 */

import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import EditorToolbar from './EditorToolbar';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// Custom CSS for the editor
const editorStyles = `
  .tiptap-editor {
    min-height: 200px;
    outline: none;
  }
  
  .tiptap-editor p {
    margin: 0.5em 0;
  }
  
  .tiptap-editor h1 {
    font-size: 1.875rem;
    font-weight: 700;
    margin: 1rem 0 0.5rem;
    line-height: 1.2;
  }
  
  .tiptap-editor h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0.875rem 0 0.5rem;
    line-height: 1.3;
  }
  
  .tiptap-editor h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.75rem 0 0.5rem;
    line-height: 1.4;
  }
  
  .tiptap-editor ul,
  .tiptap-editor ol {
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  
  .tiptap-editor li {
    margin: 0.25rem 0;
  }
  
  .tiptap-editor blockquote {
    border-left: 3px solid #6366f1;
    padding-left: 1rem;
    margin: 0.5rem 0;
    color: #6b7280;
    font-style: italic;
  }
  
  .tiptap-editor code {
    background-color: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.875em;
  }
  
  .dark .tiptap-editor code {
    background-color: #374151;
  }
  
  .tiptap-editor pre {
    background-color: #1f2937;
    color: #e5e7eb;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 0.75rem 0;
  }
  
  .tiptap-editor pre code {
    background: none;
    padding: 0;
    color: inherit;
  }
  
  .tiptap-editor a {
    color: #4f46e5;
    text-decoration: underline;
    cursor: pointer;
  }
  
  .tiptap-editor mark {
    background-color: #fef08a;
    padding: 0.125rem 0;
  }
  
  .dark .tiptap-editor mark {
    background-color: #854d0e;
  }
  
  .tiptap-editor hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 1rem 0;
  }
  
  .dark .tiptap-editor hr {
    border-top-color: #374151;
  }
  
  /* Timestamp styling */
  .tiptap-editor .timestamp {
    background-color: #dbeafe;
    color: #1d4ed8;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: monospace;
    cursor: pointer;
  }
  
  .dark .tiptap-editor .timestamp {
    background-color: #1e3a5f;
    color: #93c5fd;
  }
  
  /* Placeholder */
  .tiptap-editor p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #9ca3af;
    pointer-events: none;
    height: 0;
  }
`;

const TipTapEditor = ({
  value = '',
  onChange,
  placeholder = 'Start writing your notes...',
  minHeight = '300px',
  showToolbar = true,
  onTimestampClick,
  autoFocus = false,
  readOnly = false,
  className = '',
}) => {
  // Initialize the editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Highlight.configure({
        multicolor: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
    ],
    content: value,
    editable: !readOnly,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      if (onChange) {
        // Get HTML content
        const html = editor.getHTML();
        // Also provide markdown-like text for storage
        const text = editor.getText();
        onChange(html, text);
      }
    },
  });

  // Update content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  // Insert timestamp at cursor
  const insertTimestamp = useCallback((timestamp) => {
    if (editor) {
      editor.chain().focus().insertContent(`[${timestamp}]`).run();
    }
  }, [editor]);

  // Handle timestamp clicks in the content
  const handleEditorClick = useCallback((e) => {
    const target = e.target;
    // Check if clicked element looks like a timestamp [MM:SS]
    const text = target.textContent;
    const timestampMatch = text?.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/);
    if (timestampMatch && onTimestampClick) {
      onTimestampClick(timestampMatch[1]);
    }
  }, [onTimestampClick]);

  if (!editor) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" style={{ minHeight }}>
        <div className="p-4">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`tiptap-wrapper ${className}`}>
      {/* Inject styles */}
      <style>{editorStyles}</style>
      
      {/* Toolbar */}
      {showToolbar && (
        <EditorToolbar 
          editor={editor} 
          onInsertTimestamp={insertTimestamp}
        />
      )}
      
      {/* Editor content */}
      <div 
        className={`
          border rounded-lg overflow-hidden
          ${showToolbar ? 'border-t-0 rounded-t-none' : ''}
          ${editor.isFocused ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''}
          bg-white dark:bg-gray-800
          transition-all duration-200
        `}
        style={{ minHeight }}
        onClick={handleEditorClick}
      >
        <EditorContent 
          editor={editor} 
          className="tiptap-editor p-4 text-gray-800 dark:text-gray-200"
        />
      </div>
    </div>
  );
};

export default TipTapEditor;




