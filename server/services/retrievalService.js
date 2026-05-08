import { embedTexts, cosineSimilarity } from './embeddingService.js';
import * as vectorStore from './vectorStore/index.js';
import * as bruteForce from './vectorStore/mongoBruteForce.js';

const DEFAULT_LEXICAL_WEIGHT = 0.45;
const DEFAULT_SEMANTIC_WEIGHT = 0.55;
const SEMANTIC_OVERSAMPLE = 4;

function normalize(value = '') {
    return value.toLowerCase().trim();
}

function lexicalScore(query, card) {
    const q = normalize(query);
    if (!q) {
        return 0;
    }
    const text = normalize(`${card.question} ${card.problemStatement || ''} ${card.explanation || ''}`);
    if (!text) {
        return 0;
    }

    let score = 0;
    if (text.includes(q)) {
        score += 1;
    }

    const terms = q.split(/\s+/).filter(Boolean);
    for (const term of terms) {
        if (text.includes(term)) {
            score += 0.15;
        }
    }

    return Math.min(1, score);
}

function maxChunkSimilarity(queryVector, semanticChunks = []) {
    if (!semanticChunks.length || !queryVector?.length) {
        return 0;
    }
    let maxScore = 0;
    for (const chunk of semanticChunks) {
        const score = cosineSimilarity(queryVector, chunk.vector || []);
        if (score > maxScore) {
            maxScore = score;
        }
    }
    return maxScore;
}

function buildFilters({ userId, type }) {
    return {
        userId: userId ? String(userId) : null,
        type: type && type !== 'All' ? type : null,
    };
}

export async function hybridSearch({
    userId,
    query,
    mode = 'hybrid',
    topK = 8,
    type,
    deckId,
}) {
    const safeMode = ['keyword', 'semantic', 'hybrid'].includes(mode) ? mode : 'hybrid';
    const safeTopK = Math.min(Math.max(Number(topK) || 8, 1), 50);
    const filters = buildFilters({ userId, type });
    if (deckId) {
        filters.decks = [String(deckId)];
    }

    let queryVector = null;
    if (safeMode !== 'keyword') {
        const embedded = await embedTexts([query], { taskType: 'RETRIEVAL_QUERY' });
        queryVector = embedded.vectors[0] || null;
    }

    let candidates = [];
    if (safeMode === 'keyword') {
        const cards = await bruteForce.fetchCandidates({ filters, limit: 5000 });
        candidates = cards.map((card) => ({ card, semanticScore: 0 }));
    } else {
        const fetchK = safeTopK * SEMANTIC_OVERSAMPLE;
        const semantic = await vectorStore.semanticSearch({
            vector: queryVector,
            filters,
            topK: fetchK,
            numCandidates: Math.max(fetchK * 5, 100),
        });
        if (semantic.length) {
            candidates = semantic;
        } else {
            const cards = await bruteForce.fetchCandidates({ filters, limit: 5000 });
            candidates = cards.map((card) => ({ card, semanticScore: 0 }));
        }
    }

    const scored = candidates.map(({ card, semanticScore }) => {
        const lexical = lexicalScore(query, card);
        const semanticChunk = queryVector ? maxChunkSimilarity(queryVector, card.semanticChunks) : 0;
        const semantic = Math.max(semanticScore || 0, semanticChunk);

        let finalScore = lexical;
        if (safeMode === 'semantic') {
            finalScore = semantic;
        } else if (safeMode === 'hybrid') {
            finalScore = (DEFAULT_LEXICAL_WEIGHT * lexical) + (DEFAULT_SEMANTIC_WEIGHT * semantic);
        }

        return {
            ...card,
            retrieval: {
                mode: safeMode,
                lexicalScore: Number(lexical.toFixed(4)),
                semanticScore: Number(semantic.toFixed(4)),
                finalScore: Number(finalScore.toFixed(4)),
                sourceType: 'flashcard',
            },
        };
    });

    return scored
        .sort((a, b) => b.retrieval.finalScore - a.retrieval.finalScore)
        .slice(0, safeTopK);
}

function firstDeckId(card) {
    const decks = card?.decks;
    if (!Array.isArray(decks) || !decks.length) return null;
    const d = decks[0];
    if (typeof d === 'string') return d;
    return d?._id ? String(d._id) : null;
}

export function buildCitations(results = []) {
    return results.map((result, index) => ({
        citationId: `C${index + 1}`,
        flashcardId: result._id,
        question: result.question,
        type: result.type,
        score: result.retrieval?.finalScore ?? 0,
        problemStatement: result.problemStatement || '',
        explanation: result.explanation || '',
        hint: result.hint || '',
        deckId: firstDeckId(result),
        metadata: result.metadata || undefined,
        code: result.code || '',
        language: result.language || 'python',
    }));
}

export function contextFromResults(results = []) {
    return results.map((result, index) => (
        `[C${index + 1}] ${result.question}\n` +
        `${result.problemStatement || ''}\n` +
        `${result.explanation || ''}`
    )).join('\n\n');
}
