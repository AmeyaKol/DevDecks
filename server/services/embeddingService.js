const DEFAULT_EMBEDDING_DIMENSION = 256;
const DEFAULT_EMBEDDING_VERSION = 'v1-hash';

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

export function embedText(text = '', dimension = DEFAULT_EMBEDDING_DIMENSION) {
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

export function chunkByHeadings({ question = '', explanation = '', problemStatement = '', code = '' }) {
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
        chunks.push({
            heading: currentHeading,
            text,
        });
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
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'for', 'and', 'or',
        'in', 'of', 'on', 'with', 'as', 'by', 'at', 'from', 'this', 'that', 'it',
    ]);

    const bag = tokenize(`${question} ${explanation}`);
    const counts = new Map();

    for (const token of bag) {
        if (token.length < 3 || stopWords.has(token)) {
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

export function buildSemanticArtifacts(payload) {
    const chunks = chunkByHeadings(payload);
    const semanticChunks = chunks.map((chunk, index) => ({
        chunkId: `chunk-${index + 1}`,
        heading: chunk.heading,
        text: chunk.text,
        vector: embedText(chunk.text),
        embeddingVersion: DEFAULT_EMBEDDING_VERSION,
    }));

    const mergedText = semanticChunks.map((chunk) => chunk.text).join('\n');
    const cardEmbedding = embedText(mergedText);
    const topics = extractTopics(payload);

    return {
        semanticChunks,
        cardEmbedding,
        embeddingVersion: DEFAULT_EMBEDDING_VERSION,
        topics,
    };
}

