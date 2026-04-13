import request from 'supertest';
import app from '../../server.js';
import { registerUser, loginUser } from '../utils/testUtils.js';

describe('Health and admin metrics', () => {
  it('GET /api/health returns structured payload', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.mongo).toBe('connected');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('memory');
    expect(res.body.redis).toBeDefined();
  });

  it('GET /api/metrics rejects non-admin users', async () => {
    const reg = await registerUser({
      username: 'normuser',
      email: 'normuser@example.com',
    });
    expect(reg.status).toBe(201);
    const login = await loginUser('normuser@example.com', 'Password123!');
    const token = login.body.token;

    const res = await request(app)
      .get('/api/metrics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('GET /api/metrics allows admin@flashcards.com', async () => {
    const reg = await registerUser({
      username: 'siteadmin',
      email: 'admin@flashcards.com',
    });
    expect(reg.status).toBe(201);
    const login = await loginUser('admin@flashcards.com', 'Password123!');
    const token = login.body.token;

    const res = await request(app)
      .get('/api/metrics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totals).toBeDefined();
    expect(res.body.totals).toHaveProperty('users');
    expect(res.body.trafficSinceDeploy).toBeDefined();
    expect(res.body.mongo).toBe('connected');
  });

  it('POST /api/youtube/playlist requires auth', async () => {
    const res = await request(app)
      .post('/api/youtube/playlist')
      .send({ playlistUrl: 'https://www.youtube.com/playlist?list=PLtest' });
    expect(res.status).toBe(401);
  });
});
