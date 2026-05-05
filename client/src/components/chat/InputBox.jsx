import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function InputBox({ input, setInput, onSend, loading }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="mt-4 bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 p-3 transition-colors duration-300">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your decks..."
          className="flex-1 resize-none rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          rows={2}
          disabled={loading}
        />

        <button
          onClick={onSend}
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-brand-600 text-white text-sm rounded-md hover:bg-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors active:scale-[0.98] disabled:bg-stone-300 dark:disabled:bg-stone-700 disabled:text-stone-500 dark:disabled:text-stone-400 flex items-center gap-1.5"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
          <span>Send</span>
        </button>
      </div>

      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
        Press Enter to send, Shift + Enter for a new line.
      </p>
    </div>
  );
}