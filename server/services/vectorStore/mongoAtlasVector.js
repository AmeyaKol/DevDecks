import mongoose from 'mongoose';
import Flashcard from '../../models/Flashcard.js';
import logger from '../../utils/logger.js';
import * as bruteForce from './mongoBruteForce.js';

const ATLAS_INDEX_NAME = process.env.ATLAS_VECTOR_INDEX_NAME || 'flashcard_card_vec';

function toObjectId(value) {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    try {
        return new mongoose.Types.ObjectId(value);
    } catch {
        return null;
    }
}

function toObjectIdArray(values) {
    return (values || [])
        .map(toObjectId)
        .filter(Boolean);
}

function buildAtlasFilter(filters = {}) {
    const clauses = [];

    const userObjectId = toObjectId(filters.userId);
    if (userObjectId) {
        clauses.push({
            $or: [
                { isPublic: { $eq: true } },
                { user: { $eq: userObjectId } },
            ],
        });
    } else {
        clauses.push({ isPublic: { $eq: true } });
    }

    if (filters.type && filters.type !== 'All') {
        clauses.push({ type: { $eq: filters.type } });
    }

    if (Array.isArray(filters.tags) && filters.tags.length) {
        clauses.push({ tags: { $in: filters.tags } });
    }

    const deckIds = toObjectIdArray(filters.decks);
    if (deckIds.length) {
        clauses.push({ decks: { $in: deckIds } });
    }

    if (filters.embeddingModel) {
        clauses.push({ 'embeddingMeta.model': { $eq: filters.embeddingModel } });
    }

    if (filters.status) {
        clauses.push({ 'embeddingMeta.status': { $eq: filters.status } });
    }

    if (clauses.length === 1) {
        return clauses[0];
    }
    return { $and: clauses };
}

export async function semanticSearch({
    vector,
    filters = {},
    topK = 50,
    numCandidates,
} = {}) {
    if (!Array.isArray(vector) || !vector.length) {
        return [];
    }

    const limit = Math.max(1, topK);
    const candidatePool = Math.max(numCandidates || limit * 10, 50);

    const pipeline = [
        {
            $vectorSearch: {
                index: ATLAS_INDEX_NAME,
                path: 'cardEmbedding',
                queryVector: vector,
                numCandidates: candidatePool,
                limit,
                filter: buildAtlasFilter(filters),
            },
        },
        {
            $addFields: {
                semanticScore: { $meta: 'vectorSearchScore' },
            },
        },
        {
            $project: {
                question: 1,
                explanation: 1,
                problemStatement: 1,
                type: 1,
                tags: 1,
                semanticChunks: 1,
                cardEmbedding: 1,
                topicNodes: 1,
                user: 1,
                isPublic: 1,
                createdAt: 1,
                embeddingVersion: 1,
                embeddingMeta: 1,
                semanticScore: 1,
            },
        },
    ];

    try {
        const docs = await Flashcard.aggregate(pipeline);
        return docs.map((doc) => {
            const { semanticScore, ...rest } = doc;
            return { card: rest, semanticScore: typeof semanticScore === 'number' ? semanticScore : 0 };
        });
    } catch (err) {
        logger?.warn?.('Atlas $vectorSearch failed; falling back to brute force', {
            message: err?.message,
            index: ATLAS_INDEX_NAME,
        });
        return bruteForce.semanticSearch({ vector, filters, topK });
    }
}

export const adapterName = 'atlas';
