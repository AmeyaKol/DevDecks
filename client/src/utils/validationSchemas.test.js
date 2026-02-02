import { deckSchema, folderSchema, flashcardSchema, deckTypes } from './validationSchemas';

describe('validationSchemas', () => {
  describe('deckSchema', () => {
    it('accepts valid deck', () => {
      const result = deckSchema.safeParse({
        name: 'My Deck',
        description: '',
        type: 'DSA',
      });
      expect(result.success).toBe(true);
    });

    it('rejects name shorter than 3 characters', () => {
      const result = deckSchema.safeParse({
        name: 'ab',
        description: '',
        type: 'DSA',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid type', () => {
      const result = deckSchema.safeParse({
        name: 'Valid Name',
        description: '',
        type: 'Invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('folderSchema', () => {
    it('accepts valid folder', () => {
      const result = folderSchema.safeParse({
        name: 'My Folder',
        description: '',
        isPublic: false,
      });
      expect(result.success).toBe(true);
    });

    it('rejects name shorter than 3 characters', () => {
      const result = folderSchema.safeParse({
        name: 'ab',
        description: '',
        isPublic: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('flashcardSchema', () => {
    it('accepts valid flashcard', () => {
      const result = flashcardSchema.safeParse({
        question: 'What is Big O?',
        explanation: 'A way to describe time complexity.',
        type: 'DSA',
      });
      expect(result.success).toBe(true);
    });

    it('rejects question shorter than 5 characters', () => {
      const result = flashcardSchema.safeParse({
        question: 'What',
        explanation: 'A way to describe.',
        type: 'DSA',
      });
      expect(result.success).toBe(false);
    });

    it('rejects explanation shorter than 10 characters', () => {
      const result = flashcardSchema.safeParse({
        question: 'What is Big O?',
        explanation: 'Short',
        type: 'DSA',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('deckTypes', () => {
    it('includes expected types', () => {
      expect(deckTypes).toContain('DSA');
      expect(deckTypes).toContain('GRE-Word');
      expect(deckTypes.length).toBeGreaterThan(0);
    });
  });
});
