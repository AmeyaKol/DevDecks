# Module D — RAG learning coach 


## Overview

A context aware tutor that retrieves from user/platform content, cites evidence, and answer questions based on them.

## Features

### Retrieval
Hybrid serach with semantic and lexical search.

### Generation
- Generate output based on the retrieved citations.
- Return "insufficient advice" if citations are not enough.
- Employ Gemini2.5 for tutor

### Chat UX
- Conversation-style layout
- Store conversation on Database and be able to access the conversation history on the side bar.
- Chat page is visible only for logged-in users to store the conversation for each user.
- Each retrieved citation is a clickable link to the flashcard.

## Architecture

### Data Flow
```
Server (conversationController.js)
  └─ createConversation(): creates empty conversation with title
  └─ listConversations(): returns sidebar history list
  └─ getConversation(): returns selected conversation + messages
  └─ updateConversationMessages(): saves latest messages/title
  └─ deleteConversation(): removes conversation from history
       ↓
Client API (conversationService.js / api.js)
  └─ fetchConversations()
  └─ fetchConversation(id)
  └─ createConversation(title)
  └─ saveConversationMessages(id, messages, title)
  └─ deleteConversation(id)
       ↓
Chat State (useChat.js)
  └─ conversationId, conversations, messages, input, loading, error
  └─ loadConversationList(): fills sidebar
  └─ loadConversation(id): restores selected chat
  └─ startNewConversation(): creates new empty thread
  └─ resetCurrentConversation(): clears current UI chat
  └─ removeConversation(id): deletes thread + clears UI if active
  └─ sendMessage(): user message → RAG API → assistant message → save
       ↓
RAG API (api.js)
  └─ askRagTutor({ question, messages, conversationId })
       ↓
Server (aiController.js)
  └─ ragTutor(): validates question
  └─ loads Conversation by conversationId
  └─ if initialContext exists → reuse saved context/citations
  └─ else hybridSearch() → buildCitations() → contextFromResults()
  └─ saves initialContext / initialCitations to Conversation
       ↓
Gemini Service (geminiService.js)
  └─ generateGroundedAnswer(question, context, citations, messages)
  └─ sends structured conversation history:
       user → model → user → model
  └─ returns answer, confidence, insufficientEvidence
       ↓
Server Response
  └─ { answer, citations, confidence, insufficientEvidence, retrieval }
       ↓
Chat UI (ChatPage.jsx)
  └─ ConversationSidebar.jsx: history list, new/reset/delete/select
  └─ ChatWindow.jsx: renders messages
  └─ Message.jsx: user/assistant bubbles, citations, confidence
  └─ InputBox.jsx: input + send
```

### Key Design Decisions
- **Hybrid Search**: does not remove nodes or trigger layout recomputation
- **Keep initial citations for the following conversation **: In one conversation, the tutor keeps initial citations and answers questions based on them. When the user wants to change the topic and the tutor to retrieve new citations, the user needs to start a new conversation.

## File Structure

```
client/src/
  components/chat/
    ChatPage.jsx                — page container, layout (sidebar + chat)
    ChatWindow.jsx              — message list rendering
    InputBox.jsx                — input + send button
    Message.jsx                 — message bubble, citations, confidence
    ConversationSidebar.jsx     — history list, new/reset/delete/select

  hooks/
    useChat.js                  — chat state + conversation lifecycle + sendMessage

  services/
    conversationService.js      — CRUD for conversations

server/
  routes/
    conversationRoutes.js       — GET/POST/PUT/DELETE conversations

  controllers/
    conversationController.js   — CRUD operations for conversations

  models/
    Conversation.js             — conversation schema (messages, context)
```
