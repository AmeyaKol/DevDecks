import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';

export const EMBEDDING_VERSION_HASH = 'v1-hash';
export const EMBEDDING_VERSION_GEMINI = 'v2-gemini-embedding-001';
export const HASH_DIMENSION = 256;
export const GEMINI_DIMENSION = 768;
export const GEMINI_DEFAULT_MODEL = 'gemini-embedding-001';

const GEMINI_BATCH_SIZE = 100;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;
const RATE_LIMIT_BASE_DELAY_MS = 2000;

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'for', 'and', 'or',
    'in', 'of', 'on', 'with', 'as', 'by', 'at', 'from', 'this', 'that', 'it',
]);

let cachedGeminiClient = null;

export function getEmbeddingProvider() {
    const provider = (process.env.EMBEDDING_PROVIDER || 'gemini').toLowerCase();
    return provider === 'hash' ? 'hash' : 'gemini';
}

export function getEmbeddingModelName() {
    if (getEmbeddingProvider() === 'hash') {    
        return EMBEDDING_VERSION_HASH;
    }
    return process.env.EMBEDDING_MODEL || GEMINI_DEFAULT_MODEL;
}

export function getEmbeddingVersion() {
    return getEmbeddingProvider() === 'hash' ? EMBEDDING_VERSION_HASH : EMBEDDING_VERSION_GEMINI;
}

export function getEmbeddingDimension() {
    if (getEmbeddingProvider() === 'hash') {
        return HASH_DIMENSION;
    }
    const fromEnv = Number(process.env.EMBEDDING_DIMENSION);
    return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : GEMINI_DIMENSION;
}

function normalizeText(text = '') {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(text = '') {
    const normalized = normalizeText(text);
    if (!normalized) {
        return [];
    }
    return normalized.split(' ').filter(Boolean);
}

function hashToken(token, seed = 0) {
    let hash = 2166136261 ^ seed;
    for (let i = 0; i < token.length; i += 1) {
        hash ^= token.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
}

function l2Normalize(vector) {
    const sumSquares = vector.reduce((sum, value) => sum + (value * value), 0);
    if (sumSquares === 0) {
        return vector;
    }
    const magnitude = Math.sqrt(sumSquares);
    return vector.map((value) => value / magnitude);
}

export function embedTextHash(text = '', dimension = HASH_DIMENSION) {
    const tokens = tokenize(text);
    const vector = new Array(dimension).fill(0);

    if (!tokens.length) {
        return vector;
    }

    for (const token of tokens) {
        const index = hashToken(token) % dimension;
        const sign = (hashToken(token, 17) % 2) === 0 ? 1 : -1;
        vector[index] += sign;
    }

    return l2Normalize(vector);
}

export function cosineSimilarity(left = [], right = []) {
    if (!left.length || !right.length || left.length !== right.length) {
        return 0;
    }

    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;

    for (let i = 0; i < left.length; i += 1) {
        const l = left[i];
        const r = right[i];
        dot += l * r;
        leftNorm += l * l;
        rightNorm += r * r;
    }

    if (!leftNorm || !rightNorm) {
        return 0;
    }

    return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return null;
    }
    if (!cachedGeminiClient) {
        cachedGeminiClient = new GoogleGenerativeAI(apiKey);
    }
    return cachedGeminiClient;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err) {
    const message = err?.message || '';
    return /429|rate.?limit|quota|resource[_ -]?exhausted/i.test(message);
}

async function geminiBatchEmbed(texts, taskType, modelName, dimension) {
    const client = getGeminiClient();
    if (!client) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    const model = client.getGenerativeModel({ model: modelName });
    const requests = texts.map((text) => ({
        content: { role: 'user', parts: [{ text: text && text.length ? text : ' ' }] },
        taskType,
        ...(dimension ? { outputDimensionality: dimension } : {}),
    }));

    let attempt = 0;
    while (true) {
        try {
            const response = await model.batchEmbedContents({ requests });
            const raw = (response.embeddings || []).map((e) => e?.values || []);
            return raw.map((v) => l2Normalize(v));
        } catch (err) {
            attempt += 1;
            if (attempt >= MAX_RETRIES) {
                throw err;
            }
            const base = isRateLimitError(err) ? RATE_LIMIT_BASE_DELAY_MS : BASE_RETRY_DELAY_MS;
            const delay = base * (2 ** (attempt - 1));
            logger?.warn?.('Gemini embed retry', {
                attempt,
                delay,
                rateLimit: isRateLimitError(err),
                message: err?.message,
            });
            await sleep(delay);
        }
    }
}

export async function embedTexts(texts = [], { taskType = 'RETRIEVAL_DOCUMENT' } = {}) {
    const safeTexts = (Array.isArray(texts) ? texts : []).map((t) => (t == null ? '' : String(t)));
    const provider = getEmbeddingProvider();

    const fallback = (reason) => ({
        vectors: safeTexts.map((t) => embedTextHash(t)),
        dimension: HASH_DIMENSION,
        model: EMBEDDING_VERSION_HASH,
        version: EMBEDDING_VERSION_HASH,
        usedFallback: provider !== 'hash',
        fallbackReason: reason || null,
    });

    if (provider === 'hash') {
        return fallback(null);
    }

    if (!process.env.GEMINI_API_KEY) {
        logger?.warn?.('Gemini embedding requested but GEMINI_API_KEY is missing; falling back to hash');
        return fallback('missing_api_key');
    }

    if (!safeTexts.length) {
        return {
            vectors: [],
            dimension: getEmbeddingDimension(),
            model: getEmbeddingModelName(),
            version: EMBEDDING_VERSION_GEMINI,
            usedFallback: false,
            fallbackReason: null,
        };
    }

    const modelName = getEmbeddingModelName();
    const dimension = getEmbeddingDimension();
    try {
        const allVectors = [];
        for (let i = 0; i < safeTexts.length; i += GEMINI_BATCH_SIZE) {
            const batch = safeTexts.slice(i, i + GEMINI_BATCH_SIZE);
            const batchVectors = await geminiBatchEmbed(batch, taskType, modelName, dimension);
            for (const vec of batchVectors) {
                allVectors.push(vec);
            }
        }
        return {
            vectors: allVectors,
            dimension: allVectors[0]?.length || dimension,
            model: modelName,
            version: EMBEDDING_VERSION_GEMINI,
            usedFallback: false,
            fallbackReason: null,
        };
    } catch (err) {
        logger?.error?.('Gemini batch embed failed', { message: err?.message });
        throw err;
    }
}

export async function embedText(text = '', opts) {
    const result = await embedTexts([text], opts);
    return {
        vector: result.vectors[0] || [],
        dimension: result.dimension,
        model: result.model,
        version: result.version,
        usedFallback: result.usedFallback,
        fallbackReason: result.fallbackReason,
    };
}

export function embedTextSync(text = '') {
    return embedTextHash(text);
}

function hashContent(parts) {
    const h = crypto.createHash('sha256');
    h.update(parts.filter((p) => p != null).map((p) => String(p)).join('\u0001'));
    return h.digest('hex');
}

export function computeCardContentHash({
    question = '',
    explanation = '',
    problemStatement = '',
    code = '',
    tags = [],
} = {}) {
    const normalizedTags = (tags || []).map((t) => String(t).trim()).sort();
    return hashContent([
        normalizeText(question),
        normalizeText(problemStatement),
        normalizeText(explanation),
        code || '',
        normalizedTags.join(','),
    ]);
}

function computeChunkContentHash(text = '') {
    return crypto.createHash('sha1').update(String(text)).digest('hex');
}

function buildChunkId({ cardId, heading, chunkIndex, chunkContentHash }) {
    return crypto
        .createHash('sha1')
        .update(`${cardId || 'no-card'}|${heading || 'general'}|${chunkIndex}|${chunkContentHash}`)
        .digest('hex')
        .slice(0, 12);
}

export function chunkByHeadings({
    question = '',
    explanation = '',
    problemStatement = '',
    code = '',
}) {
    const body = [question, problemStatement, explanation, code].filter(Boolean).join('\n\n');
    const lines = body.split('\n');
    const chunks = [];
    let currentHeading = 'general';
    let currentLines = [];

    const flushChunk = () => {
        const text = currentLines.join('\n').trim();
        if (!text) {
            return;
        }
        chunks.push({ heading: currentHeading, text });
        currentLines = [];
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) {
            flushChunk();
            currentHeading = trimmed.replace(/^#+\s*/, '').trim() || 'section';
        } else {
            currentLines.push(line);
        }
    }
    flushChunk();

    if (!chunks.length && body.trim()) {
        chunks.push({ heading: 'general', text: body.trim() });
    }

    return chunks;
}

export function extractTopics({ question = '', explanation = '', tags = [] }) {
    const bag = tokenize(`${question} ${explanation}`);
    const counts = new Map();

    for (const token of bag) {
        if (token.length < 3 || STOP_WORDS.has(token)) {
            continue;
        }
        counts.set(token, (counts.get(token) || 0) + 1);
    }

    for (const tag of tags || []) {
        const normalizedTag = normalizeText(tag);
        if (normalizedTag) {
            counts.set(normalizedTag, (counts.get(normalizedTag) || 0) + 3);
        }
    }

    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([topic, score]) => ({ topic, confidence: Math.min(1, score / 6) }));
}

/**
 * Build semantic artifacts (chunks + embeddings + topics) for a single card.
 *
 * Calls Gemini in a single batch request that contains the card's merged text
 * plus each chunk's text. On Gemini failure it propagates the error so the
 * caller (write path or pipeline) can decide how to degrade.
 *
 * @param {Object} payload card text fields
 * @param {Object} [opts]
 * @param {string|Object} [opts.cardId] used to derive deterministic chunk IDs
 * @param {boolean} [opts.allowFallback] if true, on Gemini failure the function
 *   returns hash-based artifacts with embeddingMeta.status='pending' instead of
 *   throwing. Used by the synchronous write path.
 */
export async function buildSemanticArtifacts(payload, { cardId = null, allowFallback = false } = {}) {
    const {
        question = '',
        explanation = '',
        problemStatement = '',
        code = '',
        tags = [],
    } = payload || {};

    const contentHash = computeCardContentHash({ question, explanation, problemStatement, code, tags });
    const chunks = chunkByHeadings({ question, explanation, problemStatement, code });

    const cardIdStr = cardId ? String(cardId) : '';

    const chunkMeta = chunks.map((chunk, index) => {
        const chunkContentHash = computeChunkContentHash(chunk.text);
        return {
            heading: chunk.heading,
            text: chunk.text,
            chunkContentHash,
            chunkId: buildChunkId({
                cardId: cardIdStr,
                heading: chunk.heading,
                chunkIndex: index,
                chunkContentHash,
            }),
        };
    });

    const mergedCardText = chunkMeta.map((c) => c.text).join('\n');
    const textsToEmbed = [mergedCardText, ...chunkMeta.map((c) => c.text)];

    let embedResult;
    let degraded = false;
    let degradedReason = null;
    try {
        embedResult = await embedTexts(textsToEmbed, { taskType: 'RETRIEVAL_DOCUMENT' });
    } catch (err) {
        if (!allowFallback) {
            throw err;
        }
        degraded = true;
        degradedReason = err?.message || 'gemini_failed';
        embedResult = {
            vectors: textsToEmbed.map((t) => embedTextHash(t)),
            dimension: HASH_DIMENSION,
            model: EMBEDDING_VERSION_HASH,
            version: EMBEDDING_VERSION_HASH,
            usedFallback: true,
            fallbackReason: degradedReason,
        };
    }

    const status = degraded || embedResult.usedFallback ? 'pending' : 'ok';
    const errorMessage = degraded ? degradedReason : (embedResult.fallbackReason || '');
    const embeddedAt = new Date();

    const cardEmbedding = embedResult.vectors[0] || [];
    const chunkVectors = embedResult.vectors.slice(1);

    const semanticChunks = chunkMeta.map((meta, index) => ({
        chunkId: meta.chunkId,
        heading: meta.heading,
        text: meta.text,
        vector: chunkVectors[index] || [],
        embeddingVersion: embedResult.version,
        embeddingMeta: {
            contentHash: meta.chunkContentHash,
            embeddedAt,
            model: embedResult.model,
            dimension: (chunkVectors[index] || []).length || embedResult.dimension,
            status,
            error: errorMessage,
        },
    }));

    const topics = extractTopics({ question, explanation, tags });

    return {
        contentHash,
        embeddingVersion: embedResult.version,
        cardEmbedding,
        embeddingMeta: {
            contentHash,
            embeddedAt,
            model: embedResult.model,
            dimension: cardEmbedding.length || embedResult.dimension,
            status,
            error: errorMessage,
        },
        semanticChunks,
        topics,
        usedFallback: Boolean(embedResult.usedFallback || degraded),
        fallbackReason: errorMessage || null,
    };
}
