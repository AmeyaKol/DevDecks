# CS510 Evaluation Note — RAG Tutor Pipeline

## Evaluation Objective

Assess the end-to-end quality of the DevDecks RAG tutor: given a user question about algorithms or text retrieval, does the system (1) retrieve relevant flashcards, (2) generate a faithful, grounded answer, and (3) correctly refuse questions outside its knowledge scope?

## Methodology

### Test Set Design

A gold set of 25 queries was constructed:
- **20 answerable queries** targeting specific flashcards across two content sources (Neetcode 150 algorithm problems, CS510 Text Retrieval lecture material). Each query maps to known target cards and expected topics.
- **5 unanswerable queries** on topics entirely outside the corpus (cooking, sports, React, biology, finance) to test the system's ability to refuse.

Query types include single-card direct lookups, multi-card synthesis, cross-topic comparisons, and broad thematic questions.

### Pipeline Architecture

The evaluation isolates retrieval and generation quality from infrastructure concerns:

1. **Retrieval**: Cosine similarity between query embedding and pre-computed corpus card embeddings (Gemini `gemini-embedding-001`, 3072 dimensions). Top-6 cards returned per query.
2. **Generation**: Gemini 2.5 Flash with a grounded-tutor system prompt. The model must cite retrieved cards inline and output a structured JSON response including a confidence level and an `insufficientEvidence` flag.
3. **Evaluation**: Deterministic citation scoring + RAGAS reference-free metrics (using Gemini as the judge LLM).

### Metrics

| Category | Metric | Description |
|----------|--------|-------------|
| Retrieval | Card Recall (strict) | Fraction of expected target cards appearing in top-K |
| Retrieval | Card Recall (soft) | Whether any card from the expected deck appears |
| Retrieval | Topic Hit Rate | Fraction of expected topics present in returned citations |
| Retrieval | Context Precision (RAGAS) | Are relevant documents ranked higher? |
| Grounding | Faithfulness (RAGAS) | Are answer claims supported by retrieved context? |
| Grounding | Response Relevancy (RAGAS) | Is the answer relevant to the question asked? |
| Evidence Decision | Answerable Acceptance | Answerable queries correctly answered (not refused) |
| Evidence Decision | Unanswerable Rejection | Off-topic queries correctly refused |
| Latency | Embedding / Generation | Component-level timing (p50, mean) |

## Results

### Aggregate Scores

| Metric | Score |
|--------|-------|
| Card Recall (strict) | 100% |
| Card Recall (soft) | 100% |
| Topic Hit Rate | 96.4% |
| Context Precision | 0.894 |
| Faithfulness | 0.860 |
| Response Relevancy | 0.658 |
| Answerable Acceptance | 75% (15/20) |
| Unanswerable Rejection | 100% (5/5) |
| Overall Decision Accuracy | 80% (20/25) |
| Embedding Latency (p50) | 157 ms |
| Generation Latency (p50) | 2,617 ms |

### Key Findings

**Retrieval is strong.** The semantic search achieves perfect card recall — every target flashcard appears in the top-6 results. Context precision (0.894) confirms relevant cards are ranked near the top. The embedding model effectively captures semantic similarity between natural-language questions and flashcard content.

**Generation is faithful but sometimes over-cautious.** Faithfulness of 0.86 indicates the model rarely hallucinates beyond the provided context. However, 5 of 20 answerable queries were incorrectly refused (`insufficientEvidence: true`) despite the correct cards being retrieved. Analysis shows these are cases where the retrieved card covers the topic but uses different terminology or framing than the question (e.g., q03 asks about "N-Queens backtracking" — the card exists and was retrieved, but the LLM judged the context insufficient).

**Response relevancy has room for improvement (0.658).** Three queries scored 0.0 on relevancy (q04, q07, q12), likely due to the model producing answers that address the topic but drift from the specific question framing. This suggests the generation prompt could be tightened to enforce closer alignment with the user's exact question.

**Evidence boundary detection is reliable.** All 5 off-topic queries were correctly refused with 100% accuracy. The system never hallucinates an answer when the corpus genuinely lacks relevant content.

### Latency Profile

| Component | p50 | Mean |
|-----------|-----|------|
| Query Embedding (Gemini API) | 157 ms | 160 ms |
| Answer Generation (Gemini 2.5 Flash) | 2,617 ms | 2,982 ms |

Total end-to-end latency is dominated by LLM generation (~95% of wall time). Embedding is fast and consistent. In production, retrieval latency depends on the vector store backend (Atlas Vector Search vs. brute-force), which this evaluation intentionally excludes.

## Limitations

1. **Corpus size**: The evaluation corpus contains 85 flashcards. Real deployment may have 1000+ cards, which could affect retrieval precision as more distractors are introduced.

2. **LLM-as-judge variance**: RAGAS metrics use Gemini as both the generator and the evaluator. This shared-model bias may inflate faithfulness scores. Cross-model evaluation (e.g., using GPT-4 as judge) would provide a more independent assessment.

3. **Temperature non-determinism**: Generation uses temperature 0.3, introducing run-to-run variance. The 5 false-negative IE decisions fluctuate between runs (observed range: 3–7 out of 20). Reported numbers are from a single run.

4. **No reference answers**: All RAGAS metrics are reference-free. This means we cannot measure factual correctness against ground truth — only internal consistency (faithfulness to context) and relevance. A human evaluation or reference-answer comparison would be needed to assess actual answer quality.

5. **Single embedding model**: Retrieval uses only Gemini embeddings at 3072 dimensions. No comparison against alternative embedding models (e.g., OpenAI, Cohere) or dimensionality settings was performed.

6. **Gold set coverage**: 25 queries provide directional signal but limited statistical power. Confidence intervals on the metrics are wide (e.g., ±10% for acceptance rate with n=20).
