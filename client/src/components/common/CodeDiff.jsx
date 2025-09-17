import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeDiff = ({ userCode, referenceCode, language = 'python' }) => {

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Code Comparison
        </h3>
      </div>

      {/* Side-by-side Code */}
      <div className="flex">
        {/* User Code */}
        <div className="flex-1 border-r border-gray-200 dark:border-gray-600">
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 border-b border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Implementation
            </h4>
          </div>
          <div className="relative">
            <SyntaxHighlighter
              language={language}
              style={atomDark}
              customStyle={{
                margin: 0,
                padding: '12px',
                background: 'transparent',
                fontSize: '14px'
              }}
              showLineNumbers={false}
              wrapLines={true}
              wrapLongLines={true}
            >
              {userCode || '// No code provided'}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Reference Code */}
        <div className="flex-1">
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 border-b border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reference Solution
            </h4>
          </div>
          <div className="relative">
            <SyntaxHighlighter
              language={language}
              style={atomDark}
              customStyle={{
                margin: 0,
                padding: '12px',
                background: 'transparent',
                fontSize: '14px'
              }}
              showLineNumbers={false}
              wrapLines={true}
              wrapLongLines={true}
            >
              {referenceCode || '// No reference code available'}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeDiff;
