import React, { useCallback } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/themes/prism-dark.css";

const highlightPython = (code) =>
  Prism.highlight(code, Prism.languages.python, "python");

export default function CodeEditor({ value, onChange, readOnly = false }) {
  const handleKeyDown = useCallback(
    (ev) => {
      if (!readOnly && ev.key === "Tab") {
        ev.preventDefault();
        const textarea = ev.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + "    " + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      }
    },
    [onChange, readOnly, value]
  );

  return (
    <Editor
      value={value}
      onValueChange={onChange}
      highlight={highlightPython}
      padding={16}
      onKeyDown={handleKeyDown}
      textareaClassName="font-mono text-sm text-gray-100 bg-transparent outline-none"
      preClassName="language-python"
      style={{
        backgroundColor: "#282c34",
        border: "1px solid #4a5568",
        borderRadius: 8,
        minHeight: 200,
        fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
        color: "#abb2bf",
        fontSize: "14px",
        lineHeight: "1.5",
      }}
      readOnly={readOnly}
    />
  );
} 