import Flashcard from '../../models/Flashcard.js';
import { cosineSimilarity } from '../embeddingService.js';

const CARD_PROJECTION = 'question explanation problemStatement type tags semanticChunks cardEmbedding topicNodes user isPublic createdAt embeddingVersion embeddingMeta';

function buildMongoQuery(filters = {}) {
    const query = {};
    if (filters.userId) {
        query.$or = [{ isPublic: true }, { user: filters.userId }];
    } else {
        query.isPublic = true;
    }
    if (filters.type && filters.type !== 'All') {
        query.type = filters.type;
    }
    if (Array.isArray(filters.tags) && filters.tags.length) {
        query.tags = { $all: filters.tags };
    }
    if (Array.isArray(filters.decks) && filters.decks.length) {
        query.decks = { $in: filters.decks };
    }
    if (filters.embeddingModel) {
        query['embeddingMeta.model'] = filters.embeddingModel;
    }
    if (filters.status) {
        query['embeddingMeta.status'] = filters.status;
    }
    return query;
}

export async function fetchCandidates({ filters = {}, limit = 1000 } = {}) {
    const mongoQuery = buildMongoQuery(filters);
    const cursor = Flashcard.find(mongoQuery).select(CARD_PROJECTION);
    if (limit && Number.isFinite(limit)) {
        cursor.limit(limit);
    }
    return cursor.lean();
}

export async function semanticSearch({
    vector,
    filters = {},
    topK = 50,
} = {}) {
    if (!Array.isArray(vector) || !vector.length) {
        return [];
    }

    const cards = await fetchCandidates({ filters, limit: 5000 });
    const scored = cards.map((card) => ({
        card,
        semanticScore: cosineSimilarity(vector, card.cardEmbedding || []),
    }));

    scored.sort((a, b) => b.semanticScore - a.semanticScore);
    return scored.slice(0, Math.max(1, topK));
}

export const adapterName = 'brute';
