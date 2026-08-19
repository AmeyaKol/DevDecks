import request from 'supertest';
import app from '../../server.js';
import { registerUser } from '../utils/testUtils.js';

describe('Flashcards API', () => {
  it('creates and fetches flashcards', async () => {
    const registerResponse = await registerUser({
      username: 'flashapiuser',
      email: 'flashapiuser@example.com',
    });
    const token = registerResponse.body.token;

    const deckResponse = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Flashcards Deck',
        description: 'Test deck',
        type: 'DSA',
        isPublic: true,
      });

    const deckId = deckResponse.body._id;

    const createResponse = await request(app)
      .post('/api/flashcards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        question: 'What is Big-O?',
        explanation: 'A way to describe complexity.',
        type: 'DSA',
        decks: [deckId],
        tags: ['complexity'],
      });

    expect(createResponse.status).toBe(201);

    const listResponse = await request(app)
      .get('/api/flashcards')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.flashcards || listResponse.body)).toBe(true);
  });

  it('allows a partial update of a non-Custom card that omits question/explanation/type', async () => {
    const registerResponse = await registerUser({
      username: 'partialupdateuser',
      email: 'partialupdateuser@example.com',
    });
    const token = registerResponse.body.token;

    const deckResponse = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Partial Update Deck', type: 'DSA', isPublic: true });
    const deckId = deckResponse.body._id;

    const createResponse = await request(app)
      .post('/api/flashcards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        question: 'What is Big-O?',
        explanation: 'A way to describe complexity.',
        type: 'DSA',
        decks: [deckId],
      });

    const updateResponse = await request(app)
      .put(`/api/flashcards/${createResponse.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tags: ['complexity', 'big-o'] });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.tags).toEqual(['complexity', 'big-o']);
    expect(updateResponse.body.question).toBe('What is Big-O?');
  });
});
