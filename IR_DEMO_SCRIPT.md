# DevDecks Advanced IR Demo Script

## Demo Goal
Show that hybrid retrieval + grounded RAG improves study relevance and trust compared to keyword-only search.

## Pre-Demo Setup

1. Ensure backend is running on `server`.
2. Reindex cards once:
   - `POST /api/ai/reindex-semantic` with `{ "onlyMine": true, "limit": 500 }`
3. Keep 3 queries ready:
   - one keyword-friendly query
   - one semantic paraphrase query
   - one multi-concept system design query

## Demo Flow

### 1) Baseline Failure Case (Keyword)
- Run `POST /api/ai/semantic-search` with:
  - `mode: "keyword"`
  - query: paraphrased concept (e.g. "concurrent writes conflict handling")
- Point out missing or noisy results.

### 2) Semantic + Hybrid Recovery
- Re-run same query with:
  - `mode: "semantic"`
  - then `mode: "hybrid"`
- Show retrieval score breakdown:
  - lexical score
  - semantic score
  - final rank
- Highlight conceptually relevant cards now surfaced.

### 3) RAG Tutor with Citations
- Ask `POST /api/ai/rag-tutor` a complex question.
- Show answer with inline citations `[C1]`, `[C2]`.
- Open cited cards and verify grounding.
- If evidence is thin, show low-confidence or insufficient-evidence behavior.

### 4) Topic Mining View
- Run `POST /api/ai/topic-mine`.
- Display node and edge counts.
- Explain how co-occurrence graph supports:
  - related topic exploration
  - prerequisite recommendations

### 5) Quantitative Summary
- Run `npm run eval:retrieval` in `server`.
- Compare keyword vs semantic vs hybrid using:
  - Precision@5
  - Precision@10
  - MRR

## Closing Narrative

- Hybrid retrieval improves query robustness over exact token matching.
- RAG is grounded in user/public card corpus, not generic hallucinated answers.
- Topic graph provides explainable structure for discovery and future study-path ranking.

