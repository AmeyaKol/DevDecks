/**
 * Editor Toolbar for TipTap Editor
 * 
 * Provides formatting controls:
 * - Text formatting (bold, italic, highlight)
 * - Headings (H1, H2, H3)
 * - Lists (bullet, numbered)
 * - Code blocks
 * - Links
 * - Timestamps
 */

import React, { useState, useCallback } from 'react';

// Toolbar button component
const ToolbarButton = ({ onClick, isActive, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      p-1.5 rounded text-sm font-medium transition-colors
      ${isActive 
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    {children}
  </button>
);

// Divider component
const Divider = () => (
  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
);

const EditorToolbar = ({ editor, onInsertTimestamp }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showTimestampInput, setShowTimestampInput] = useState(false);
  const [timestampValue, setTimestampValue] = useState('');

  // Set link
  const setLink = useCallback(() => {
    if (linkUrl) {
      // Add https:// if no protocol specified
      const url = linkUrl.match(/^https?:\/\//) ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  // Insert timestamp
  const insertTimestamp = useCallback(() => {
    if (timestampValue && onInsertTimestamp) {
      onInsertTimestamp(timestampValue);
    }
    setShowTimestampInput(false);
    setTimestampValue('');
  }, [timestampValue, onInsertTimestamp]);

  // Insert current video time (placeholder - will be connected to video player)
  const insertCurrentTime = useCallback(() => {
    // This will be connected to the video player's current time
    const now = new Date();
    const fakeTimestamp = `${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`;
    if (onInsertTimestamp) {
      onInsertTimestamp(fakeTimestamp);
    }
  }, [onInsertTimestamp]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-lg">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      >
        <span className="bg-yellow-200 dark:bg-yellow-700 px-1 rounded">H</span>
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <s>S</s>
      </ToolbarButton>
      
      <Divider />
      
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>
      
      <Divider />
      
      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        •
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        1.
      </ToolbarButton>
      
      <Divider />
      
      {/* Block elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        "
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        {'</>'}
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        {'{ }'}
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        —
      </ToolbarButton>
      
      <Divider />
      
      {/* Link */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          isActive={editor.isActive('link')}
          title="Insert Link (Ctrl+K)"
        >
          🔗
        </ToolbarButton>
        
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 flex gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              onKeyDown={(e) => e.key === 'Enter' && setLink()}
              autoFocus
            />
            <button
              onClick={setLink}
              className="px-2 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Add
            </button>
            <button
              onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
              className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      
      <Divider />
      
      {/* Timestamp */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowTimestampInput(!showTimestampInput)}
          title="Insert Timestamp"
        >
          ⏱️
        </ToolbarButton>
        
        {showTimestampInput && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 flex gap-2">
            <input
              type="text"
              value={timestampValue}
              onChange={(e) => setTimestampValue(e.target.value)}
              placeholder="MM:SS"
              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-center"
              onKeyDown={(e) => e.key === 'Enter' && insertTimestamp()}
              autoFocus
            />
            <button
              onClick={insertTimestamp}
              className="px-2 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Add
            </button>
            <button
              onClick={() => { setShowTimestampInput(false); setTimestampValue(''); }}
              className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      
      <Divider />
      
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        ↩
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        ↪
      </ToolbarButton>
    </div>
  );
};

export default EditorToolbar;




