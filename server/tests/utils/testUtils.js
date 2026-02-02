import request from 'supertest';
import app from '../../server.js';

const registerUser = async (overrides = {}) => {
  const payload = {
    username: `user_${Date.now()}`,
    email: `user_${Date.now()}@example.com`,
    password: 'Password123!',
    ...overrides,
  };

  const response = await request(app)
    .post('/api/users/register')
    .send(payload);

  return response;
};

const loginUser = async (email, password) => {
  return request(app)
    .post('/api/users/login')
    .send({ email, password });
};

export { registerUser, loginUser };
