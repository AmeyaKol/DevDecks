# RAG Tutor Evaluation

Evaluates retrieval quality, answer grounding, evidence decisions, and latency of the DevDecks RAG tutor pipeline.

Runs locally against pre-computed corpus embeddings + Gemini API. No server or database required.

## Prerequisites

- Node.js 18+
- Python 3.9+ (`pip install -r requirements.txt`)
- `GEMINI_API_KEY` env var (or in `server/.env`)

## Run

```bash
cd evals/rag-tutor
export GEMINI_API_KEY=your-key
bash run-all.sh
```

## Pipeline

1. `collect_responses.js` — embed queries, retrieve top-K from corpus via cosine similarity, generate answers with Gemini
2. `evaluate_citations.js` — score citation accuracy and evidence decisions against gold set
3. `run_ragas.py` — RAGAS faithfulness, relevancy, context precision (reference-free)
4. `generate_report.js` — aggregate into `eval_results.json` and `summary.md`

## Gold Set

25 queries in `gold-set.json`: 20 answerable (targeting specific flashcards) + 5 unanswerable (off-topic). Minor result variance expected due to LLM temperature.
