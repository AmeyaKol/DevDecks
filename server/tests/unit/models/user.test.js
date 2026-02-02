import User from '../../../models/User.js';

describe('User model', () => {
  it('hashes password before saving', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'Password123!',
    });

    expect(user.password).not.toBe('Password123!');
    const matches = await user.matchPassword('Password123!');
    expect(matches).toBe(true);
  });

  it('requires a valid email', async () => {
    await expect(
      User.create({
        username: 'bademail',
        email: 'not-an-email',
        password: 'Password123!',
      })
    ).rejects.toThrow();
  });
});
