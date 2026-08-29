import request from 'supertest';
import app from '../../server.js';
import { registerUser } from '../utils/testUtils.js';

describe('Conversations API', () => {
  const createConversationFor = async (token, title) => {
    const response = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ title });

    expect(response.status).toBe(201);
    return response.body;
  };

  it('rejects unauthenticated access instead of returning every user\'s chats', async () => {
    const owner = await registerUser({
      username: 'convowner',
      email: 'convowner@example.com',
    });
    await createConversationFor(owner.body.token, 'Private planning notes');

    const anonList = await request(app).get('/api/conversations');

    expect(anonList.status).toBe(401);
  });

  it('does not leak one user\'s conversations to another', async () => {
    const alice = await registerUser({
      username: 'convalice',
      email: 'convalice@example.com',
    });
    const conversation = await createConversationFor(alice.body.token, 'Alice only');

    const bob = await registerUser({
      username: 'convbob',
      email: 'convbob@example.com',
    });

    const bobList = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${bob.body.token}`);

    expect(bobList.status).toBe(200);
    expect(bobList.body.map((c) => c._id)).not.toContain(conversation._id);

    const bobFetch = await request(app)
      .get(`/api/conversations/${conversation._id}`)
      .set('Authorization', `Bearer ${bob.body.token}`);

    expect(bobFetch.status).toBe(404);
  });

  it('lets the owner list and fetch their own conversation', async () => {
    const owner = await registerUser({
      username: 'convowner2',
      email: 'convowner2@example.com',
    });
    const conversation = await createConversationFor(owner.body.token, 'Mine');

    const list = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${owner.body.token}`);

    expect(list.status).toBe(200);
    expect(list.body.map((c) => c._id)).toContain(conversation._id);
  });
});
