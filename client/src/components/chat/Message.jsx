export default function Message({ message, index }) {
  const isUser = message.role === 'user';
  const isFirst = index === 1;
  const handleCitationClick = (citation) => {
    if (!citation.question) return;

    const params = new URLSearchParams({
        tab: 'content',
        view: 'cards',
        search: citation.question.slice(0,10),
    });

    window.open(`/home?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };
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
            {/* Confidence: {(message.confidence * 100).toFixed(0)}% */}
            Confidence: {message.confidence}
          </div>
        )}

        {/* Citations */}
        {isFirst && message.citations?.length > 0 && (
          <div className="mt-2 rounded-md border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 p-3">
            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 mb-2">
              Retrieved Citations
            </p>

            <div className="space-y-2">
              {message.citations.map((c) => (
                // <div
                //   key={c.citationId}
                //   className="rounded border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 p-2"
                // >
                //   <p className="font-mono text-xs text-amber-600 dark:text-amber-500">
                //     {c.flashcardId ? `Card ${c.flashcardId}` : 'Unknown Source'}
                //   </p>
                // </div>
                <button
                  key={c.citationId}
                  type="button"
                  onClick={() => handleCitationClick(c)}
                  className="w-full text-left rounded border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 p-2 hover:border-brand-500 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors active:scale-[0.99]"
                >
                  <p className="font-mono text-xs text-amber-600 dark:text-amber-500">
                    {c.citationId ? `Card ${c.citationId}` : 'Unknown Source'}
                  </p>

                  {c.question && (
                    <p className="mt-1 text-xs text-stone-700 dark:text-stone-300 line-clamp-2">
                    {c.question}
                    </p>
                  )}

                  <p className="mt-1 text-[11px] text-brand-600 dark:text-brand-400">
                    Open matching card →
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}