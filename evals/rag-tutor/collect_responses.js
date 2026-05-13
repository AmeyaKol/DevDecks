import fs from 'fs';
import path from 'path';
import { CONFIG } from './helpers/config.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY must be set.');
  process.exit(1);
}

const EMBEDDING_MODEL = 'gemini-embedding-001';
const GENERATION_MODEL = 'gemini-2.5-flash';
const TOP_K = 6;
const QUALITY_THRESHOLD = 0.10;

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function embedQuery(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 3072
    })
  });
  if (!res.ok) throw new Error(`Embed API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values;
}

async function generateAnswer(question, context, citations) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GENERATION_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const systemInstruction = `You are an IR-grounded tutor. Answer only using the provided context.

Retrieved Context:
${context}

Available Citations:
${citations.map(c => `${c.citationId}: ${c.question}`).join('\n')}

Rules:
1. Use only facts from context.
2. Cite claims inline with citation IDs like [C1].
3. Set "insufficientEvidence": false unless NONE of the context cards mention anything related to the question. If any card covers the topic even partially, answer with what is available and set insufficientEvidence to false.
4. Keep answer concise and instructional.

Return strict JSON:
{
  "answer": "response with citations",
  "confidence": "high|medium|low",
  "insufficientEvidence": false
}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `Answer the following question using the retrieved context and citations. Use code examples from context as evidence. Be concise and focus on teaching the concept.\nReturn strict JSON:\n{\n  "answer": "response with citations",\n  "confidence": "high|medium|low",\n  "insufficientEvidence": false\n}\nQuestion: ${question}.` }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { temperature: 0.3 }
    })
  });
  if (!res.ok) throw new Error(`Generation API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { answer: text, confidence: 'low', insufficientEvidence: true };
  const parsed = JSON.parse(jsonMatch[0].replace(/\\(?!["\\/bfnrtu])/g, '\\\\'));
  return {
    answer: parsed.answer || '',
    confidence: parsed.confidence || 'low',
    insufficientEvidence: Boolean(parsed.insufficientEvidence)
  };
}

async function main() {
  const goldSet = JSON.parse(fs.readFileSync(CONFIG.GOLD_SET_PATH, 'utf-8'));
  const corpus = JSON.parse(fs.readFileSync(CONFIG.CORPUS_PATH, 'utf-8'));
  const cards = corpus.cards.filter(c => Array.isArray(c.cardEmbedding) && c.cardEmbedding.length > 0);
  console.log(`Loaded ${cards.length} cards with embeddings from corpus.`);
  console.log(`Collecting responses for ${goldSet.length} queries...\n`);

  const responses = [];

  for (const item of goldSet) {
    process.stdout.write(`  [${item.id}] ${item.question.slice(0, 55)}...`);
    const totalStart = Date.now();

    try {
      const embStart = Date.now();
      const queryVec = await embedQuery(item.question);
      const embeddingMs = Date.now() - embStart;

      const scored = cards.map(card => ({
        card,
        score: cosineSimilarity(queryVec, card.cardEmbedding)
      }));
      scored.sort((a, b) => b.score - a.score);
      const topCards = scored.slice(0, TOP_K);

      const citations = topCards.map((s, i) => ({
        citationId: `C${i + 1}`,
        flashcardId: s.card.id,
        question: s.card.question,
        type: s.card.type,
        score: Number(s.score.toFixed(4)),
        explanation: s.card.snippet || '',
        code: '',
        deckId: s.card.deckId || null,
        topicNodes: (s.card.topics || []).map(t => ({
          topic: typeof t === 'string' ? t : t.topic,
          edgeType: 'related_to'
        }))
      }));

      const contexts = topCards.map((s, i) => {
        let parts = [`[C${i + 1}] ${s.card.question}`];
        if (s.card.snippet) parts.push(s.card.snippet);
        return parts.join('\n');
      });
      const contextStr = contexts.join('\n\n');

      const genStart = Date.now();
      const result = await generateAnswer(item.question, contextStr, citations);
      const generationMs = Date.now() - genStart;
      const totalMs = Date.now() - totalStart;

      responses.push({
        id: item.id,
        question: item.question,
        answer: result.answer,
        contexts,
        citations_raw: citations,
        insufficientEvidence: result.insufficientEvidence,
        confidence: result.confidence,
        latency_ms: totalMs,
        timing: { embedding_ms: embeddingMs, generation_ms: generationMs, total_ms: totalMs }
      });

      const ie = result.insufficientEvidence ? ' IE' : '';
      console.log(` ${totalMs}ms emb:${embeddingMs}ms gen:${generationMs}ms${ie}`);
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      responses.push({
        id: item.id, question: item.question, answer: '', contexts: [],
        citations_raw: [], insufficientEvidence: true,
        latency_ms: Date.now() - totalStart, error: err.message
      });
    }
  }

  const outPath = path.join(CONFIG.RESULTS_DIR, 'rag_responses.json');
  fs.writeFileSync(outPath, JSON.stringify(responses, null, 2));
  console.log(`\nWrote ${responses.length} responses to ${outPath}`);
}

main().catch(err => {
  console.error('collect_responses failed:', err.message);
  process.exit(1);
});
