import request from 'supertest';
import app from '../../server.js';
import { registerUser } from '../utils/testUtils.js';

// The knowledge graph sends the ids of the cards a topic was mined from, so the
// list endpoint has to filter by id without widening visibility.
describe('Flashcards API - ids filter', () => {
  const createCard = async (token, question, isPublic = true) => {
    const res = await request(app)
      .post('/api/flashcards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        question,
        explanation: 'A sufficiently long explanation for the validator.',
        type: 'DSA',
        tags: [],
        isPublic,
      });
    expect(res.status).toBe(201);
    return res.body._id;
  };

  const idsOf = (body) => (Array.isArray(body) ? body : body.flashcards || []).map((c) => c._id);

  it('returns only the requested cards', async () => {
    const user = await registerUser({ username: 'idsuser', email: 'idsuser@example.com' });
    const token = user.body.token;

    const a = await createCard(token, 'Card A');
    const b = await createCard(token, 'Card B');
    await createCard(token, 'Card C');

    const res = await request(app)
      .get(`/api/flashcards?ids=${a},${b}&paginate=false`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(idsOf(res.body).sort()).toEqual([a, b].sort());
  });

  it('preserves order-independence and ignores unknown ids', async () => {
    const user = await registerUser({ username: 'idsuser2', email: 'idsuser2@example.com' });
    const token = user.body.token;
    const a = await createCard(token, 'Only real card');

    const res = await request(app)
      .get(`/api/flashcards?ids=6a1f81dc5b4652a0cc8f7b3b,${a}&paginate=false`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(idsOf(res.body)).toEqual([a]);
  });

  // A malformed id must not throw a CastError or silently drop the filter and
  // return the whole collection.
  it('matches nothing when every id is malformed', async () => {
    const user = await registerUser({ username: 'idsuser3', email: 'idsuser3@example.com' });
    const token = user.body.token;
    await createCard(token, 'Should not come back');

    const res = await request(app)
      .get('/api/flashcards?ids=not-an-objectid,also-bad&paginate=false')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(idsOf(res.body)).toEqual([]);
  });

  it('does not expose another user\'s private card by id', async () => {
    const owner = await registerUser({ username: 'idsowner', email: 'idsowner@example.com' });
    const privateId = await createCard(owner.body.token, 'Secret card', false);

    const other = await registerUser({ username: 'idsother', email: 'idsother@example.com' });

    const res = await request(app)
      .get(`/api/flashcards?ids=${privateId}&paginate=false`)
      .set('Authorization', `Bearer ${other.body.token}`);

    expect(res.status).toBe(200);
    expect(idsOf(res.body)).toEqual([]);
  });
});
