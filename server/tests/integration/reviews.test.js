import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import CardReview from '../../models/CardReview.js';
import Flashcard from '../../models/Flashcard.js';
import { registerUser } from '../utils/testUtils.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const registerToken = async () => {
    const slug = Math.random().toString(36).slice(2, 12);
    const reg = await registerUser({ username: `srs_${slug}`, email: `srs_${slug}@example.com` });
    expect(reg.status).toBe(201);
    return reg.body.token;
};

const makeCard = async (token, over = {}) => {
    const res = await request(app).post('/api/flashcards').set(auth(token)).send({
        question: 'What is a red-black tree?',
        explanation: 'A self-balancing binary search tree with colour invariants.',
        type: 'DSA',
        isPublic: true,
        ...over,
    });
    expect(res.status).toBe(201);
    return res.body;
};

const createUserAndCard = async (opts = {}) => {
    const token = await registerToken();
    const card = await makeCard(token, { isPublic: opts.isPublic !== undefined ? opts.isPublic : true });
    return { token, cardId: card._id };
};

describe('Reviews API (SM-2)', () => {
    let originalProvider;
    beforeAll(() => {
        originalProvider = process.env.EMBEDDING_PROVIDER;
        process.env.EMBEDDING_PROVIDER = 'hash';
    });
    afterAll(() => {
        if (originalProvider === undefined) delete process.env.EMBEDDING_PROVIDER;
        else process.env.EMBEDDING_PROVIDER = originalProvider;
    });

    it('creates a schedule on first grade and steps it forward on the next', async () => {
        const { token, cardId } = await createUserAndCard();

        const first = await request(app)
            .post(`/api/reviews/${cardId}/grade`)
            .set(auth(token))
            .send({ correct: true });
        expect(first.status).toBe(200);
        expect(first.body).toMatchObject({ interval: 1, repetitions: 1, lapsed: false });
        expect(new Date(first.body.dueDate).getTime()).toBeGreaterThan(Date.now());

        const second = await request(app)
            .post(`/api/reviews/${cardId}/grade`)
            .set(auth(token))
            .send({ correct: true });
        expect(second.body).toMatchObject({ interval: 6, repetitions: 2 });

        // Upsert, not duplicate insert.
        expect(await CardReview.countDocuments({ flashcard: cardId })).toBe(1);
    });

    it('a wrong answer lapses the card and counts the lapse', async () => {
        const { token, cardId } = await createUserAndCard();

        await request(app).post(`/api/reviews/${cardId}/grade`).set(auth(token)).send({ correct: true });
        await request(app).post(`/api/reviews/${cardId}/grade`).set(auth(token)).send({ correct: true });
        const miss = await request(app)
            .post(`/api/reviews/${cardId}/grade`)
            .set(auth(token))
            .send({ correct: false });

        expect(miss.body).toMatchObject({ interval: 1, repetitions: 0, lapsed: true, lapses: 1 });
    });

    it('rejects a grade with neither `correct` nor `quality`', async () => {
        const { token, cardId } = await createUserAndCard();
        const res = await request(app).post(`/api/reviews/${cardId}/grade`).set(auth(token)).send({});
        expect(res.status).toBe(400);
    });

    it('404s when grading a card the user cannot see', async () => {
        const a = await createUserAndCard({ isPublic: false });
        const b = await createUserAndCard();

        const res = await request(app)
            .post(`/api/reviews/${a.cardId}/grade`)
            .set(auth(b.token))
            .send({ correct: true });
        expect(res.status).toBe(404);
    });

    it('404s for a well-formed id that matches no card', async () => {
        const { token } = await createUserAndCard();
        const res = await request(app)
            .post(`/api/reviews/${new mongoose.Types.ObjectId()}/grade`)
            .set(auth(token))
            .send({ correct: true });
        expect(res.status).toBe(404);
    });

    it('requires auth', async () => {
        const res = await request(app)
            .post(`/api/reviews/${new mongoose.Types.ObjectId()}/grade`)
            .send({ correct: true });
        expect(res.status).toBe(401);
    });
});

describe('GET /api/reviews/queue', () => {
    let originalProvider;
    beforeAll(() => {
        originalProvider = process.env.EMBEDDING_PROVIDER;
        process.env.EMBEDDING_PROVIDER = 'hash';
    });
    afterAll(() => {
        if (originalProvider === undefined) delete process.env.EMBEDDING_PROVIDER;
        else process.env.EMBEDDING_PROVIDER = originalProvider;
    });

    const queue = (token, qs = '') =>
        request(app).get(`/api/reviews/queue${qs}`).set(auth(token));

    const backdate = (id, fields) =>
        Flashcard.updateOne({ _id: id }, { $set: fields }, { timestamps: false });

    it('treats a fresh noted card as a new candidate (due-now)', async () => {
        const token = await registerToken();
        const card = await makeCard(token, { question: 'What is a splay tree?' });

        const res = await queue(token);
        expect(res.status).toBe(200);
        expect(res.body.counts).toEqual({ due: 0, new: 1 });
        expect(res.body.cards.map((c) => c._id)).toContain(card._id);
        expect(res.body.cards[0].isNew).toBe(true);
        expect(res.body.cards[0].review).toBeNull();
    });

    it('excludes an empty skeleton card from the new bucket', async () => {
        const token = await registerToken();
        await makeCard(token, { question: 'Imported chapter', explanation: 'Enter explanation here' });
        const real = await makeCard(token, { question: 'What is a B-tree?' });

        const res = await queue(token);
        expect(res.body.counts.new).toBe(1);
        expect(res.body.cards.map((c) => c._id)).toEqual([real._id]);
    });

    it('moves a card from new to due once it has been graded', async () => {
        const token = await registerToken();
        const card = await makeCard(token, { question: 'What is a trie?' });
        await request(app).post(`/api/reviews/${card._id}/grade`).set(auth(token)).send({ correct: true });

        // Freshly graded: scheduled ~1 day out, so neither due nor "new".
        let res = await queue(token);
        expect(res.body.counts).toEqual({ due: 0, new: 0 });

        await CardReview.updateOne(
            { flashcard: card._id },
            { $set: { dueDate: new Date(Date.now() - 3600 * 1000) } },
        );
        res = await queue(token);
        expect(res.body.counts).toEqual({ due: 1, new: 0 });
        expect(res.body.cards[0]._id).toBe(card._id);
        expect(res.body.cards[0].isNew).toBe(false);
        expect(res.body.cards[0].review.interval).toBe(1);
    });

    it('honours the recency window for new cards', async () => {
        const token = await registerToken();
        const card = await makeCard(token, { question: 'What is an AVL tree?' });
        await backdate(card._id, { createdAt: new Date(Date.now() - 90 * 864e5), updatedAt: new Date(Date.now() - 90 * 864e5) });

        expect((await queue(token, '?recencyDays=30')).body.counts.new).toBe(0);
        expect((await queue(token, '?recencyDays=120')).body.counts.new).toBe(1);
    });

    it('filters by deck and by type', async () => {
        const token = await registerToken();
        const deckRes = await request(app).post('/api/decks').set(auth(token))
            .send({ name: 'Trees Deck', type: 'DSA', isPublic: true });
        const deckId = deckRes.body._id;

        const inDeck = await makeCard(token, { question: 'Which tree self-balances on access?', decks: [deckId] });
        await makeCard(token, { question: 'A card in no particular deck' });
        await makeCard(token, { question: 'A system design prompt about queues', type: 'System Design' });

        const byDeck = await queue(token, `?deck=${deckId}`);
        expect(byDeck.body.cards.map((c) => c._id)).toEqual([inDeck._id]);

        const byType = await queue(token, '?type=System Design');
        expect(byType.body.counts.new).toBe(1);
        expect(byType.body.cards[0].type).toBe('System Design');
    });

    it('respects include=due / include=new and the session-size cap', async () => {
        const token = await registerToken();
        for (let i = 0; i < 4; i += 1) {
            await makeCard(token, { question: `Recency question number ${i}` });
        }

        const dueOnly = await queue(token, '?include=due');
        expect(dueOnly.body.counts.new).toBe(0);
        expect(dueOnly.body.cards).toHaveLength(0);

        const capped = await queue(token, '?include=new&limit=2');
        expect(capped.body.counts.new).toBe(4);
        expect(capped.body.cards).toHaveLength(2);
    });

    it('preview=1 returns counts without card bodies', async () => {
        const token = await registerToken();
        await makeCard(token, { question: 'A previewable question about heaps' });

        const res = await queue(token, '?preview=1');
        expect(res.body.counts.new).toBe(1);
        expect(res.body.cards).toEqual([]);
    });

    it('requires auth', async () => {
        const res = await request(app).get('/api/reviews/queue');
        expect(res.status).toBe(401);
    });
});
