import fs from 'fs';
import path from 'path';
import { CONFIG } from './helpers/config.js';

function main() {
  const resultsDir = CONFIG.RESULTS_DIR;

  const ragasPath = path.join(resultsDir, 'ragas_scores.jsonl');
  const citationPath = path.join(resultsDir, 'citation_scores.json');
  const responsesPath = path.join(resultsDir, 'rag_responses.json');

  // Parse RAGAS JSONL → aggregate
  let ragasAggregate = {};
  if (fs.existsSync(ragasPath)) {
    const lines = fs.readFileSync(ragasPath, 'utf-8').trim().split('\n').filter(Boolean);
    const entries = lines.map(l => JSON.parse(l));
    if (entries.length > 0) {
      const metrics = ['faithfulness', 'response_relevancy', 'context_precision'];
      for (const m of metrics) {
        const vals = entries.map(e => e[m]).filter(v => v !== null && v !== undefined);
        ragasAggregate[m] = vals.length > 0 ? round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      }
    }
  }

  // Parse citation scores
  let citationAggregate = {};
  if (fs.existsSync(citationPath)) {
    const data = JSON.parse(fs.readFileSync(citationPath, 'utf-8'));
    citationAggregate = data.aggregate || {};
  }

  // Compute latency from rag_responses.json timing data
  let latencyData = {};
  if (fs.existsSync(responsesPath)) {
    const responses = JSON.parse(fs.readFileSync(responsesPath, 'utf-8'));
    const embTimes = responses.map(r => r.timing?.embedding_ms).filter(v => v != null);
    const genTimes = responses.map(r => r.timing?.generation_ms).filter(v => v != null);

    if (embTimes.length > 0) {
      embTimes.sort((a, b) => a - b);
      latencyData.embedding_p50_ms = percentile(embTimes, 50);
      latencyData.embedding_mean_ms = Math.round(embTimes.reduce((a, b) => a + b, 0) / embTimes.length);
    }
    if (genTimes.length > 0) {
      genTimes.sort((a, b) => a - b);
      latencyData.generation_p50_ms = percentile(genTimes, 50);
      latencyData.generation_mean_ms = Math.round(genTimes.reduce((a, b) => a + b, 0) / genTimes.length);
    }
  }

  // Build combined eval_results.json
  const evalResults = {
    timestamp: new Date().toISOString(),
    retrieval_quality: {
      context_precision: ragasAggregate.context_precision ?? null,
      topic_hit_rate: citationAggregate.topic_hit_rate ?? null,
      card_recall_strict: citationAggregate.card_recall_strict ?? null,
      card_recall_soft: citationAggregate.card_recall_soft ?? null,
      avg_citation_count: citationAggregate.avg_citation_count ?? null
    },
    grounding_quality: {
      faithfulness: ragasAggregate.faithfulness ?? null,
      response_relevancy: ragasAggregate.response_relevancy ?? null
    },
    evidence_decision_quality: {
      answerable_acceptance_rate: citationAggregate.answerable_acceptance_rate ?? null,
      unanswerable_rejection_rate: citationAggregate.unanswerable_rejection_rate ?? null,
      evidence_decision_accuracy: citationAggregate.evidence_decision_accuracy ?? null
    },
    latency: latencyData
  };

  fs.writeFileSync(
    path.join(resultsDir, 'eval_results.json'),
    JSON.stringify(evalResults, null, 2)
  );

  // Build summary.md
  const date = new Date().toISOString().split('T')[0];
  let md = `# DevDecks RAG Tutor Eval — ${date}\n\n`;

  md += `## 1. Retrieval Quality\n`;
  md += `| Metric | Score |\n|--------|-------|\n`;
  md += row('Context Precision', ragasAggregate.context_precision);
  md += row('Topic Hit Rate', citationAggregate.topic_hit_rate, true);
  md += row('Card Recall (strict)', citationAggregate.card_recall_strict, true);
  md += row('Card Recall (soft)', citationAggregate.card_recall_soft, true);
  md += msRow('Avg Citation Count', citationAggregate.avg_citation_count, '');
  md += '\n';

  md += `## 2. Grounding & Generation Quality\n`;
  md += `| Metric | Score |\n|--------|-------|\n`;
  md += row('Faithfulness', ragasAggregate.faithfulness);
  md += row('Response Relevancy', ragasAggregate.response_relevancy);
  md += '\n';
  md += `> Evaluated on queries where the system produced an answer (IE=false).\n\n`;

  md += `## 3. Evidence Decision Quality\n`;
  md += `| Metric | Score |\n|--------|-------|\n`;
  md += row('Answerable Acceptance Rate', citationAggregate.answerable_acceptance_rate, true);
  md += row('Unanswerable Rejection Rate', citationAggregate.unanswerable_rejection_rate, true);
  md += row('Overall Decision Accuracy', citationAggregate.evidence_decision_accuracy, true);
  md += '\n';

  md += `## 4. Latency (embedding + generation)\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += msRow('Embedding p50', latencyData.embedding_p50_ms);
  md += msRow('Embedding mean', latencyData.embedding_mean_ms);
  md += msRow('Generation p50', latencyData.generation_p50_ms);
  md += msRow('Generation mean', latencyData.generation_mean_ms);

  fs.writeFileSync(path.join(resultsDir, 'summary.md'), md);
  console.log(`Report generated:`);
  console.log(`  ${path.join(resultsDir, 'eval_results.json')}`);
  console.log(`  ${path.join(resultsDir, 'summary.md')}`);
}

function round(n) { return Math.round(n * 10000) / 10000; }

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function row(label, val, asPercent = false) {
  if (val === null || val === undefined) return `| ${label} | — |\n`;
  const display = asPercent ? `${Math.round(val * 100)}%` : val.toFixed(4);
  return `| ${label} | ${display} |\n`;
}

function msRow(label, val, unit = ' ms') {
  if (val === null || val === undefined) return `| ${label} | — |\n`;
  return `| ${label} | ${val}${unit} |\n`;
}

main();
