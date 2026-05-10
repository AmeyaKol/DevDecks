import Message from './Message';

export default function ChatWindow({ messages, loading }) {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 p-4 h-[min(72vh,780px)] min-h-[480px] max-h-[860px] lg:h-[min(76vh,820px)] lg:min-h-[520px] lg:max-h-[900px] overflow-y-auto transition-colors duration-300">
      {messages.length === 0 && (
        <div className="h-full flex items-center justify-center text-center">
          <div>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              Start a learning conversation
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 max-w-md">
              Ask about a concept, request a hint, or ask the coach to explain using your flashcards.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {messages.map((message, index) => (
          <Message
            key={index}
            message={message}
            showCitationDeck={
              message.role === 'assistant' && Boolean(message.citations?.length)
            }
          />
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-md border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-950 px-3 py-2 text-sm text-stone-500 dark:text-stone-400">
              Generating answer...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}