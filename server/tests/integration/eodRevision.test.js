import request from 'supertest';
import app from '../../server.js';
import Flashcard from '../../models/Flashcard.js';
import { reindexCards } from '../../services/embeddingPipeline.js';
import { registerUser } from '../utils/testUtils.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const hoursAgo = (n) => new Date(Date.now() - n * 60 * 60 * 1000);

describe('EOD revision queue: GET /api/flashcards/created-on-date', () => {
    let originalProvider;
    let token;

    beforeAll(() => {
        originalProvider = process.env.EMBEDDING_PROVIDER;
        process.env.EMBEDDING_PROVIDER = 'hash';
    });
    afterAll(() => {
        if (originalProvider === undefined) delete process.env.EMBEDDING_PROVIDER;
        else process.env.EMBEDDING_PROVIDER = originalProvider;
    });

    beforeEach(async () => {
        const slug = Math.random().toString(36).slice(2, 12);
        const reg = await registerUser({ username: `eod_${slug}`, email: `eod_${slug}@example.com` });
        token = reg.body.token;
    });

    const createCard = async (body) => {
        const res = await request(app).post('/api/flashcards').set(auth(token)).send({
            type: 'DSA',
            isPublic: true,
            ...body,
        });
        expect(res.status).toBe(201);
        return res.body;
    };

    const backdate = (id, { createdAt, updatedAt }) =>
        Flashcard.updateOne(
            { _id: id },
            { $set: { ...(createdAt && { createdAt }), ...(updatedAt && { updatedAt }) } },
            { timestamps: false },
        );

    const fetchQueue = async () => {
        const res = await request(app)
            .get(`/api/flashcards/created-on-date?date=${today()}`)
            .set(auth(token));
        expect(res.status).toBe(200);
        return res.body.map((c) => c._id);
    };

    it('requires the date param', async () => {
        const res = await request(app).get('/api/flashcards/created-on-date').set(auth(token));
        expect(res.status).toBe(400);
    });

    it('includes a card created today with real notes', async () => {
        const card = await createCard({ question: 'What is a heap?', explanation: 'A complete binary tree with the heap-order property.' });
        expect(await fetchQueue()).toContain(card._id);
    });

    it('excludes a YouTube-import skeleton created today', async () => {
        const skeleton = await createCard({ question: 'Graphs 101', explanation: 'Enter explanation here', link: 'https://youtu.be/abc' });
        const real = await createCard({ question: 'What is BFS?', explanation: 'Level-order traversal using a queue; O(V+E).' });

        const ids = await fetchQueue();
        expect(ids).toContain(real._id);
        expect(ids).not.toContain(skeleton._id);
    });

    it('includes a card first ingested weeks ago but annotated today', async () => {
        const card = await createCard({ question: 'Union-Find', explanation: 'Disjoint set with path compression and union by rank.' });
        // Simulate: created 40 days ago, edited (notes added) today.
        await backdate(card._id, { createdAt: daysAgo(40) });

        expect(await fetchQueue()).toContain(card._id);
    });

    it('excludes a card whose notes are weeks old and untouched today', async () => {
        const card = await createCard({ question: 'Dijkstra', explanation: 'Greedy shortest path with a min-heap; no negative edges.' });
        await backdate(card._id, { createdAt: daysAgo(40), updatedAt: daysAgo(40) });

        expect(await fetchQueue()).not.toContain(card._id);
    });

    it('includes a card created ~20h ago with notes (last-24h bucket)', async () => {
        const card = await createCard({ question: 'Topological sort', explanation: 'Order a DAG so every edge points forward; Kahn or DFS.' });
        await backdate(card._id, { createdAt: hoursAgo(20), updatedAt: hoursAgo(20) });

        expect(await fetchQueue()).toContain(card._id);
    });

    it('excludes a skeleton created ~20h ago (still no notes)', async () => {
        const card = await createCard({ question: 'DP intro', explanation: 'Enter explanation here', link: 'https://youtu.be/xyz' });
        await backdate(card._id, { createdAt: hoursAgo(20), updatedAt: hoursAgo(20) });

        expect(await fetchQueue()).not.toContain(card._id);
    });

    it('a background reindex does not resurface an old card into the queue', async () => {
        const card = await createCard({ question: 'KMP string matching', explanation: 'Prefix-function based string matching in O(n+m).' });
        await backdate(card._id, { createdAt: daysAgo(40), updatedAt: daysAgo(40) });

        await reindexCards({ filter: { _id: card._id }, force: true });

        expect(await fetchQueue()).not.toContain(card._id);
    });
});
