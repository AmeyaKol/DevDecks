# Module A — Content embedding & ingestion pipeline

## Overview (1–2 slides / ~1 minute)

**Module A turns flashcards into versioned, retrievable vectors.** User content (question, problem statement, explanation, code, tags) is normalized and fingerprinted with a deterministic **content hash** so the system knows when text changed. That hash is the contract downstream modules rely on: the same card content maps to the same identity for skip logic and debugging, while edits trigger a fresh embedding pass.

**Chunking splits each card into semantically addressable pieces.** Text is merged and split along Markdown-style headings (`#` …); each section becomes a **semantic chunk** with its own text, per-chunk metadata, and a **stable `chunkId`** derived from the card id, heading, index, and a hash of the chunk body. The pipeline also builds one **card-level** vector from the merged body so retrieval can work at whole-card or sub-card granularity. Chunk ids and hashes are what Module D cites and what hybrid search indexes.

**Embeddings are produced in batch with a clear version stamp.** By default the stack uses **Gemini** (`gemini-embedding-001`, configurable) with retries and rate-limit aware backoff; if the API key is missing or quota is hit, a **local hash embedding** can degrade gracefully on the write path. Each card stores `embeddingVersion`, `cardEmbedding`, `embeddingMeta` (status, model, dimension, errors), and `semanticChunks[]` with parallel vectors—so Module B and Module D consume a single, consistent schema.

**Indexing is incremental and operationally safe.** New and updated cards run **`buildSemanticArtifacts`** on the write path (with optional fallback so saves do not hard-fail). Bulk backfill and repair go through **`reindexCards`**: batched cursor over Mongo, **idempotent skips** when content hash and model already match, optional **force** and **dry run**, and per-card failure isolation so one bad document does not block the job. Admins trigger **`POST /api/ai/reindex-semantic`** (scoped by user by default) for the same pipeline the CLI/tests use—giving observability (processed / skipped / failed counts) and a path from “we edited decks” to “search and tutor see fresh vectors.”

## Features

### Chunking & IDs
- Heading-aware chunks from question + problem + explanation + code; fallback single “general” chunk when there are no headings
- Deterministic `chunkId` (12-char hex) and SHA-1 chunk content hashes for stable citations

### Embeddings & versioning
- `EMBEDDING_PROVIDER`: `gemini` (default) or `hash` for local/dev
- Card-level + per-chunk vectors; `embeddingMeta.status`: `ok` | `pending` | `failed`
- `computeCardContentHash` over normalized fields + sorted tags for change detection

### Reindex pipeline
- Batch processing, optional `limit`, `force`, `filter`, `dryRun`, progress callback
- Failed cards persist error on `embeddingMeta` without stopping the batch

### Integration role
- **Feeds Module D:** hybrid RAG reads `semanticChunks` / vectors for retrieval
- **Feeds Module B:** baseline lexical `topicNodes` from `extractTopics` during artifact build; LLM topic mining in B can refine or replace downstream

## Architecture

### Data flow
```
Flashcard create/update (flashcardController.js)
  └─ buildSemanticArtifacts() [allowFallback on write path]
       ├─ computeCardContentHash
       ├─ chunkByHeadings → chunkIds + chunk hashes
       ├─ embedTexts() → cardEmbedding + chunk vectors (Gemini or hash)
       └─ extractTopics() → seed topic list (lexical)
       ↓
Mongo Flashcard: cardEmbedding, embeddingMeta, semanticChunks, topicNodes (related_to on reindex path)

Bulk / repair
  └─ POST /api/ai/reindex-semantic (aiController.reindexSemantic)
       └─ reindexCards() (embeddingPipeline.js)
            └─ same buildSemanticArtifacts + save (no allowFallback; failures recorded)
```

### Key design decisions
- **Idempotent reindex:** skip when stored hash + model match unless `force`
- **Stable chunk IDs:** citations and retrieval stay aligned across reembeds when content is unchanged
- **Write path resilience:** optional hash fallback + `pending` status instead of blocking user saves when Gemini fails

## File Structure

```
server/
  services/
    embeddingService.js      — chunkByHeadings, computeCardContentHash, buildSemanticArtifacts,
                             embedTexts / Gemini batching, hash fallback, extractTopics
    embeddingPipeline.js     — reindexCards (batch, skip, dryRun, failure handling)

  controllers/
    flashcardController.js   — invokes buildSemanticArtifacts on create/update
    aiController.js          — reindexSemantic → reindexCards

  routes/
    aiRoutes.js              — POST /reindex-semantic

  models/
    Flashcard.js             — cardEmbedding, embeddingMeta, semanticChunks[], embeddingVersion

  tests/
    integration/embeddingPipeline.test.js
    unit/services/embeddingService.test.js
```

## Dependencies

- `@google/generative-ai` — Gemini batch embeddings (when provider is `gemini`)
- `crypto` (Node) — content hashes, deterministic chunk ids
