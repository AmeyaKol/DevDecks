import Flashcard from '../../../models/Flashcard.js';
import User from '../../../models/User.js';

describe('Flashcard model', () => {
  it('requires question, explanation, type, and user', async () => {
    const user = await User.create({
      username: 'flashuser',
      email: 'flashuser@example.com',
      password: 'Password123!',
    });

    await expect(
      Flashcard.create({
        question: 'What is a hash map?',
        user: user._id,
      })
    ).rejects.toThrow();
  });

  it('creates a valid flashcard', async () => {
    const user = await User.create({
      username: 'validflashuser',
      email: 'validflashuser@example.com',
      password: 'Password123!',
    });

    const flashcard = await Flashcard.create({
      question: 'What is a hash map?',
      explanation: 'A key-value store with O(1) average lookup.',
      type: 'DSA',
      user: user._id,
    });

    expect(flashcard._id).toBeDefined();
    expect(flashcard.type).toBe('DSA');
  });
});
