import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/solid';
import { CodeBracketIcon, ShareIcon } from '@heroicons/react/24/outline';
import { getBasePath } from '../../utils/greUtils';

/** Chars or lines above this start with code collapsed for less visual noise. */
const LONG_CODE_CHARS = 450;
const LONG_CODE_EXTRA_LINES = 14;

const markdownComponents = {
  // eslint-disable-next-line jsx-a11y/anchor-has-content -- mirror FlashcardItem markdown links
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

function typeBadgeClasses(type) {
  if (type === 'GRE-Word') {
    return 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 border-brand-300 dark:border-brand-800';
  }
  if (type === 'GRE-MCQ') {
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800';
  }
  return 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700';
}

export default function ChatCitationCard({ citation, greDeckBase = '' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastPointerType, setLastPointerType] = useState('mouse');
  const location = useLocation();
  const basePath = getBasePath(location.pathname);

  const {
    citationId,
    question,
    type,
    problemStatement,
    explanation,
    hint,
    deckId,
    metadata,
    topicNodes,
    code: citationCode,
    language: citationLanguage,
  } = citation;

  const codeText =
    typeof citationCode === 'string' && citationCode.trim() ? citationCode.trim() : '';

  const codeLineCount = useMemo(
    () => (codeText ? codeText.split(/\r\n|\r|\n/).length : 0),
    [codeText]
  );

  const isLongCode = Boolean(
    codeText &&
      (codeText.length > LONG_CODE_CHARS || codeLineCount > LONG_CODE_EXTRA_LINES)
  );

  const [codeVisible, setCodeVisible] = useState(() => !isLongCode);

  const hasBody = Boolean(
    (problemStatement && problemStatement.trim()) ||
      (explanation && explanation.trim()) ||
      (hint && hint.trim()) ||
      (metadata?.options && metadata.options.length) ||
      codeText
  );

  const handlePointerDown = (e) => {
    setLastPointerType(e.pointerType);
  };

  const handleExpandToggle = () => {
    if (!hasBody) return;
    setIsExpanded((prev) => !prev);
  };

  const deckHref =
    deckId != null
      ? `${greDeckBase || ''}/deckView?deck=${encodeURIComponent(String(deckId))}`
      : null;

  const typeLabel = type || 'Card';

  return (
    <div className="relative bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 hover:border-brand-400/60 dark:hover:border-stone-600 transition-colors shadow-sm">
      <div
        className={`relative z-10 p-3 ${hasBody ? 'cursor-pointer border-b border-stone-200 dark:border-stone-800' : ''}`}
        onClick={handleExpandToggle}
        onPointerDown={handlePointerDown}
        role={hasBody ? 'button' : undefined}
        tabIndex={hasBody ? 0 : undefined}
        onKeyDown={(e) => {
          if (!hasBody) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleExpandToggle();
          }
        }}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {citationId}
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono border ${typeBadgeClasses(typeLabel)}`}
              >
                {typeLabel}
              </span>
            </div>
            {question ? (
              <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                {question}
              </p>
            ) : (
              <p className="text-xs text-stone-500 dark:text-stone-400">No preview</p>
            )}
            {topicNodes?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {topicNodes.map((t) => (
                  <Link
                    key={t.topic}
                    to={`${basePath}/knowledge-graph?node=${encodeURIComponent(t.topic)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                  >
                    <ShareIcon className="h-2.5 w-2.5" />
                    {t.topic}
                  </Link>
                ))}
              </div>
            )}
            {hasBody && (
              <p className="mt-1.5 text-[11px] text-stone-500 dark:text-stone-500">
                {lastPointerType === 'touch'
                  ? `Tap to ${isExpanded ? 'collapse' : 'expand'}`
                  : `Click to ${isExpanded ? 'collapse' : 'expand'}`}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {hasBody && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1.5 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors border border-transparent hover:border-stone-300 dark:hover:border-stone-700 active:scale-[0.98]"
                title={isExpanded ? 'Collapse' : 'Expand'}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
            )}
            {deckHref && (
              <Link
                to={deckHref}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-500 font-medium"
              >
                <RectangleStackIcon className="h-3.5 w-3.5" />
                Deck
              </Link>
            )}
          </div>
        </div>
      </div>

      {isExpanded && hasBody && (
        <div className="px-3 py-3 space-y-3 text-xs bg-stone-50/80 dark:bg-stone-950/50 rounded-b-md">
          {hint?.trim() && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-500 p-2 rounded text-yellow-900 dark:text-yellow-100">
              <span className="font-medium">Hint: </span>
              {hint}
            </div>
          )}

          {typeLabel === 'GRE-MCQ' && metadata?.options?.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
                Options
              </h4>
              <ul className="space-y-1">
                {metadata.options.map((opt, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/80 px-2 py-1.5"
                  >
                    <span className="font-mono text-stone-500 shrink-0">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span className="text-stone-800 dark:text-stone-200">
                      {opt?.text ?? String(opt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {problemStatement?.trim() && (
            <div>
              <h4 className="text-[11px] font-semibold text-stone-900 dark:text-stone-100 mb-1">
                Problem
              </h4>
              <div className="prose dark:prose-invert prose-sm max-w-none bg-white dark:bg-stone-900 p-2 rounded border border-stone-200 dark:border-stone-800">
                <ReactMarkdown components={markdownComponents}>
                  {problemStatement}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {explanation?.trim() && (
            <div>
              <h4 className="text-[11px] font-semibold text-stone-900 dark:text-stone-100 mb-1">
                {typeLabel === 'GRE-Word' ? 'Definition' : 'Explanation'}
              </h4>
              <div className="prose dark:prose-invert prose-sm max-w-none bg-white dark:bg-stone-900 p-2 rounded border border-stone-200 dark:border-stone-800">
                <ReactMarkdown components={markdownComponents}>
                  {explanation}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {codeText && (
            <div className="rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900/80">
                <h4 className="text-[11px] font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <CodeBracketIcon className="h-3.5 w-3.5 text-stone-500 shrink-0" aria-hidden />
                  Code
                  <span className="font-mono font-normal text-stone-500 dark:text-stone-400">
                    ({citationLanguage || 'text'} · {codeLineCount} lines)
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setCodeVisible((v) => !v)}
                  className="shrink-0 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 px-2 py-0.5 rounded border border-transparent hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                >
                  {codeVisible ? 'Hide code' : 'Show code'}
                </button>
              </div>
              {codeVisible && (
                <div
                  className={`overflow-x-auto text-xs ${
                    isLongCode ? 'max-h-80 overflow-y-auto' : ''
                  }`}
                >
                  <SyntaxHighlighter
                    language={citationLanguage || 'python'}
                    style={atomDark}
                    showLineNumbers
                    wrapLines
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      fontSize: '0.7rem',
                    }}
                  >
                    {codeText}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
