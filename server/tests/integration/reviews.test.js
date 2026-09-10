import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import CardReview from '../../models/CardReview.js';
import { registerUser } from '../utils/testUtils.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const createUserAndCard = async (opts = {}) => {
    const slug = Math.random().toString(36).slice(2, 12);
    const reg = await registerUser({
        username: `srs_${slug}`,
        email: `srs_${slug}@example.com`,
    });
    expect(reg.status).toBe(201);
    const token = reg.body.token;

    const card = await request(app)
        .post('/api/flashcards')
        .set(auth(token))
        .send({
            question: 'What is a red-black tree?',
            explanation: 'A self-balancing binary search tree with colour invariants.',
            type: 'DSA',
            isPublic: opts.isPublic !== undefined ? opts.isPublic : true,
        });
    expect(card.status).toBe(201);
    return { token, cardId: card.body._id, userId: reg.body._id };
};

describe('Reviews API (SM-2)', () => {
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

    it('GET /due returns cards whose dueDate has passed, soonest first', async () => {
        const { token, cardId } = await createUserAndCard();
        await request(app).post(`/api/reviews/${cardId}/grade`).set(auth(token)).send({ correct: true });

        // Nothing due yet (dueDate is ~1 day out).
        const none = await request(app).get('/api/reviews/due').set(auth(token));
        expect(none.body.count).toBe(0);

        // Backdate the schedule and try again.
        await CardReview.updateOne(
            { flashcard: cardId },
            { $set: { dueDate: new Date(Date.now() - 3600 * 1000) } },
        );
        const due = await request(app).get('/api/reviews/due').set(auth(token));
        expect(due.body.count).toBe(1);
        expect(due.body.cards[0]._id).toBe(String(cardId));
        expect(due.body.cards[0].review).toBeDefined();
        expect(due.body.cards[0].question).toContain('red-black');
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
