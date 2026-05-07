import {
    embedText,
    embedTexts,
    embedTextHash,
    cosineSimilarity,
    computeCardContentHash,
    buildSemanticArtifacts,
    chunkByHeadings,
    extractTopics,
    getEmbeddingProvider,
    getEmbeddingVersion,
    getEmbeddingDimension,
    HASH_DIMENSION,
    EMBEDDING_VERSION_HASH,
} from '../../../services/embeddingService.js';

const baseCard = {
    question: 'What is the time complexity of binary search?',
    explanation: '# Overview\nO(log n) on a sorted array.\n# Why\nHalves the search space each step.',
    problemStatement: 'Given a sorted array, find target.',
    code: 'def search(a, t): ...',
    tags: ['dsa', 'binary search'],
};

describe('embeddingService', () => {
    let originalProvider;

    beforeAll(() => {
        originalProvider = process.env.EMBEDDING_PROVIDER;
        process.env.EMBEDDING_PROVIDER = 'hash';
    });

    afterAll(() => {
        if (originalProvider === undefined) {
            delete process.env.EMBEDDING_PROVIDER;
        } else {
            process.env.EMBEDDING_PROVIDER = originalProvider;
        }
    });

    describe('provider selection', () => {
        it('routes to the hash provider when configured', () => {
            expect(getEmbeddingProvider()).toBe('hash');
            expect(getEmbeddingVersion()).toBe(EMBEDDING_VERSION_HASH);
            expect(getEmbeddingDimension()).toBe(HASH_DIMENSION);
        });
    });

    describe('embedTextHash', () => {
        it('returns a unit-norm vector of the requested dimension', () => {
            const v = embedTextHash('binary search complexity');
            expect(v).toHaveLength(HASH_DIMENSION);
            const magnitude = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
            expect(magnitude).toBeCloseTo(1, 5);
        });

        it('returns the zero vector for empty input', () => {
            const v = embedTextHash('');
            expect(v).toHaveLength(HASH_DIMENSION);
            expect(v.every((x) => x === 0)).toBe(true);
        });

        it('is deterministic across calls', () => {
            const a = embedTextHash('hello world');
            const b = embedTextHash('hello world');
            expect(a).toEqual(b);
        });
    });

    describe('embedTexts (hash provider)', () => {
        it('returns one vector per input', async () => {
            const result = await embedTexts(['alpha', 'beta', 'gamma']);
            expect(result.vectors).toHaveLength(3);
            expect(result.dimension).toBe(HASH_DIMENSION);
            expect(result.version).toBe(EMBEDDING_VERSION_HASH);
            expect(result.usedFallback).toBe(false);
        });

        it('embedText returns a single vector and metadata', async () => {
            const r = await embedText('hello');
            expect(r.vector).toHaveLength(HASH_DIMENSION);
            expect(r.version).toBe(EMBEDDING_VERSION_HASH);
        });
    });

    describe('cosineSimilarity', () => {
        it('returns 1 for identical non-zero vectors and 0 for orthogonal', () => {
            expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
            expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 5);
        });

        it('returns 0 on length mismatch or zero vector', () => {
            expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
            expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
        });
    });

    describe('computeCardContentHash', () => {
        it('is deterministic across runs for identical input', () => {
            const a = computeCardContentHash(baseCard);
            const b = computeCardContentHash(baseCard);
            expect(a).toEqual(b);
            expect(a).toMatch(/^[a-f0-9]{64}$/);
        });

        it('changes when any tracked field changes', () => {
            const original = computeCardContentHash(baseCard);
            expect(computeCardContentHash({ ...baseCard, question: 'completely different question text' }))
                .not.toEqual(original);
            expect(computeCardContentHash({ ...baseCard, explanation: 'different explanation entirely' }))
                .not.toEqual(original);
            expect(computeCardContentHash({ ...baseCard, code: '' }))
                .not.toEqual(original);
            expect(computeCardContentHash({ ...baseCard, tags: ['other'] }))
                .not.toEqual(original);
        });

        it('is invariant to punctuation-only changes (driven by normalization)', () => {
            const a = computeCardContentHash({ ...baseCard, question: 'what is binary search?' });
            const b = computeCardContentHash({ ...baseCard, question: 'what is binary search!' });
            expect(a).toEqual(b);
        });

        it('is stable under tag reordering', () => {
            const a = computeCardContentHash({ ...baseCard, tags: ['dsa', 'binary search'] });
            const b = computeCardContentHash({ ...baseCard, tags: ['binary search', 'dsa'] });
            expect(a).toEqual(b);
        });
    });

    describe('chunkByHeadings', () => {
        it('splits on markdown headings and keeps a default general chunk', () => {
            const chunks = chunkByHeadings({
                question: 'q',
                explanation: '# A\nfirst\n# B\nsecond',
            });
            const headings = chunks.map((c) => c.heading);
            expect(headings).toContain('A');
            expect(headings).toContain('B');
            expect(chunks.length).toBeGreaterThanOrEqual(3);
        });

        it('returns a single general chunk when no headings present', () => {
            const chunks = chunkByHeadings({ question: 'q', explanation: 'plain text body' });
            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks[0].heading).toBe('general');
        });
    });

    describe('extractTopics', () => {
        it('weights tags higher than body tokens', () => {
            const topics = extractTopics({
                question: 'merge sort algorithm with merge step',
                explanation: 'merge sort is divide and conquer',
                tags: ['recursion'],
            });
            const topicNames = topics.map((t) => t.topic);
            expect(topicNames).toContain('recursion');
        });
    });

    describe('buildSemanticArtifacts', () => {
        it('produces deterministic chunk IDs for the same card payload', async () => {
            const cardId = '507f1f77bcf86cd799439011';
            const a = await buildSemanticArtifacts(baseCard, { cardId });
            const b = await buildSemanticArtifacts(baseCard, { cardId });

            expect(a.semanticChunks.map((c) => c.chunkId))
                .toEqual(b.semanticChunks.map((c) => c.chunkId));
            expect(a.contentHash).toEqual(b.contentHash);
            expect(a.embeddingMeta.contentHash).toEqual(a.contentHash);
        });

        it('marks status=ok for the hash provider (no fallback)', async () => {
            const r = await buildSemanticArtifacts(baseCard, { cardId: 'abc' });
            expect(r.embeddingMeta.status).toBe('ok');
            expect(r.embeddingMeta.model).toBe(EMBEDDING_VERSION_HASH);
            expect(r.embeddingMeta.dimension).toBe(HASH_DIMENSION);
            expect(r.semanticChunks.every((c) => c.embeddingMeta.status === 'ok')).toBe(true);
        });

        it('changes chunk IDs for chunks whose content actually changes', async () => {
            const a = await buildSemanticArtifacts(baseCard, { cardId: 'same' });
            const mutated = {
                ...baseCard,
                explanation: '# Overview\nradically different overview content with new info',
            };
            const b = await buildSemanticArtifacts(mutated, { cardId: 'same' });

            const aOverview = a.semanticChunks.find((c) => c.heading === 'Overview');
            const bOverview = b.semanticChunks.find((c) => c.heading === 'Overview');
            expect(aOverview).toBeDefined();
            expect(bOverview).toBeDefined();
            expect(aOverview.chunkId).not.toEqual(bOverview.chunkId);
        });

        it('produces same-dimension vectors for card and chunks', async () => {
            const r = await buildSemanticArtifacts(baseCard, { cardId: 'x' });
            expect(r.cardEmbedding).toHaveLength(HASH_DIMENSION);
            for (const chunk of r.semanticChunks) {
                expect(chunk.vector).toHaveLength(HASH_DIMENSION);
            }
        });
    });
});
