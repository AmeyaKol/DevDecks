# Module B — Topic mining infrastructure (handoff)

This document is for whoever owns **topic mining** and **knowledge-graph connectivity**. Another teammate owns **embedding generation** (`cardEmbedding`, `semanticChunks`, pipelines); you consume those fields and extend logic beyond today’s purely lexical `topicNodes` graph.

---

## 1. What exists today (contract you must preserve or consciously extend)

### 1.1 Flashcard shape: `topicNodes`

Stored per card in Mongo (`Flashcard` schema). Each entry roughly has:

- `topic` — string label (today often a lexical token or normalized tag-like string).
- `confidence` — number in \([0, 1]\); graph endpoints filter on this.
- `edgeType` — enum (`related_to`, `prerequisite_of`, `variant_of`, `used_in`); **today write paths often force `related_to`** for mined topics.

Graph UX expects multiple edge types in filters; enrichment is mostly backend/graph-side.

### 1.2 Where `topicNodes` come from (lexical baseline)

- **`extractTopics()`** in `server/services/embeddingService.js` — bag-of-words over `question` + `explanation`, stop-word filtering, tags boosted. Returns `{ topic, confidence }` only (no semantic embedding).
- **`buildSemanticArtifacts()`** — calls `extractTopics`, then merges topics into `topicNodes` with `edgeType: 'related_to'` in flashcard create/update and `embeddingPipeline.reindexCards`.

So: **topics are not derived from vectors today**; embeddings live beside lexical topics.

### 1.3 Knowledge graph today (`topicNode` logic only)

`server/controllers/graphController.js`:

1. Loads cards with non-empty `topicNodes` (visibility: public or owner).
2. Drops topics below query param `minConfidence`.
3. **Nodes:** each distinct `topic` string → `support` (count of cards mentioning it), `deckCount`.
4. **Edges:** for each card, **every pair** of surviving topics gets an undirected edge key `sort(a,b)`; `weight` increments per co-occurrence; `edgeType` from first seen pair (usually `related_to`).

Important limitations:

- **No use of `cardEmbedding` or `semanticChunks`** for mining or edges.
- Client (`client/src/store/graphStore.js`) filters edges by `e.confidence`, but API edges typically lack `confidence` → slider may not reflect semantic strength until you add it.

---

## 2. What embeddings give you (inputs you should use)

All produced by `buildSemanticArtifacts` / `reindexCards` and stored on `Flashcard`:

| Field | Meaning |
|--------|--------|
| `cardEmbedding` | Single vector for **whole card** text (merged sections). Good for corpus-wide similarity, clustering, prototype assignment. |
| `semanticChunks[]` | Sections split by markdown `#` headings; each has `text`, `heading`, **`vector`**. Good when one card covers multiple ideas — match **subsection** to topic. |
| `embeddingMeta` (card-level) | `status` (`ok` / `pending` / `failed`), `model`, `dimension`, `contentHash`, etc. **Only use vectors where `status === 'ok'`** for mining math; fall back to lexical-only when pending/failed. |

Reuse helpers:

- **`cosineSimilarity`** — `server/services/embeddingService.js`
- **Vector search** — `server/services/vectorStore/index.js` (`VECTOR_STORE=brute|atlas`) — same patterns as `server/services/retrievalService.js`

---

## 3. Recommended design: layer embeddings on top of lexical `topicNodes`

Do **not** throw away `extractTopics` / current `topicNodes` immediately. Treat them as **cheap seeds**:

1. **Lexical seeds** — existing `topicNodes` topics + `tags` + optional `semanticChunks[].heading` strings.
2. **Embedding layer** — canonicalize synonyms, assign cards/topics with `cardEmbedding`, refine with `semanticChunks[].vector`.
3. **Graph layer** — keep `buildGraph`-style **co-occurrence** as one signal; add **embedding affinity** (card neighborhoods, chunk NN) as another; optionally LLM edge typing later (Module C).

This minimizes breakage for `/api/graph` and the React graph page.

---

## 4. Suggested implementation phases (for Module B owner)

### Phase A — Canonical topics (corpus-level)

**Goal:** fewer fragmented strings (“dfs”, “depth”, “graph”) → stable topic IDs.

- Start from union of lexical topics (per scope: all visible cards, or one deck).
- Optionally embed each candidate label with `embedTexts(..., { taskType: 'RETRIEVAL_QUERY' })` and merge clusters above cosine threshold **or** merge using centroid similarity of **mean `cardEmbedding`** of cards that carry that label.
- Output: `canonicalTopicId`, `displayLabel`, `support`, `deckCount`.

### Phase B — Per-card attribution (optional but high value)

**Goal:** better `confidence` when a card has multiple sections.

- For each card with OK embeddings, score each canonical topic against **`semanticChunks[].vector`** (max or top-k mean similarity to topic prototype vector).
- Combine with lexical confidence (e.g. weighted sum or max). Persist either:
  - updated `topicNodes` on write (heavy), or
  - computed at read time in mining/graph pipeline (lighter MVP).

### Phase C — Topic–topic affinity (beyond co-occurrence)

**Goal:** edges between topics that rarely share a card but appear in similar material.

- **Card neighborhood:** for cards strongly tagged with topic A, find kNN via `cardEmbedding` (vectorStore or brute scan capped); accumulate evidence when neighbors support topic B.
- **Chunk neighborhoods:** same using chunk vectors across cards (more precise, more CPU).

Normalize scores to \([0,1]\) → expose as **`confidence`** on edges so the UI slider works.

### Phase D — API integration points

| Surface | File | Note |
|---------|------|------|
| Topic mining JSON | `server/controllers/aiController.js` (`topicMine`) | Today co-occurrence only; extend return shape with canonical topics + embedding metrics + diagnostics. |
| Graph JSON | `server/controllers/graphController.js` | Either call shared mining service before `buildGraph`, or merge embedding edges with co-occurrence edges (dedupe by sorted pair). |
| Reindex | `server/services/embeddingPipeline.js` | Embedding owner maintains this; after reindex, bust mining cache if you add caching. |

---

## 5. Guardrails & ops

- **Model consistency:** compare only vectors with same `embeddingMeta.model` and dimension.
- **Limits:** cap cards processed per request; paginate or scope by deck for interactive UX.
- **Diagnostics:** return counts — cards used, skipped (no OK embedding), edges from co-oc vs embed-only — so QA is easy.
- **Privacy:** mirror graph visibility (`isPublic` or `user`) in every query.

---

## 6. Checklist for deliverable “Module B done enough”

- [ ] Lexical `topicNodes` still populate cards (existing pipeline unchanged or backward compatible).
- [ ] Mining or graph response uses **`cardEmbedding`** (OK only) for at least one of: canonical merge, neighborhood edges, or attribution.
- [ ] Optional: **`semanticChunks`** used to refine topic confidence or chunk-level affinity.
- [ ] Graph edges expose **`confidence`** if the client should filter by semantic strength.
- [ ] Documented env deps: `GEMINI_API_KEY`, `VECTOR_STORE`, Atlas index name if used.

---

## 7. Ownership summary

| Area | Owner |
|------|--------|
| Embedding generation, chunking, reindex, `embeddingMeta` | Embeddings / IR teammate |
| Corpus topic mining, canonical topics, embedding-driven affinity, graph JSON enrichment | Topic mining / Module B teammate |
| Visualization, filters, layout | Frontend graph (may need edge shape tweaks only) |

Questions about **what vectors mean** or **why chunking exists**: see inline comments in `server/services/embeddingService.js` (`buildSemanticArtifacts`, `chunkByHeadings`) and team chat / CS510 doc.
