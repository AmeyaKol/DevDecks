import React, { useCallback } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/themes/prism.css";

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
      padding={10}
      onKeyDown={handleKeyDown}
      textareaClassName="font-mono text-sm"
      preClassName="language-python"
      style={{
        backgroundColor: "#f8f8f8",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        minHeight: 200,
        fontFamily: "Consolas, 'Courier New', monospace",
      }}
      readOnly={readOnly}
    />
  );
} 