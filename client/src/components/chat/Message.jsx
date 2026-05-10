import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import ChatContextDeck from './ChatContextDeck';

const markdownComponents = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 underline" />,
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
  li: ({ children }) => <li className="mb-0.5">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ inline, children }) =>
    inline
      ? <code className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-xs font-mono">{children}</code>
      : <pre className="my-2 p-3 rounded bg-stone-200 dark:bg-stone-800 overflow-x-auto text-xs font-mono"><code>{children}</code></pre>,
};

export default function Message({ message, showCitationDeck = false }) {
  const isUser = message.role === 'user';
  const location = useLocation();
  const greDeckBase = location.pathname.startsWith('/gre') ? '/gre' : '';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] ${isUser ? 'text-right' : 'text-left'}`}>

        {/*main message*/}
        <div
          className={`rounded-md px-4 py-3 text-sm border ${
            isUser
              ? 'bg-brand-600 text-white border-brand-500'
              : 'bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 border-stone-300 dark:border-stone-800'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkBreaks]} components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/*Evidence Warning*/}
        {!isUser && message.insufficientEvidence && (
          <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-md">
            Insufficient evidence to answer the question based on your decks. Try asking something else or review your flashcards!
          </div>
        )}

        {/* Confidence */}
        {!isUser && message.confidence !== undefined && (
          <div className="mt-2 text-xs text-stone-600 dark:text-stone-400">
            Confidence: {message.confidence}
          </div>
        )}

        {showCitationDeck && (
          <ChatContextDeck citations={message.citations} greDeckBase={greDeckBase} />
        )}

      </div>
    </div>
  );
}
