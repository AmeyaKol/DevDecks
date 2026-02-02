import request from 'supertest';
import app from '../../server.js';
import { registerUser } from '../utils/testUtils.js';

describe('Folders API', () => {
  it('creates and fetches folders', async () => {
    const registerResponse = await registerUser({
      username: 'folderapiuser',
      email: 'folderapiuser@example.com',
    });
    const token = registerResponse.body.token;

    const createResponse = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Folder',
        description: 'Folder for decks',
        isPublic: false,
      });

    expect(createResponse.status).toBe(201);

    const listResponse = await request(app)
      .get('/api/folders')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
  });
});
