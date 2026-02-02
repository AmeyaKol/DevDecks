import Deck from '../../../models/Deck.js';
import User from '../../../models/User.js';

describe('Deck model', () => {
  it('requires name and type', async () => {
    const user = await User.create({
      username: 'deckuser',
      email: 'deckuser@example.com',
      password: 'Password123!',
    });

    await expect(
      Deck.create({
        description: 'Missing name/type',
        user: user._id,
      })
    ).rejects.toThrow();
  });

  it('enforces unique deck names per user', async () => {
    const user = await User.create({
      username: 'uniqueuser',
      email: 'uniqueuser@example.com',
      password: 'Password123!',
    });

    await Deck.create({
      name: 'My Deck',
      type: 'DSA',
      user: user._id,
    });

    await expect(
      Deck.create({
        name: 'My Deck',
        type: 'DSA',
        user: user._id,
      })
    ).rejects.toThrow();
  });
});
