# DevDecks RAG Tutor Eval — 2026-05-11

## 1. Retrieval Quality
| Metric | Score |
|--------|-------|
| Context Precision | 0.8935 |
| Topic Hit Rate | 96% |
| Card Recall (strict) | 100% |
| Card Recall (soft) | 100% |
| Avg Citation Count | 6 |

## 2. Grounding & Generation Quality
| Metric | Score |
|--------|-------|
| Faithfulness | 0.8597 |
| Response Relevancy | 0.6575 |

> Evaluated on queries where the system produced an answer (IE=false).

## 3. Evidence Decision Quality
| Metric | Score |
|--------|-------|
| Answerable Acceptance Rate | 75% |
| Unanswerable Rejection Rate | 100% |
| Overall Decision Accuracy | 80% |

## 4. Latency (embedding + generation)
| Metric | Value |
|--------|-------|
| Embedding p50 | 157 ms |
| Embedding mean | 160 ms |
| Generation p50 | 2617 ms |
| Generation mean | 2982 ms |
