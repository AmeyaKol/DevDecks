import { normalizeTag } from './tagUtils';

describe('normalizeTag', () => {
    it('lowercases and hyphenates', () => {
        expect(normalizeTag('Binary Search')).toBe('binary-search');
    });

    it('singularizes simple plurals', () => {
        expect(normalizeTag('Trees')).toBe('tree');
        expect(normalizeTag('Hash Tables')).toBe('hash-table');
    });

    it('does not singularize short words', () => {
        expect(normalizeTag('BFS')).toBe('bfs');
        expect(normalizeTag('DFS')).toBe('dfs');
    });

    it('trims whitespace', () => {
        expect(normalizeTag('  Stack  ')).toBe('stack');
    });

    it('collapses multiple spaces', () => {
        expect(normalizeTag('Two   Pointers')).toBe('two-pointer');
    });
});
