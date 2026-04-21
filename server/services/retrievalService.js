import Flashcard from '../models/Flashcard.js';
import { embedText, cosineSimilarity } from './embeddingService.js';

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
    if (!semanticChunks.length) {
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

function visibilityQuery(userId) {
    if (!userId) {
        return { isPublic: true };
    }
    return {
        $or: [{ isPublic: true }, { user: userId }],
    };
}

export async function hybridSearch({
    userId,
    query,
    mode = 'hybrid',
    topK = 8,
    type,
}) {
    const mongoQuery = visibilityQuery(userId);
    if (type && type !== 'All') {
        mongoQuery.type = type;
    }

    const cards = await Flashcard.find(mongoQuery)
        .select('question explanation problemStatement type tags semanticChunks cardEmbedding topicNodes user isPublic createdAt')
        .lean();

    const queryVector = embedText(query);
    const scored = cards.map((card) => {
        const lexical = lexicalScore(query, card);
        const semanticCard = cosineSimilarity(queryVector, card.cardEmbedding || []);
        const semanticChunk = maxChunkSimilarity(queryVector, card.semanticChunks || []);
        const semantic = Math.max(semanticCard, semanticChunk);

        let finalScore = lexical;
        if (mode === 'semantic') {
            finalScore = semantic;
        } else if (mode === 'hybrid') {
            finalScore = (0.45 * lexical) + (0.55 * semantic);
        }

        return {
            ...card,
            retrieval: {
                mode,
                lexicalScore: Number(lexical.toFixed(4)),
                semanticScore: Number(semantic.toFixed(4)),
                finalScore: Number(finalScore.toFixed(4)),
                sourceType: 'flashcard',
            },
        };
    });

    return scored
        .sort((a, b) => b.retrieval.finalScore - a.retrieval.finalScore)
        .slice(0, topK);
}

export function buildCitations(results = []) {
    return results.map((result, index) => ({
        citationId: `C${index + 1}`,
        flashcardId: result._id,
        question: result.question,
        type: result.type,
        score: result.retrieval?.finalScore ?? 0,
    }));
}

export function contextFromResults(results = []) {
    return results.map((result, index) => (
        `[C${index + 1}] ${result.question}\n` +
        `${result.problemStatement || ''}\n` +
        `${result.explanation || ''}`
    )).join('\n\n');
}

