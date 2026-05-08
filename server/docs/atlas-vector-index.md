# Atlas Vector Search index setup

The retrieval layer is split between an embedding service (`text → vector`) and a
swappable vector store (`vector → ranked card list`). When `VECTOR_STORE=brute`
the app does in-process cosine over Mongo documents — fine for development and
small corpora, slow at scale. To switch to Atlas Vector Search:

1. Use a MongoDB Atlas cluster (any tier, including the free M0 — Atlas Vector
   Search has been GA on M0 since 2024).
2. Create the two indexes below in the Atlas UI under **Search → Atlas Vector
   Search → Create Index**, or via `mongosh`. Names match what the code expects
   by default; override with `ATLAS_VECTOR_INDEX_NAME` if you rename.
3. Once the indexes show **Ready**, set `VECTOR_STORE=atlas` in `.env` and
   restart the server.

The brute-force adapter remains the safety net: if `$vectorSearch` raises (e.g.
the index is still building, or `numCandidates` is invalid), `mongoAtlasVector`
falls back to brute force for that single request and the warning lands in the
logs.

## Card-level index — `flashcard_card_vec`

Indexes the merged-card embedding stored on `Flashcard.cardEmbedding`. This is
the index queried by `vectorStore.semanticSearch(...)` for the default search
flow.

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "cardEmbedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    { "type": "filter", "path": "user" },
    { "type": "filter", "path": "isPublic" },
    { "type": "filter", "path": "type" },
    { "type": "filter", "path": "tags" },
    { "type": "filter", "path": "decks" },
    { "type": "filter", "path": "embeddingMeta.model" },
    { "type": "filter", "path": "embeddingMeta.status" }
  ]
}
```

Notes:

- `numDimensions: 768` matches the default `EMBEDDING_DIMENSION` for
  `gemini-embedding-001`. The model natively returns 3072-dim vectors; the
  embedding service truncates to 768 via `outputDimensionality` and L2-
  normalizes before storage. If you change `EMBEDDING_DIMENSION` (recommended
  values: 768, 1536, 3072), drop and rebuild the index with the new size.
- `embeddingMeta.model` filter lets clients (and us) pin a query to a specific
  embedding version, avoiding silent corruption when running mixed-version
  corpora during a model upgrade.
- `embeddingMeta.status` filter is so retrieval can choose to ignore cards that
  fell back to hash vectors (`status: 'pending'`) or are still failing
  (`status: 'failed'`).

## Chunk-level index — `flashcard_chunk_vec`

Indexes the per-chunk vectors stored under `semanticChunks[].vector`. Module D
will use this for fine-grained chunk retrieval (the current hybrid search only
reranks already-fetched chunks, but D's RAG path will want top chunks across
the whole corpus).

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "semanticChunks.vector",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    { "type": "filter", "path": "user" },
    { "type": "filter", "path": "isPublic" },
    { "type": "filter", "path": "type" },
    { "type": "filter", "path": "decks" },
    { "type": "filter", "path": "semanticChunks.embeddingMeta.model" }
  ]
}
```

Atlas indexes nested-array vector paths automatically; `$vectorSearch` matches
against the closest chunk per parent doc.

## Verifying the setup

After both indexes are **Ready**:

```bash
# 1. Reembed the corpus with Gemini (idempotent; safe to re-run)
npm --prefix server run embed:cards

# 2. Sanity check: same query, two stores
VECTOR_STORE=brute  npm --prefix server run eval:retrieval > eval-brute.json
VECTOR_STORE=atlas  npm --prefix server run eval:retrieval > eval-atlas.json
```

`eval-brute.json` and `eval-atlas.json` should agree to within ~1% on small
corpora. Larger divergences usually mean the filter clause references a path
that wasn't declared as a `filter` field in the index, or that the index hasn't
finished building.
