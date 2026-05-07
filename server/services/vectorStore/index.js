import logger from '../../utils/logger.js';
import * as bruteForce from './mongoBruteForce.js';
import * as atlasVector from './mongoAtlasVector.js';

const ADAPTERS = {
    brute: bruteForce,
    atlas: atlasVector,
};

export function getVectorStoreName() {
    const name = (process.env.VECTOR_STORE || 'brute').toLowerCase();
    return ADAPTERS[name] ? name : 'brute';
}

function getAdapter() {
    const name = getVectorStoreName();
    const adapter = ADAPTERS[name];
    if (!adapter) {
        logger?.warn?.(`Unknown VECTOR_STORE='${process.env.VECTOR_STORE}', falling back to brute`);
        return ADAPTERS.brute;
    }
    return adapter;
}

/**
 * Run a vector similarity search over Flashcards with metadata pre-filtering.
 *
 * @param {Object} params
 * @param {number[]} params.vector query embedding (must match index dimension)
 * @param {Object}   [params.filters]
 * @param {string}   [params.filters.userId] when set, also surfaces this user's private cards
 * @param {string}   [params.filters.type] flashcard type filter (e.g. 'DSA')
 * @param {string[]} [params.filters.tags]
 * @param {string[]} [params.filters.decks]
 * @param {string}   [params.filters.embeddingModel] restrict to a specific embedding model
 * @param {string}   [params.filters.status='ok'] restrict by embeddingMeta.status
 * @param {number}   [params.topK=50] candidates returned to the caller
 * @param {number}   [params.numCandidates] HNSW pool size hint for atlas (default = topK * 10)
 * @returns {Promise<Array<{ card: Object, semanticScore: number }>>}
 */
export async function semanticSearch(params) {
    const adapter = getAdapter();
    return adapter.semanticSearch(params);
}

export const vectorStore = {
    semanticSearch,
    getVectorStoreName,
};

export default vectorStore;
