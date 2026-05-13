import fs from 'fs';
import path from 'path';
import { CONFIG } from './helpers/config.js';

function main() {
  const goldSet = JSON.parse(fs.readFileSync(CONFIG.GOLD_SET_PATH, 'utf-8'));
  const responsesPath = path.join(CONFIG.RESULTS_DIR, 'rag_responses.json');

  if (!fs.existsSync(responsesPath)) {
    console.error('ERROR: rag_responses.json not found. Run collect_responses.js first.');
    process.exit(1);
  }

  const responses = JSON.parse(fs.readFileSync(responsesPath, 'utf-8'));
  const responseMap = Object.fromEntries(responses.map(r => [r.id, r]));

  // Load corpus for deck membership lookup
  const corpus = JSON.parse(fs.readFileSync(CONFIG.CORPUS_PATH, 'utf-8'));
  const cardDeckMap = Object.fromEntries(corpus.cards.map(c => [c.id, c.deckName]));
  const deckIdToName = {};
  corpus.cards.forEach(c => { if (c.deckId) deckIdToName[c.deckId] = c.deckName; });

  const perQuery = [];
  let topicHits = 0, topicTotal = 0;
  let cardHitsStrict = 0, cardTotalStrict = 0;
  let cardHitsSoft = 0, cardTotalSoft = 0;
  const citationCounts = [];

  // Evidence decision tracking
  let edCorrect = 0, edTotal = 0;
  let answerableTotal = 0, answerableAccepted = 0;
  let unanswerableTotal = 0, unanswerableRejected = 0;

  for (const gold of goldSet) {
    const resp = responseMap[gold.id];
    if (!resp) {
      console.warn(`  WARN: No response for ${gold.id}, skipping`);
      continue;
    }

    const isAnswerable = gold.expected_behavior === 'answer_with_citations';
    const ie = resp.insufficientEvidence === true;

    // Evidence decision for every query
    edTotal++;
    if (isAnswerable) {
      answerableTotal++;
      if (!ie) { answerableAccepted++; edCorrect++; }
    } else {
      unanswerableTotal++;
      if (ie) { unanswerableRejected++; edCorrect++; }
    }

    if (!isAnswerable) {
      perQuery.push({
        id: gold.id,
        query_type: gold.query_type,
        type: 'insufficient_evidence',
        expected_ie: true,
        actual_ie: ie,
        evidence_decision: ie ? 'correct' : 'false_positive'
      });
      continue;
    }

    // Extract returned topics and cards from citations
    const returnedTopics = new Set();
    const returnedCardIds = new Set();
    const citCount = (resp.citations_raw || []).length;
    citationCounts.push(citCount);

    for (const cit of (resp.citations_raw || [])) {
      if (cit.flashcardId) returnedCardIds.add(cit.flashcardId);
      for (const tn of (cit.topicNodes || [])) {
        if (tn.topic && typeof tn.topic === 'string') returnedTopics.add(tn.topic.toLowerCase());
      }
    }

    // Topic hit rate — exact case-insensitive match (expected_topics are graph-valid DB strings)
    let queryTopicHits = 0;
    for (const expected of (gold.expected_topics || [])) {
      topicTotal++;
      if (returnedTopics.has(expected.toLowerCase())) {
        queryTopicHits++;
        topicHits++;
      }
    }

    // Card recall — strict (exact ID match, only for queries with expected_card_ids)
    let queryCardHitsStrict = 0;
    const expectedCards = gold.expected_card_ids || [];
    if (expectedCards.length > 0) {
      for (const expected of expectedCards) {
        cardTotalStrict++;
        if (returnedCardIds.has(expected)) {
          queryCardHitsStrict++;
          cardHitsStrict++;
        }
      }
    }

    // Card recall — soft (any returned card from expected deck)
    let queryCardHitSoft = false;
    const expectedDecks = gold.expected_deck_names || (gold.expected_deck_name ? [gold.expected_deck_name] : []);
    if (expectedDecks.length > 0) {
      cardTotalSoft++;
      const citations = resp.citations_raw || [];
      const deckMatch = citations.some(cit => {
        if (!cit.flashcardId) return false;
        const deckFromCorpus = cardDeckMap[cit.flashcardId];
        if (deckFromCorpus) return expectedDecks.includes(deckFromCorpus);
        const deckFromCitation = cit.deckId ? deckIdToName[cit.deckId] : null;
        return deckFromCitation && expectedDecks.includes(deckFromCitation);
      });
      if (deckMatch) {
        queryCardHitSoft = true;
        cardHitsSoft++;
      }
    }

    perQuery.push({
      id: gold.id,
      query_type: gold.query_type,
      type: 'answer_with_citations',
      citation_count: citCount,
      topic_hit_rate: (gold.expected_topics || []).length > 0
        ? queryTopicHits / gold.expected_topics.length : null,
      card_recall_strict: expectedCards.length > 0
        ? queryCardHitsStrict / expectedCards.length : null,
      card_recall_soft: queryCardHitSoft,
      returned_topics: [...returnedTopics],
      returned_card_ids: [...returnedCardIds],
      evidence_decision: ie ? 'false_negative' : 'correct'
    });
  }

  const avgCitations = citationCounts.length > 0
    ? round(citationCounts.reduce((a, b) => a + b, 0) / citationCounts.length) : null;

  const result = {
    per_query: perQuery,
    aggregate: {
      avg_citation_count: avgCitations,
      topic_hit_rate: topicTotal > 0 ? round(topicHits / topicTotal) : null,
      card_recall_strict: cardTotalStrict > 0 ? round(cardHitsStrict / cardTotalStrict) : null,
      card_recall_soft: cardTotalSoft > 0 ? round(cardHitsSoft / cardTotalSoft) : null,
      answerable_acceptance_rate: answerableTotal > 0 ? round(answerableAccepted / answerableTotal) : null,
      unanswerable_rejection_rate: unanswerableTotal > 0 ? round(unanswerableRejected / unanswerableTotal) : null,
      evidence_decision_accuracy: edTotal > 0 ? round(edCorrect / edTotal) : null
    }
  };

  const outPath = path.join(CONFIG.RESULTS_DIR, 'citation_scores.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`Citation & evidence scores written to ${outPath}`);
  console.log(`  --- Retrieval Quality ---`);
  console.log(`  Avg citation count: ${result.aggregate.avg_citation_count}`);
  console.log(`  Topic hit rate: ${result.aggregate.topic_hit_rate}`);
  console.log(`  Card recall (strict): ${result.aggregate.card_recall_strict}`);
  console.log(`  Card recall (soft): ${result.aggregate.card_recall_soft}`);
  console.log(`  --- Evidence Decision Quality ---`);
  console.log(`  Answerable acceptance rate: ${result.aggregate.answerable_acceptance_rate} (${answerableAccepted}/${answerableTotal})`);
  console.log(`  Unanswerable rejection rate: ${result.aggregate.unanswerable_rejection_rate} (${unanswerableRejected}/${unanswerableTotal})`);
  console.log(`  Overall evidence decision accuracy: ${result.aggregate.evidence_decision_accuracy} (${edCorrect}/${edTotal})`);
}

function round(n) { return Math.round(n * 10000) / 10000; }

main();
