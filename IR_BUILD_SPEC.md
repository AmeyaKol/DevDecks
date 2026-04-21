# Advanced IR Build Spec (DevDecks)

This branch implements the roadmap MVP on the current base product.

## Implemented Backend Surface

- `POST /api/ai/semantic-search`
  - Body: `{ query, mode: "keyword|semantic|hybrid", topK, type }`
  - Response: ranked cards with `lexicalScore`, `semanticScore`, `finalScore`.
- `POST /api/ai/rag-tutor`
  - Body: `{ question, retrievalMode, topK, type }`
  - Response: grounded answer, confidence, citations, retrieval evidence.
- `POST /api/ai/topic-mine`
  - Body: `{ limit, minConfidence }`
  - Response: lightweight topic graph `{ nodes, edges }`.
- `POST /api/ai/reindex-semantic`
  - Body: `{ onlyMine, limit }`
  - Response: batch re-index count.

## Data Model Additions (`Flashcard`)

- Provenance and generated card lineage:
  - `isGenerated`
  - `originParentId`
  - `generationMetadata`
- Semantic retrieval:
  - `embeddingVersion`
  - `cardEmbedding` (dense vector)
  - `semanticChunks[]` (`chunkId`, `heading`, `text`, `vector`, `embeddingVersion`)
- Topic mining:
  - `topicNodes[]` (`topic`, `confidence`, `edgeType`)

These fields enable:
- parent/child editorial-study card persistence
- chunk-level retrieval with parent-level display
- topic graph bootstrapping from existing cards

## Retrieval Design

- Lexical score: substring + token overlap on `question`, `problemStatement`, `explanation`.
- Semantic score: cosine similarity over:
  - query vs `cardEmbedding`
  - query vs max(`semanticChunks[].vector`)
- Hybrid rank:
  - `0.45 * lexical + 0.55 * semantic`
- Retrieval modes:
  - `keyword`: lexical only
  - `semantic`: semantic only
  - `hybrid`: combined (default)

## RAG Design

- Retrieve top-k via hybrid search.
- Build context string from retrieved cards.
- Generate grounded answer with explicit citation IDs `[C1]`.
- Guardrails:
  - explicit low confidence for weak context
  - `"insufficient evidence"` fallback path

## Topic Mining Design

- Seed concepts from `topicNodes` (derived during embedding/chunk artifact generation).
- Build co-occurrence edges across card-local topics.
- Return graph for UI exploration and prerequisite recommendation scaffolding.

## File Structure Introduced

- `server/services/embeddingService.js`
  - chunking, embedding, topic extraction, cosine helpers
- `server/services/retrievalService.js`
  - hybrid search, citation/context helpers
- Updated:
  - `server/controllers/aiController.js`
  - `server/routes/aiRoutes.js`
  - `server/models/Flashcard.js`
  - `server/controllers/flashcardController.js`
  - `server/services/geminiService.js`
  - `server/server.js`
  - `client/src/services/api.js`

## Current Embedding Backend

- Uses deterministic hash-based local embeddings (`v1-hash`) for zero-setup functionality.
- This keeps MVP runnable without extra infra.
- Future swap path:
  - replace `embedText()` internals with Voyage/OpenAI or Atlas vector index integration
  - preserve API/data model contracts

