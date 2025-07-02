import React, { useCallback } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-python"
import "prismjs/components/prism-c";
// import "prismjs/components/prism-clike";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-dark.css";

const languageMap = {
  python: "python",
  cpp: "cpp",
  java: "java",
  javascript: "javascript",
};

const highlightCode = (code, language) => {
  const lang = languageMap[language] || "python";
  return Prism.highlight(code, Prism.languages[lang], lang);
};

export default function CodeEditor({ value, onChange, readOnly = false, language = "python" }) {
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
      //shift+tab to unindent
      if (!readOnly && ev.key === "Tab" && ev.shiftKey) {
        ev.preventDefault();
        const textarea = ev.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + "    " + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 4;
        }, 0);
      }
    },
    [onChange, readOnly, value]
  );

  return (
    <Editor
      value={value}
      onValueChange={onChange}
      highlight={code => highlightCode(code, language)}
      padding={16}
      onKeyDown={handleKeyDown}
      textareaClassName="font-mono text-sm text-gray-100 bg-transparent outline-none"
      preClassName={`language-${language}`}
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