import { jest, expect } from '@jest/globals';
import { createDeck } from '../../../controllers/deckController.js';
import User from '../../../models/User.js';

const buildMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('deckController.createDeck', () => {
  it('creates a deck for the authenticated user', async () => {
    const user = await User.create({
      username: 'deckcontrolleruser',
      email: 'deckcontrolleruser@example.com',
      password: 'Password123!',
    });

    const req = {
      body: {
        name: 'Algorithms',
        description: 'Study deck',
        type: 'DSA',
        isPublic: true,
      },
      user,
    };
    const res = buildMockRes();

    await createDeck(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  it('rejects missing name', async () => {
    const user = await User.create({
      username: 'missingnameuser',
      email: 'missingnameuser@example.com',
      password: 'Password123!',
    });

    const req = { body: { type: 'DSA' }, user };
    const res = buildMockRes();

    await createDeck(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
