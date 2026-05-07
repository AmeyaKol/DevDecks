import { useLocation } from 'react-router-dom';
import ChatContextDeck from './ChatContextDeck';

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
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
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
