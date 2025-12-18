import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const LiveMarkdownEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start typing...",
  className = "",
  minHeight = "200px",
  onKeyDown,
  showToolbar = true,
  onTimestampClick = null
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const savedScrollTopRef = useRef(null);
  const shouldLockScrollRef = useRef(false);

  // Auto-resize textarea
  const autoResizeTextarea = () => {
    if (!textareaRef.current) return;
    
    // Store cursor position
    const cursorPosition = textareaRef.current.selectionStart;
    
    // If scroll is locked (textarea is focused/active), save scroll once and restore it
    if (shouldLockScrollRef.current) {
      // Save scroll position on first resize after focus if not already saved
      if (savedScrollTopRef.current === null) {
        savedScrollTopRef.current = window.pageYOffset || document.documentElement.scrollTop;
      }
      
      // Reset height to get natural height
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      
      // Restore the saved scroll position
      window.scrollTo(0, savedScrollTopRef.current);
    } else {
      // Not locked, just resize normally without preserving scroll
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
    
    // Restore cursor position if focused
    if (isFocused && document.activeElement === textareaRef.current) {
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  };

  // Debounced resize to prevent excessive resizing during rapid typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      autoResizeTextarea();
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [value]);

  // When switching to edit mode, focus the textarea
  useEffect(() => {
    if (!showPreview && textareaRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [showPreview]);

  // Handle markdown shortcuts
  const handleMarkdownShortcuts = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      const before = value.substring(0, start);
      const after = value.substring(end);
      onChange(before + '**' + selected + '**' + after);
      setTimeout(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = end + 2;
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      const before = value.substring(0, start);
      const after = value.substring(end);
      onChange(before + '*' + selected + '*' + after);
      setTimeout(() => {
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = end + 1;
      }, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      onChange(value.substring(0, start) + '\t' + value.substring(end));
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    } else if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Handle toolbar actions
  const insertMarkdown = (before, after = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);
    
    const newText = beforeText + before + (selected || placeholder) + after + afterText;
    onChange(newText);
    
    setTimeout(() => {
      const newCursorPos = start + before.length + (selected ? selected.length : placeholder.length);
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      textarea.focus();
    }, 0);
  };

  // Component to render text with clickable timestamps
  const TextWithTimestamps = ({ text }) => {
    if (!text || !onTimestampClick) return text;
    
    const timestampRegex = /(\[(?:\d{1,2}:\d{2}(?::\d{2})?)\])/g;
    const parts = text.split(timestampRegex);
    
    return (
      <>
        {parts.map((part, i) => {
          const timestampMatch = part.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]$/);
          if (timestampMatch) {
            const timestamp = timestampMatch[1];
            return (
              <button
                key={i}
                onClick={() => onTimestampClick(timestamp)}
                className="text-blue-600 hover:text-blue-800 underline mx-1 cursor-pointer bg-blue-50 dark:bg-blue-900/30 px-1 rounded inline-block"
              >
                [{timestamp}]
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  // Helper to process children for timestamps
  const processChildrenForTimestamps = (children) => {
    if (!onTimestampClick) return children;
    
    if (typeof children === 'string') {
      return <TextWithTimestamps text={children} />;
    }
    if (Array.isArray(children)) {
      return children.map((child, i) =>
        typeof child === 'string' ? <TextWithTimestamps key={i} text={child} /> : child
      );
    }
    return children;
  };

  // Custom markdown components for better styling
  const markdownComponents = {
    a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline" />,
    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">{children}</h3>,
    p: ({ children }) => <p className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">{processChildrenForTimestamps(children)}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-3 text-gray-700 dark:text-gray-300 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 text-gray-700 dark:text-gray-300 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{processChildrenForTimestamps(children)}</li>,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 mb-3 italic text-gray-600 dark:text-gray-400">{children}</blockquote>,
    code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200">{children}</code>,
    pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mb-3 overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200">{children}</pre>,
    strong: ({ children }) => <strong className="font-semibold text-gray-800 dark:text-gray-200">{children}</strong>,
    em: ({ children }) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
  };

  // Preprocess markdown to handle single newlines as line breaks
  const preprocessMarkdown = (text) => {
    if (!text) return text;
    
    // Split text into lines and process each line
    const lines = text.split('\n');
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      
      // If current line is empty and next line is also empty, it's a paragraph break
      if (line.trim() === '' && nextLine && nextLine.trim() === '') {
        processedLines.push('');
        processedLines.push('');
        i++; // Skip the next empty line since we've already added it
      } else if (line.trim() === '') {
        // Single empty line - keep as is for paragraph break
        processedLines.push('');
      } else {
        // Non-empty line - add double spaces at the end for line break
        processedLines.push(line + '  ');
      }
    }
    
    return processedLines.join('\n');
  };

  return (
    <div 
      ref={containerRef}
      className={`relative border rounded-lg overflow-hidden transition-all duration-200 ${
        isFocused 
          ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50' 
          : 'border-gray-300 dark:border-gray-600'
      } ${className}`}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => insertMarkdown('# ', '', 'Heading 1')}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Heading 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('## ', '', 'Heading 2')}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**', 'bold text')}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Bold (Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('*', '*', 'italic text')}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Italic (Ctrl+I)"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('`', '`', 'code')}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Inline Code"
            >
              &lt;/&gt;
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('- ', '', 'list item')}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Bullet List"
            >
              •
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('> ', '', 'quote')}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Quote"
            >
              "
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('[', '](url)', 'link text')}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Link"
            >
              🔗
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              const newPreviewState = !showPreview;
              setShowPreview(newPreviewState);
              
              // When switching FROM preview TO edit, lock scroll
              if (!newPreviewState) {
                shouldLockScrollRef.current = true;
                savedScrollTopRef.current = null; // Will be set on first resize
              } else {
                // When switching FROM edit TO preview, unlock scroll
                shouldLockScrollRef.current = false;
                savedScrollTopRef.current = null;
              }
            }}
            className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title={showPreview ? "Show Editor" : "Show Preview"}
          >
            {showPreview ? "✏️ Edit" : "👁️ Preview"}
          </button>
        </div>
      )}

      {/* Editor Container */}
      <div className="relative">
        {showPreview ? (
          /* Preview Mode */
          <div 
            className="p-4 min-h-full bg-gray-50 dark:bg-gray-900"
            style={{ minHeight }}
          >
            {value ? (
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {preprocessMarkdown(value)}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-gray-400 dark:text-gray-500 italic">
                {placeholder}
              </div>
            )}
          </div>
        ) : (
          /* Edit Mode */
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            onFocus={() => {
              setIsFocused(true);
              shouldLockScrollRef.current = true;
              savedScrollTopRef.current = null; // Reset saved position on focus
            }}
            onBlur={() => {
              setIsFocused(false);
              shouldLockScrollRef.current = false;
              savedScrollTopRef.current = null; // Clear saved position on blur
            }}
            onKeyDown={handleMarkdownShortcuts}
            placeholder={placeholder}
            className="w-full p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none outline-none text-sm leading-relaxed border-0"
            style={{ minHeight }}
          />
        )}
      </div>
    </div>
  );
};

export default LiveMarkdownEditor;
