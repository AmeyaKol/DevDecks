import request from 'supertest';
import app from '../../server.js';
import { registerUser } from '../utils/testUtils.js';

describe('Decks API', () => {
  it('creates and fetches decks', async () => {
    const registerResponse = await registerUser({
      username: 'deckapiuser',
      email: 'deckapiuser@example.com',
    });
    const token = registerResponse.body.token;

    const createResponse = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Algorithms',
        description: 'Study deck',
        type: 'DSA',
        isPublic: true,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Algorithms');

    const listResponse = await request(app)
      .get('/api/decks')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.decks || listResponse.body)).toBe(true);
  });
});
