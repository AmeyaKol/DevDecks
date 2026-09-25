import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import Flashcard from '../../models/Flashcard.js';
import { reindexCards } from '../../services/embeddingPipeline.js';
import { registerUser } from '../utils/testUtils.js';

// Force the deterministic hash provider so embeddingMeta.status is reliably 'ok'
// (the write path silently falls back to 'pending' when Gemini is unreachable,
// which would make the skip-guard assertions provider-dependent).
describe('IR performance: update path + timestamp integrity', () => {
    let originalProvider;
    let token;

    beforeAll(() => {
        originalProvider = process.env.EMBEDDING_PROVIDER;
        process.env.EMBEDDING_PROVIDER = 'hash';
    });

    // setup.js truncates every collection after each test, so the user (and its
    // token) has to be re-created per test.
    beforeEach(async () => {
        const reg = await registerUser({
            username: `irperf_${Date.now()}`,
            email: `irperf_${Date.now()}@example.com`,
        });
        token = reg.body.token;
    });

    afterAll(() => {
        if (originalProvider === undefined) {
            delete process.env.EMBEDDING_PROVIDER;
        } else {
            process.env.EMBEDDING_PROVIDER = originalProvider;
        }
    });

    const createCard = async (over = {}) => {
        const res = await request(app)
            .post('/api/flashcards')
            .set('Authorization', `Bearer ${token}`)
            .send({
                question: 'What is a heap?',
                explanation: 'A tree-based priority structure.',
                type: 'DSA',
                tags: ['ds'],
                ...over,
            });
        expect(res.status).toBe(201);
        return res.body;
    };

    it('does not rebuild embeddings when a PUT leaves embedded content unchanged', async () => {
        const card = await createCard();
        expect(card.embeddingMeta.status).toBe('ok');

        const put = await request(app)
            .put(`/api/flashcards/${card._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ isPublic: false });
        expect(put.status).toBe(200);

        expect(put.body.isPublic).toBe(false);
        expect(put.body.embeddingMeta.contentHash).toBe(card.embeddingMeta.contentHash);
        expect(put.body.embeddingMeta.embeddedAt).toBe(card.embeddingMeta.embeddedAt);
    });

    it('rebuilds embeddings and advances updatedAt when explanation changes', async () => {
        const card = await createCard();

        const put = await request(app)
            .put(`/api/flashcards/${card._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ explanation: 'A complete binary tree that honours the heap property at every node.' });
        expect(put.status).toBe(200);

        expect(put.body.embeddingMeta.contentHash).not.toBe(card.embeddingMeta.contentHash);
        expect(new Date(put.body.updatedAt).getTime())
            .toBeGreaterThan(new Date(put.body.createdAt).getTime());
    });

    it('reindexCards leaves updatedAt untouched (a reindex is not a user edit)', async () => {
        const card = await createCard();
        const before = await Flashcard.findById(card._id).lean();

        const result = await reindexCards({
            filter: { _id: new mongoose.Types.ObjectId(card._id) },
            force: true,
        });
        expect(result.processed).toBe(1);

        const after = await Flashcard.findById(card._id).lean();
        expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
        expect(after.embeddingMeta.embeddedAt.getTime())
            .toBeGreaterThanOrEqual(before.embeddingMeta.embeddedAt.getTime());
    });
});
