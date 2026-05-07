import mongoose from 'mongoose';
import Flashcard from '../../models/Flashcard.js';
import { reindexCards } from '../../services/embeddingPipeline.js';
import { EMBEDDING_VERSION_HASH } from '../../services/embeddingService.js';

async function seedCard(overrides = {}) {
    const card = await Flashcard.create({
        question: overrides.question || `Q ${Math.random()}`,
        explanation: overrides.explanation || 'Some explanation body without headings.',
        problemStatement: overrides.problemStatement || '',
        code: overrides.code || '',
        tags: overrides.tags || ['test'],
        type: overrides.type || 'DSA',
        user: overrides.user || new mongoose.Types.ObjectId(),
        isPublic: overrides.isPublic !== undefined ? overrides.isPublic : true,
    });
    return card;
}

describe('embeddingPipeline.reindexCards', () => {
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

    it('embeds all matching cards on first run', async () => {
        for (let i = 0; i < 5; i += 1) {
            await seedCard({ question: `binary search ${i}` });
        }

        const result = await reindexCards({});
        expect(result.processed).toBe(5);
        expect(result.skipped).toBe(0);
        expect(result.failed).toBe(0);
        expect(result.model).toBe(EMBEDDING_VERSION_HASH);

        const persisted = await Flashcard.find({}).lean();
        for (const card of persisted) {
            expect(card.embeddingMeta?.status).toBe('ok');
            expect(card.embeddingMeta?.contentHash).toMatch(/^[a-f0-9]{64}$/);
            expect(card.embeddingMeta?.model).toBe(EMBEDDING_VERSION_HASH);
            expect(Array.isArray(card.cardEmbedding)).toBe(true);
            expect(card.cardEmbedding.length).toBeGreaterThan(0);
            expect(card.semanticChunks.length).toBeGreaterThan(0);
            for (const chunk of card.semanticChunks) {
                expect(chunk.chunkId).toMatch(/^[a-f0-9]{12}$/);
            }
        }
    });

    it('skips all cards on a re-run (idempotency by contentHash + model)', async () => {
        for (let i = 0; i < 5; i += 1) {
            await seedCard({ question: `q-${i}` });
        }
        await reindexCards({});

        const second = await reindexCards({});
        expect(second.processed).toBe(0);
        expect(second.skipped).toBe(5);
        expect(second.failed).toBe(0);
    });

    it('reembeds only the mutated card when content changes', async () => {
        const cards = [];
        for (let i = 0; i < 5; i += 1) {
            cards.push(await seedCard({ question: `q-${i}` }));
        }
        await reindexCards({});

        cards[2].question = 'mutated question text';
        await cards[2].save();

        const third = await reindexCards({});
        expect(third.processed).toBe(1);
        expect(third.skipped).toBe(4);
        expect(third.failed).toBe(0);
    });

    it('reembeds everything when force is true', async () => {
        for (let i = 0; i < 3; i += 1) {
            await seedCard();
        }
        await reindexCards({});

        const forced = await reindexCards({ force: true });
        expect(forced.processed).toBe(3);
        expect(forced.skipped).toBe(0);
    });

    it('respects --dry-run by not writing to the DB', async () => {
        for (let i = 0; i < 3; i += 1) {
            await seedCard();
        }

        const dry = await reindexCards({ dryRun: true });
        expect(dry.processed).toBe(3);

        const persisted = await Flashcard.find({}).lean();
        for (const card of persisted) {
            expect(card.cardEmbedding || []).toHaveLength(0);
            expect(card.embeddingMeta?.contentHash || '').toBe('');
        }
    });

    it('honours filter to scope reindex to a single user', async () => {
        const userA = new mongoose.Types.ObjectId();
        const userB = new mongoose.Types.ObjectId();
        await seedCard({ user: userA });
        await seedCard({ user: userA });
        await seedCard({ user: userB });

        const result = await reindexCards({ filter: { user: userA } });
        expect(result.processed).toBe(2);

        const userBCard = await Flashcard.findOne({ user: userB }).lean();
        expect(userBCard?.cardEmbedding || []).toHaveLength(0);
        expect(userBCard?.embeddingMeta?.contentHash || '').toBe('');
    });
});
