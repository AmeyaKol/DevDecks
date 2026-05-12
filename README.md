# DevDecks

DevDecks is a full-stack MERN (MongoDB, Express.js, React, Node.js) flashcard app for creating, organizing, and studying decks. It supports multiple deck types (DSA, System Design, Behavioral, Technical Knowledge, GRE Word, GRE MCQ), optional YouTube playlist import, dictionary lookups, a **knowledge graph** built from topics on your cards, and a **RAG learning coach** that answers from your own flashcards with citations.

**Hosted app:** [DevDecks on Render](https://devdecks.onrender.com)

## Tech stack

- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT auth, Gemini-powered AI and embeddings (configurable)
- **Frontend:** React 18, React Router, Zustand, TanStack Query, Tailwind CSS, Headless UI, Heroicons
- **Extras:** YouTube Data API, Merriam-Webster Dictionary API, optional Redis (Upstash) caching, optional MongoDB Atlas Vector Search

---

## 1. Local installation

### Prerequisites

- **Node.js** (v18+ recommended; v14+ may work)
- **MongoDB** (local install or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string)
- **npm** (comes with Node)

### Clone the repository

```powershell
git clone <repository-url>
cd MERNFlashcardApp
```

### Install dependencies

From the **repository root**:

```powershell
npm install
cd server; npm install; cd ..
cd client; npm install; cd ..
```

### Environment files

Create two `.env` files (they are not committed to git). The repo ships **templates** you can copy:

| Location | Template | Your file |
|----------|----------|-----------|
| Server | `server/env.template` | `server/.env` |
| Client | `client/env.template` | `client/.env` |

**PowerShell (from repo root):**

```powershell
Copy-Item server\env.template server\.env
Copy-Item client\env.template client\.env
```

Then edit `server\.env` and `client\.env` with your values.

### Getting API keys and configuration

**Always required for a working local stack**

| Variable | Where to set | Purpose |
|----------|----------------|---------|
| `MONGO_URI` | `server/.env` | MongoDB connection string. Local example: `mongodb://localhost:27017/flashcard-app`. Atlas: connection string from the Atlas UI. (`MONGODB_URI` is also accepted.) |
| `JWT_SECRET` | `server/.env` | Secret for signing auth tokens. Use a long random string (e.g. from [randomkeygen](https://randomkeygen.com/)). |
| `FRONTEND_URL` | `server/.env` | Origin used for CORS. Local dev: `http://localhost:3000`. |
| `GEMINI_API_KEY` | `server/.env` | Google AI (Gemini): test generation, outlines, RAG tutor answers, and **default** text embeddings when `EMBEDDING_PROVIDER=gemini`. [Google AI Studio](https://aistudio.google.com/apikey) |
| `REACT_APP_API_URL` | `client/.env` | Base URL for the REST API. Local: `http://localhost:5001/api`. |

**Strongly recommended defaults (already in `server/env.template`)**

| Variable | Notes |
|----------|--------|
| `PORT` | Backend port; default `5001`. |
| `NODE_ENV` | `development` locally. |
| `EMBEDDING_PROVIDER` | `gemini` uses your Gemini key; `hash` is a deterministic local fallback (tests / no key). |
| `VECTOR_STORE` | `brute` = in-process vector similarity over MongoDB (no Atlas Vector Search required). `atlas` needs Atlas indexes (see `server/docs/atlas-vector-index.md`). |

**Optional features**

| Variable | Purpose |
|----------|---------|
| `DICTIONARY_KEY` | Merriam-Webster Collegiate API for dictionary features. [Dictionary API](https://dictionaryapi.com/) (the app reads `DICTIONARY_KEY`; align your `.env` with that name.) |
| `YOUTUBE_API_KEY` | Import decks from YouTube playlists. [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials) |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Optional Redis cache ([Upstash](https://upstash.com/)). |
| `ADMIN_EMAILS` | Comma-separated emails for admin-only behavior (see `server/middleware/adminMiddleware.js`). |
| `GROQ_API_KEY` | Only needed if you run topic extraction in LLM mode (`topicMiningService`); default card pipelines use other topic signals. |

Client variables `REACT_APP_APP_NAME` and `REACT_APP_VERSION` are optional branding/metadata.

### Start MongoDB (local)

**Windows (service):**

```powershell
# If MongoDB is installed as a Windows service, e.g.:
net start MongoDB
```

**Docker (any OS):**

```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Adjust `MONGO_URI` if you use a different host or port.

### Run the app

**Option A — both client and server (from repo root):**

```powershell
npm run dev
```

**Option B — two terminals:**

```powershell
# Terminal 1 — API (default http://localhost:5001)
npm run server

# Terminal 2 — React dev server (http://localhost:3000)
npm run client
```

Open `http://localhost:3000`. Ensure `REACT_APP_API_URL` matches the API port and includes the `/api` suffix.

---

## 2. Usage

This section focuses on **deck view**, the **knowledge graph**, and the **RAG learning coach**: what they do, how data moves, and the main controls.

### Deck view (`/deckView`)

**Purpose:** See **all cards in one deck** in a scrollable list (not paginated like the global card browser), with deck-level actions.

**How to open it**

- From the home experience, open a deck so the URL includes `?deck=<deckId>` on `/deckView`, or use navigation that lands on `/deckView?deck=<deckId>`.

**Data flow**

1. The app loads your deck list, resolves the deck for `deck` in the query string, and sets it as the active deck.
2. It requests **all flashcards for that deck** (`paginate: false`) so the list reflects the full deck.
3. If you are signed in, deck opens are recorded for **recent decks** (background API call).

**What you can do there**

- **Study** — opens `/study` (or `/gre/study` for GRE deck types) scoped to that deck.
- **Chat** — opens the RAG coach scoped to that deck (`/chat/:deckId` or GRE equivalent).
- **Add card** — create flow on the home tab, pre-linked to the deck (owners only).
- **Filters** — text search and sorting apply to the in-deck list; search is debounced and updates the store-driven fetch.
- **Folders, export, favorites, test** — via the actions menu and related modals (behavior depends on auth and ownership).

### Knowledge graph (`/knowledge-graph`)

**Purpose:** Visualize **topics** and **relationships** mined from flashcard content (and optional per-deck scope). Topics come from semantic metadata on cards; edges encode relationship types (for example related, prerequisite, variant, used-in).

**Access**

- You must be **logged in**. Without session/user context, the graph layer does not fetch live data.
- GRE mode uses `/gre/knowledge-graph` with the same UI pattern.

**Data flow (high level)**

1. **Initial load:** The client calls the graph API (all decks or a specific deck when `deckId` is set), using your auth token.
2. **Topic search (string):** Filters the loaded graph client-side (debounced) by topic label.
3. **Semantic topic search:** Calls `GET /api/topics/semantic` with your query and confidence settings; the canvas updates to the subgraph returned.
4. **Confidence slider:** Changing minimum confidence triggers a **refetch** so the server returns edges/topics above that threshold.
5. **Empty graph:** If there is no data yet, the UI may show a **sample graph** so you can still explore the controls; add cards with rich text/topics and embeddings to populate a real graph.

**Deep links**

- `?deck=<deckId>` — open graph scoped to one deck.
- `?node=<topicName>` — focus and select a topic after load (for example from chat citations).

**Main toggles and controls**

| Control | Effect |
|---------|--------|
| **Search topics** | Client-side filter on topic names (Ctrl/Cmd+F focuses the search box; Escape clears node selection). |
| **Refresh** | Reloads graph data from the server. |
| **Deck dropdown** | `All decks` vs a single deck; changing it refetches the graph for that scope. |
| **Layout: Force / Tree / Radial** | Changes graph layout only (same data). |
| **Filters panel** | **Edge types:** toggle Related, Prerequisite, Variant, Used-in (at least one type must stay on). **Confidence:** minimum edge/topic confidence (0–100%). **Min cards:** minimum number of cards supporting a topic. |
| **Semantic topic search** | Separate field + **Search** button; runs vector-backed topic discovery and replaces the canvas with that result set. |
| **Focused neighborhood** | Selecting a node can focus its neighborhood; banner shows **Show all topics** to clear focus. |
| **Truncation notice** | Very large graphs may cap visible nodes (for example top topics by support); the banner explains narrowing with filters. |

**Node detail panel**

- Selecting a node opens the side/detail panel with cards and metadata tied to that topic (within the React Flow canvas).

### RAG learning coach (`/chat` and `/chat/:deckId`)

**Purpose:** Ask questions and get answers **grounded in your flashcards**, with **citations** to specific cards. Optional **deck-only** mode narrows retrieval to one deck.

**Access**

- **Login required.** Unauthenticated users see a short “login required” message.
- Routes: `/chat` (all accessible decks/cards) and `/chat/:deckId` (scoped coach). GRE routes mirror under `/gre/chat`.

**Data flow**

1. **Conversations** — Stored per user (list in the sidebar). Starting a chat creates or reuses a conversation; messages persist through the conversation API.
2. **Send message** — Client appends the user message, then `POST /api/ai/rag-tutor` with the question, prior messages, optional `conversationId`, and optional `deckId`.
3. **Retrieval** — The server builds an expanded query from the latest user question plus recent user turns (so short follow-ups stay on-topic), then runs **hybrid search** (semantic + keyword, configurable mode) over flashcards you can access.
4. **Quality filter** — Results below a score threshold are dropped.
5. **Graph expansion** — Additional cards are pulled in when they share **topic graph** overlap with the top hits (so related concepts appear even if wording differs).
6. **Fallback** — If hybrid search fails (for example embedding quota), the server can fall back to **topic keyword** lookup from the question.
7. **Citations** — Cards are formatted into citations; topic badges may link to the knowledge graph when the topic appears on enough cards.
8. **Generation** — Gemini produces the final answer from retrieved **context** and **citations**. If generation fails, the API may still return citations and a short fallback message.
9. **UI** — Assistant messages render Markdown; **confidence** and **insufficient evidence** warnings show when applicable; **Sources from your decks** lists citation cards with links (including to `/knowledge-graph?node=...` for topics).

**Main toggles and UI**

| Element | Effect |
|---------|--------|
| **Conversation sidebar** | Lists past chats; select, new, reset, delete. Can be collapsed with the **bars** toggle. |
| **Deck-scoped URL** | `/chat/:deckId` limits retrieval to that deck (stricter `topK` on the server for deck scope). |
| **Query param `?q=`** | If present once, the page can auto-send that question then strip the param (useful for deep links). |

Default client request uses `retrievalMode: 'hybrid'` and `topK: 6` unless you change the API client.

### Adding screenshots to this README

Markdown does not embed binary images by pasting alone; you **add image files to the repo** and reference them with standard image syntax.

1. Create a folder, for example `docs/images/`.
2. Save screenshots as `.png` or `.webp` there.
3. In `README.md`, use a **relative path** from the README file:

```markdown
![Deck view with filters](docs/images/deck-view.png)
```

On GitHub, GitLab, and most Markdown viewers, that renders the image next to the text. Optional **HTML** for sizing:

```markdown
<img src="docs/images/knowledge-graph.png" alt="Knowledge graph" width="800" />
```

Keep paths relative so they work on the default branch view and in local previews.

---

## Scripts (root `package.json`)

| Script | Command |
|--------|---------|
| `npm run dev` | Runs API + React together |
| `npm run server` | API only (`server`) |
| `npm run client` | React only (`client`) |

---

## License / contributing

Add your preferred license and contribution guidelines here if the project is public.
