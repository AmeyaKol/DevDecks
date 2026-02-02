import request from 'supertest';
import app from '../../server.js';
import { registerUser } from '../utils/testUtils.js';

describe('Auth API', () => {
  it('registers a user', async () => {
    const response = await registerUser({
      username: 'authuser',
      email: 'authuser@example.com',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
  });

  it('logs in a user', async () => {
    await registerUser({
      username: 'loginuser',
      email: 'loginuser@example.com',
    });

    const response = await request(app)
      .post('/api/users/login')
      .send({ email: 'loginuser@example.com', password: 'Password123!' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('rejects invalid login', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({ email: 'missing@example.com', password: 'bad' });

    expect(response.status).toBe(401);
  });
});
