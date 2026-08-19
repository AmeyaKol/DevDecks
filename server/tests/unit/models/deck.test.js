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

  it('resolves the standard field template for a legacy DSA deck with no fieldConfig', async () => {
    const user = await User.create({
      username: 'legacydeckuser',
      email: 'legacydeckuser@example.com',
      password: 'Password123!',
    });
    const deck = await Deck.create({ name: 'Legacy DSA Deck', type: 'DSA', user: user._id });
    expect(deck.resolvedFieldConfig).not.toBeNull();
    expect(deck.resolvedFieldConfig.fields.length).toBeGreaterThan(0);
    expect(deck.toJSON().resolvedFieldConfig).toBeDefined();
  });

  it('returns null resolvedFieldConfig for GRE deck types', async () => {
    const user = await User.create({
      username: 'gredeckuser',
      email: 'gredeckuser@example.com',
      password: 'Password123!',
    });
    const deck = await Deck.create({ name: 'GRE Deck', type: 'GRE-Word', user: user._id });
    expect(deck.resolvedFieldConfig).toBeNull();
  });

  it('accepts a Custom deck with up to 6 well-formed fields', async () => {
    const user = await User.create({
      username: 'customdeckuser',
      email: 'customdeckuser@example.com',
      password: 'Password123!',
    });
    const deck = await Deck.create({
      name: 'My Custom Deck',
      type: 'Custom',
      user: user._id,
      fieldConfig: {
        fields: [
          { name: 'front', displayName: 'Front', type: 'text', role: 'prompt', required: true, order: 0 },
          { name: 'back', displayName: 'Back', type: 'markdown', role: 'answer', required: true, order: 1 },
        ],
      },
    });
    expect(deck.fieldConfig.fields).toHaveLength(2);
    expect(deck.resolvedFieldConfig.fields.map((f) => f.name)).toEqual(['front', 'back']);
  });

  it('rejects a Custom deck with more than 6 fields', async () => {
    const user = await User.create({
      username: 'toomanyfieldsuser',
      email: 'toomanyfieldsuser@example.com',
      password: 'Password123!',
    });
    const fields = Array.from({ length: 7 }, (_, i) => ({
      name: `field${i}`,
      displayName: `Field ${i}`,
      type: 'text',
      role: 'answer',
      order: i,
    }));
    await expect(
      Deck.create({ name: 'Too Many Fields', type: 'Custom', user: user._id, fieldConfig: { fields } })
    ).rejects.toThrow();
  });

  it('rejects a Custom deck with duplicate field names', async () => {
    const user = await User.create({
      username: 'dupfieldnameuser',
      email: 'dupfieldnameuser@example.com',
      password: 'Password123!',
    });
    await expect(
      Deck.create({
        name: 'Dup Field Names',
        type: 'Custom',
        user: user._id,
        fieldConfig: {
          fields: [
            { name: 'front', displayName: 'Front', type: 'text', role: 'prompt', order: 0 },
            { name: 'front', displayName: 'Front Again', type: 'text', role: 'answer', order: 1 },
          ],
        },
      })
    ).rejects.toThrow();
  });

  it('rejects a Custom deck field name that is not a valid identifier', async () => {
    const user = await User.create({
      username: 'badfieldnameuser',
      email: 'badfieldnameuser@example.com',
      password: 'Password123!',
    });
    await expect(
      Deck.create({
        name: 'Bad Field Name',
        type: 'Custom',
        user: user._id,
        fieldConfig: {
          fields: [{ name: '1-bad-name', displayName: 'Bad', type: 'text', role: 'prompt', order: 0 }],
        },
      })
    ).rejects.toThrow();
  });
});
