"""
RAGAS evaluation for DevDecks RAG tutor.
Reads rag_responses.json, runs metrics, outputs ragas_scores.jsonl.
"""

import json
import os
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore", category=DeprecationWarning)

EVALS_DIR = Path(__file__).parent
RESULTS_DIR = EVALS_DIR / "results"


def main():
    responses_path = RESULTS_DIR / "rag_responses.json"
    if not responses_path.exists():
        print("ERROR: rag_responses.json not found. Run collect_responses.js first.")
        sys.exit(1)

    responses = json.loads(responses_path.read_text(encoding="utf-8"))

    # Filter to queries that have real answers and contexts (skip insufficient_evidence)
    evaluable = [r for r in responses if r["answer"] and r["contexts"] and not r.get("insufficientEvidence")]
    if not evaluable:
        print("WARN: No evaluable responses (all were insufficient_evidence or empty).")
        print("Skipping RAGAS — design gold set with questions matching actual flashcard content.")
        (RESULTS_DIR / "ragas_scores.jsonl").write_text("")
        sys.exit(0)

    print(f"Evaluating {len(evaluable)} responses with RAGAS...")

    try:
        from ragas import evaluate
        from ragas.metrics import (
            Faithfulness,
            AnswerRelevancy,
        )
        from ragas.metrics._context_precision import LLMContextPrecisionWithoutReference
        from ragas.dataset_schema import SingleTurnSample, EvaluationDataset
    except ImportError as e:
        print(f"ERROR: Missing dependency: {e}")
        print("Run: pip install -r requirements.txt")
        sys.exit(1)

    # Configure LLM judge
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("ERROR: Set GEMINI_API_KEY or GOOGLE_API_KEY for the RAGAS judge LLM.")
        sys.exit(1)

    os.environ["GOOGLE_API_KEY"] = api_key

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
        from ragas.llms import LangchainLLMWrapper
        from ragas.embeddings import LangchainEmbeddingsWrapper

        gllm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
        llm = LangchainLLMWrapper(gllm)
        gemb = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        emb = LangchainEmbeddingsWrapper(gemb)
    except ImportError:
        print("ERROR: langchain-google-genai not installed.")
        print("Run: pip install langchain-google-genai")
        sys.exit(1)

    # Build EvaluationDataset — no reference/ground_truth needed
    samples = []
    for r in evaluable:
        samples.append(SingleTurnSample(
            user_input=r["question"],
            response=r["answer"],
            retrieved_contexts=r["contexts"],
        ))
    dataset = EvaluationDataset(samples=samples)

    metrics = [
        Faithfulness(),
        AnswerRelevancy(strictness=1),
        LLMContextPrecisionWithoutReference(),
    ]

    print("Running RAGAS evaluate()...")
    result = evaluate(
        dataset=dataset,
        metrics=metrics,
        llm=llm,
        embeddings=emb,
    )

    # Write per-query JSONL
    jsonl_path = RESULTS_DIR / "ragas_scores.jsonl"
    df = result.to_pandas()
    with open(jsonl_path, "w") as f:
        for i, row in df.iterrows():
            entry = {
                "id": evaluable[i]["id"],
                "question": evaluable[i]["question"],
                "faithfulness": _safe_float(row.get("faithfulness")),
                "response_relevancy": _safe_float(row.get("answer_relevancy")),
                "context_precision": _safe_float(row.get("llm_context_precision_without_reference")),
            }
            f.write(json.dumps(entry) + "\n")

    print(f"Wrote per-query scores to {jsonl_path}")

    # Print aggregate from dataframe
    print("\nAggregate scores:")
    df2 = result.to_pandas()
    for col in ["faithfulness", "answer_relevancy", "llm_context_precision_without_reference"]:
        if col in df2.columns:
            vals = df2[col].dropna()
            if len(vals) > 0:
                label = "context_precision" if "context" in col else col
                print(f"  {label}: {vals.mean():.3f}")


def _safe_float(val):
    if val is None:
        return None
    try:
        f = float(val)
        return round(f, 4) if not (f != f) else None  # NaN check
    except (TypeError, ValueError):
        return None


if __name__ == "__main__":
    main()
