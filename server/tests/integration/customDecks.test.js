import request from 'supertest';
import app from '../../server.js';
import { registerUser } from '../utils/testUtils.js';
import Flashcard from '../../models/Flashcard.js';

describe('Custom deck type end-to-end', () => {
  const createCustomDeck = async (token, overrides = {}) => {
    return request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Custom Deck',
        type: 'Custom',
        isPublic: true,
        fieldConfig: {
          fields: [
            { name: 'front', displayName: 'Front', type: 'text', role: 'prompt', required: true, order: 0 },
            { name: 'back', displayName: 'Back', type: 'markdown', role: 'answer', required: true, order: 1 },
          ],
        },
        ...overrides,
      });
  };

  it('creates a Custom deck, returns a resolved field config, and never migrates a legacy deck', async () => {
    const { body: { token } } = await registerUser({ username: 'customdeckapiuser', email: 'customdeckapiuser@example.com' });

    const deckResponse = await createCustomDeck(token);
    expect(deckResponse.status).toBe(201);
    expect(deckResponse.body.type).toBe('Custom');
    expect(deckResponse.body.fieldConfig.fields).toHaveLength(2);
    expect(deckResponse.body.resolvedFieldConfig.fields.map((f) => f.name)).toEqual(['front', 'back']);

    const listResponse = await request(app)
      .get('/api/decks')
      .set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    const decks = listResponse.body.decks || listResponse.body;
    const customDeck = decks.find((d) => d._id === deckResponse.body._id);
    expect(customDeck.resolvedFieldConfig.fields).toHaveLength(2);
  });

  it('derives question/explanation from fieldData and forces single-deck primaryDeck on create', async () => {
    const { body: { token } } = await registerUser({ username: 'customcardapiuser', email: 'customcardapiuser@example.com' });
    const { body: deck } = await createCustomDeck(token);

    const cardResponse = await request(app)
      .post('/api/flashcards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'Custom',
        primaryDeck: deck._id,
        fieldData: {
          front: 'What is a closure?',
          back: 'A function bundled with its lexical scope.',
        },
      });

    expect(cardResponse.status).toBe(201);
    expect(cardResponse.body.question).toBe('What is a closure?');
    expect(cardResponse.body.explanation).toBe('A function bundled with its lexical scope.');
    expect(cardResponse.body.decks).toHaveLength(1);
    expect(cardResponse.body.decks[0]._id).toBe(deck._id);
    expect(cardResponse.body.fieldData.front).toBe('What is a closure?');
  });

  it('rejects a Custom card missing a required field', async () => {
    const { body: { token } } = await registerUser({ username: 'customcardmissing', email: 'customcardmissing@example.com' });
    const { body: deck } = await createCustomDeck(token);

    const cardResponse = await request(app)
      .post('/api/flashcards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'Custom',
        primaryDeck: deck._id,
        fieldData: { front: 'Missing the back field' },
      });

    expect(cardResponse.status).toBe(400);
  });

  it('rejects a Custom card whose primaryDeck belongs to another user', async () => {
    const { body: { token: ownerToken } } = await registerUser({ username: 'deckowneruser', email: 'deckowneruser@example.com' });
    const { body: deck } = await createCustomDeck(ownerToken);

    const { body: { token: otherToken } } = await registerUser({ username: 'otherusercustom', email: 'otherusercustom@example.com' });
    const cardResponse = await request(app)
      .post('/api/flashcards')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        type: 'Custom',
        primaryDeck: deck._id,
        fieldData: { front: 'Q', back: 'A' },
      });

    expect(cardResponse.status).toBe(400);
  });

  it('re-derives question/explanation when fieldData is updated', async () => {
    const { body: { token } } = await registerUser({ username: 'customcardupdateuser', email: 'customcardupdateuser@example.com' });
    const { body: deck } = await createCustomDeck(token);

    const { body: card } = await request(app)
      .post('/api/flashcards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'Custom',
        primaryDeck: deck._id,
        fieldData: { front: 'Original front', back: 'Original back' },
      });

    const updateResponse = await request(app)
      .put(`/api/flashcards/${card._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fieldData: { front: 'Updated front', back: 'Updated back' } });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.question).toBe('Updated front');
    expect(updateResponse.body.explanation).toBe('Updated back');
  });

  it('cascade-deletes all of a Custom deck\'s cards when the deck is deleted', async () => {
    const { body: { token } } = await registerUser({ username: 'customdeckdeleteuser', email: 'customdeckdeleteuser@example.com' });
    const { body: deck } = await createCustomDeck(token);

    const cardResponses = await Promise.all(
      [1, 2, 3].map((n) =>
        request(app)
          .post('/api/flashcards')
          .set('Authorization', `Bearer ${token}`)
          .send({ type: 'Custom', primaryDeck: deck._id, fieldData: { front: `Q${n}`, back: `A${n}` } })
      )
    );
    const cardIds = cardResponses.map((r) => r.body._id);
    expect(cardIds).toHaveLength(3);

    const deleteResponse = await request(app)
      .delete(`/api/decks/${deck._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.deletedCardCount).toBe(3);

    const survivingCards = await Flashcard.find({ _id: { $in: cardIds } });
    expect(survivingCards).toHaveLength(0);
  });

  it('does not cascade-delete cards when a non-Custom deck is deleted (existing behavior)', async () => {
    const { body: { token } } = await registerUser({ username: 'stddeckdeleteuser', email: 'stddeckdeleteuser@example.com' });

    const { body: deck } = await request(app)
      .post('/api/decks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Standard Deck', type: 'DSA', isPublic: true });

    const { body: card } = await request(app)
      .post('/api/flashcards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        question: 'What is Big-O?',
        explanation: 'A way to describe complexity.',
        type: 'DSA',
        decks: [deck._id],
      });

    const deleteResponse = await request(app)
      .delete(`/api/decks/${deck._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.deletedCardCount).toBe(0);

    const survivingCard = await Flashcard.findById(card._id);
    expect(survivingCard).not.toBeNull();
    expect(survivingCard.decks).toEqual([]);
  });
});
