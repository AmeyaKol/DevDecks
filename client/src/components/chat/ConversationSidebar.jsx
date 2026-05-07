import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onResetConversation,
  onDeleteConversation,
}) {
  return (
    <aside className="w-72 shrink-0 bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 p-3 h-[720px] overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Conversations
        </h2>
      </div>

      <div className="space-y-2 mb-3">
        <button
          onClick={onNewConversation}
          className="w-full px-3 py-2 bg-brand-600 text-white text-sm rounded-md hover:bg-brand-500 transition-colors active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <PlusIcon className="h-4 w-4" />
          New conversation
        </button>

        <button
          onClick={onResetConversation}
          className="w-full px-3 py-2 bg-stone-100 dark:bg-stone-950 text-stone-700 dark:text-stone-300 text-sm rounded-md border border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Reset current chat
        </button>
      </div>

      <div className="space-y-1 overflow-y-auto h-[600px] pr-1">
        {conversations.length === 0 && (
          <p className="text-xs text-stone-500 dark:text-stone-400 text-center mt-6">
            No saved conversations yet.
          </p>
        )}

        {conversations.map((conversation) => {
          const active = conversation._id === activeConversationId;

          return (
            <div
              key={conversation._id}
              className={`w-full rounded-md border px-3 py-2 transition-colors ${
                active
                  ? 'border-brand-500 bg-stone-200 dark:bg-stone-800'
                  : 'border-stone-300 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 hover:border-stone-400 dark:hover:border-stone-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">

                {/* left: conversation selection */}
                <button
                  type="button"
                  onClick={() => onSelectConversation(conversation._id)}
                  className="flex items-start gap-2 flex-1 min-w-0 text-left"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mt-0.5 text-stone-500 dark:text-stone-400" />

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                    {conversation.title || 'New conversation'}
                    </p>

                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {conversation.messageCount} messages
                    </p>
                  </div>
                </button>

                {/* right: delete */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation._id);
                  }}
                  className="p-1 rounded text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Delete conversation"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>

            </div>
            </div>
        );
        })}
      </div>
    </aside>
  );
}