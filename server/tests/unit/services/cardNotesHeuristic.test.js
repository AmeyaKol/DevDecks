import { expect } from '@jest/globals';
import { hasUserNotes } from '../../../services/cardNotesHeuristic.js';

describe('cardNotesHeuristic.hasUserNotes', () => {
    it('is true for a card with a real written explanation', () => {
        expect(hasUserNotes({
            question: 'What is a monad?',
            explanation: 'A monad is a monoid in the category of endofunctors. In practice it is a wrapper with `of` and `flatMap`.',
        })).toBe(true);
    });

    it('is true for a terse GRE-Word style one-line definition', () => {
        expect(hasUserNotes({ question: 'ebullient', explanation: 'cheerful and full of energy' })).toBe(true);
    });

    it('is false for a blank or whitespace explanation', () => {
        expect(hasUserNotes({ question: 'q', explanation: '' })).toBe(false);
        expect(hasUserNotes({ question: 'q', explanation: '   \n  ' })).toBe(false);
    });

    it('is false for the importer placeholder string', () => {
        expect(hasUserNotes({ question: 'Intro to Trees', explanation: 'Enter explanation here' })).toBe(false);
        expect(hasUserNotes({ question: 'x', explanation: 'N/A' })).toBe(false);
    });

    it('is false for a split-card skeleton (explanation is just the chapter title + timestamp)', () => {
        expect(hasUserNotes({
            question: 'Two Pointers',
            explanation: 'Two Pointers: [12:34]',
        })).toBe(false);
        expect(hasUserNotes({
            question: 'Sliding Window',
            explanation: 'Sliding Window [1:02:03]',
        })).toBe(false);
    });

    it('is true once the learner adds prose beyond the chapter title', () => {
        expect(hasUserNotes({
            question: 'Two Pointers',
            explanation: 'Two Pointers: [12:34]\n\nUse when the array is sorted; move the pointer that can improve the result.',
        })).toBe(true);
    });

    it('treats any problemStatement or code as notes regardless of explanation', () => {
        expect(hasUserNotes({ question: 'q', explanation: 'Enter explanation here', problemStatement: 'Given an array...' })).toBe(true);
        expect(hasUserNotes({ question: 'q', explanation: '', code: 'def f():\n    return 1' })).toBe(true);
    });

    it('does not choke on missing fields', () => {
        expect(hasUserNotes({})).toBe(false);
        expect(hasUserNotes()).toBe(false);
    });
});
