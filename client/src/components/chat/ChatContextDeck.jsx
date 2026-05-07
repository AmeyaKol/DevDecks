import ChatCitationCard from './ChatCitationCard';

export default function ChatContextDeck({ citations, greDeckBase = '' }) {
  if (!citations?.length) return null;

  return (
    <div className="mt-2 rounded-md border border-stone-300 dark:border-stone-800 bg-warm-50/80 dark:bg-stone-900/40 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
          Sources from your decks
        </span>
        <span className="text-[11px] text-stone-500 dark:text-stone-500 font-mono">
          ({citations.length} card{citations.length === 1 ? '' : 's'})
        </span>
      </div>
      <div className="space-y-2">
        {citations.map((c) => (
          <ChatCitationCard key={c.citationId} citation={c} greDeckBase={greDeckBase} />
        ))}
      </div>
    </div>
  );
}
