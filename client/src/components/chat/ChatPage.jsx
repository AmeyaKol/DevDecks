import { useEffect, useMemo, useRef, useState } from 'react';
import { SparklesIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useParams, useSearchParams } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import ChatWindow from './ChatWindow';
import InputBox from './InputBox';
import Navbar from '../Navbar';
import { useAuth } from "../../context/AuthContext";
import ConversationSidebar from './ConversationSidebar';
import useFlashcardStore from '../../store/flashcardStore';


export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { deckId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { decks, fetchDecks } = useFlashcardStore();
  const autoAskedRef = useRef(false);

  const {
    conversationId,
    conversations,
    messages,
    input,
    setInput,
    loading,
    error,
    sendMessage,
    loadConversation,
    startNewConversation,
    resetCurrentConversation,
    removeConversation,
  } = useChat({ deckId });
  const { isAuthenticated } = useAuth();
  const selectedDeck = useMemo(
    () => (deckId ? decks.find((deck) => deck._id === deckId) : null),
    [deckId, decks]
  );

  useEffect(() => {
    if (deckId && decks.length === 0) {
      fetchDecks();
    }
  }, [deckId, decks.length, fetchDecks]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !autoAskedRef.current && !loading) {
      autoAskedRef.current = true;
      searchParams.delete('q');
      setSearchParams(searchParams, { replace: true });
      sendMessage(q);
    }
  }, [searchParams, setSearchParams, sendMessage, loading]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50 dark:bg-stone-950">
        <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-md p-6 text-center max-w-md">
          
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
            Login Required
          </h2>

          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
            You must be logged in to use the RAG learning coach.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
      <div className="flex-1">
        <div className="w-full mx-auto px-4">
          <Navbar />

          <div className="mb-6 flex justify-center border-b border-stone-300 dark:border-stone-800">
            <div className="px-3 py-2 text-sm font-medium flex items-center border-b-2 border-brand-500 text-stone-900 dark:text-stone-100">
              <SparklesIcon className="h-4 w-4 mr-1.5" />
              RAG Learning Coach
            </div>
          </div>

          <div className="w-full max-w-full mx-auto lg:w-[90%] lg:max-w-[1920px] flex gap-3 lg:gap-4">
            {sidebarOpen && (
              <ConversationSidebar
                conversations={conversations}
                activeConversationId={conversationId}
                onSelectConversation={loadConversation}
                onNewConversation={startNewConversation}
                onResetConversation={resetCurrentConversation}
                onDeleteConversation={removeConversation}
                onClose={() => setSidebarOpen(false)}
              />
            )}

            <main className="flex-1 min-w-0 flex flex-col">
              <div className="bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 p-4 mb-4 transition-colors duration-300">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen((open) => !open)}
                    className="shrink-0 p-2 rounded-md border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors active:scale-[0.98]"
                    aria-expanded={sidebarOpen}
                    aria-controls={sidebarOpen ? 'chat-conversations-sidebar' : undefined}
                    title={sidebarOpen ? 'Hide conversations' : 'Show conversations'}
                  >
                    <Bars3Icon className="h-5 w-5" aria-hidden />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {deckId ? `Learn using ${selectedDeck?.name || 'selected deck'}` : 'Ask your tutor'}
                    </h1>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                      {deckId
                        ? 'This chat is scoped to the selected deck only.'
                        : 'Ask questions grounded in your decks and flashcards.'}
                    </p>
                  </div>
                </div>
              </div>

              <ChatWindow messages={messages} loading={loading} />

              {error && (
                <div className="mt-3 rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <InputBox
                input={input}
                setInput={setInput}
                onSend={sendMessage}
                loading={loading}
              />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}