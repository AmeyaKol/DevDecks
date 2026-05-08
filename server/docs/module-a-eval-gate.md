# Module A — IR regression gate runbook

The `npm run eval:retrieval` script is the contract test for the embedding +
retrieval pipeline. It calls `hybridSearch` against a fixed set of queries in
`server/docs/ir-eval-queries.json` and prints `{ keyword, semantic, hybrid }`
P@5 / P@10 / MRR per mode.

The script needs:

- A reachable MongoDB (Atlas or local) populated with at least the seed cards
  the queries are designed to surface (DSA, system design, distributed systems
  topics).
- `GEMINI_API_KEY` only when `EMBEDDING_PROVIDER=gemini`.
- For the Atlas leg, both Atlas Vector Search indexes from
  [atlas-vector-index.md](./atlas-vector-index.md) in **Ready** state.

## Three checkpoints

Capture three JSON reports and attach them to the PR.

### 1. Baseline (pre-change behavior — `v1-hash`)

```powershell
$env:EMBEDDING_PROVIDER = "hash"
$env:VECTOR_STORE       = "brute"
npm run eval:retrieval > docs/eval/report-baseline.json
```

This is the existing behavior; it confirms the new VectorStore adapter and
slimmer `hybridSearch` haven't broken the pre-Gemini contract. Numbers should
match whatever your last `v1-hash` baseline produced.

### 2. Gemini swap (real semantics, brute store)

```powershell
$env:EMBEDDING_PROVIDER = "gemini"
$env:EMBEDDING_MODEL    = "gemini-embedding-001"
$env:EMBEDDING_DIMENSION = "768"
$env:VECTOR_STORE       = "brute"

# Re-embed the corpus once so cards have v2-gemini-embedding-001 vectors.
npm run embed:cards

npm run eval:retrieval > docs/eval/report-gemini-brute.json
```

Expectation: P@5 and MRR for `semantic` and `hybrid` rise above the baseline.
`keyword` is unchanged (it doesn't touch the embedding pipeline). If semantic
falls, the chunking, query-task-type, or normalization is wrong; investigate
before touching Atlas.

### 3. Atlas leg (Atlas Vector Search)

Prerequisite: create both indexes from `atlas-vector-index.md` and wait for
**Ready**. Then:

```powershell
$env:EMBEDDING_PROVIDER = "gemini"
$env:VECTOR_STORE       = "atlas"
npm run eval:retrieval > docs/eval/report-gemini-atlas.json
```

Expectation: numbers within ~1% of `report-gemini-brute.json`. Significant
divergence usually means:

- The index is still building (check Atlas UI status).
- A `filter` field referenced by the adapter is missing from the index
  definition (e.g. `embeddingMeta.model`).
- The card embeddings are still 256-dim hash vectors because `npm run
  embed:cards` was skipped or failed; check `embeddingMeta.status === 'ok'`
  on a sample document.

## What to attach to the PR

```text
docs/eval/report-baseline.json
docs/eval/report-gemini-brute.json
docs/eval/report-gemini-atlas.json   # only if Atlas index is live
```

Plus a one-line summary: e.g. `hybrid MRR rose from 0.42 (hash) to 0.71
(gemini-brute), atlas matched within 0.3%`.

## Operating notes

- `evaluateRetrieval.js` is read-only — it never modifies cards. Safe to run
  against the production DB for spot checks.
- The Gemini path retries 3 times on rate limits; one full run hits Gemini
  ~30 times (10 queries × 3 modes), which is well inside the free tier.
- The eval runs sequentially and finishes in well under a minute for the
  current corpus size.
