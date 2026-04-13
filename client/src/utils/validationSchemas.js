import { z } from 'zod';

const deckTypes = ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'];

const deckSchema = z.object({
  name: z.string().trim().min(3, 'Deck name must be at least 3 characters').max(100, 'Deck name must be 100 characters or less'),
  description: z.string().trim().max(500, 'Description must be 500 characters or less').optional().or(z.literal('')),
  type: z.enum(deckTypes, { errorMap: () => ({ message: 'Deck type is required' }) }),
});

const folderSchema = z.object({
  name: z.string().trim().min(3, 'Folder name must be at least 3 characters').max(100, 'Folder name must be 100 characters or less'),
  description: z.string().trim().max(500, 'Description must be 500 characters or less').optional().or(z.literal('')),
  isPublic: z.boolean().optional(),
});

const flashcardSchema = z.object({
  question: z.string().trim().min(5, 'Question must be at least 5 characters').max(500, 'Question must be 500 characters or less'),
  explanation: z.string().trim().min(10, 'Explanation must be at least 10 characters'),
  type: z.enum(deckTypes, { errorMap: () => ({ message: 'Flashcard type is required' }) }),
  tags: z.string().optional(),
  decks: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export { deckSchema, folderSchema, flashcardSchema, deckTypes };
