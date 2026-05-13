#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load GEMINI_API_KEY from server/.env if not already set
if [ -z "$GEMINI_API_KEY" ]; then
  ENV_FILE="$SCRIPT_DIR/../../server/.env"
  if [ -f "$ENV_FILE" ]; then
    export GEMINI_API_KEY=$(grep "^GEMINI_API_KEY" "$ENV_FILE" | head -1 | sed 's/GEMINI_API_KEY *= *//' | tr -d '\r')
  fi
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "ERROR: GEMINI_API_KEY not set. Export it or add to server/.env"
  exit 1
fi

echo "=== RAG Tutor Evaluation ==="
echo ""

echo "[1/4] Collecting responses (local retrieval + Gemini generation)..."
node collect_responses.js

echo ""
echo "[2/4] Evaluating citation accuracy..."
node evaluate_citations.js

echo ""
echo "[3/4] Running RAGAS metrics..."
python run_ragas.py

echo ""
echo "[4/4] Generating report..."
node generate_report.js

echo ""
echo "=== Done ==="
echo "Results: $SCRIPT_DIR/results/"
echo "  eval_results.json  — structured scores"
echo "  summary.md         — human-readable summary"
