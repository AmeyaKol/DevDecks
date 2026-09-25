import { availableMockSizes, problemUrl, selectMockProblems } from './mockAssessment';

const rows = (easy, medium, hard, company = 'Acme') => ['Easy', 'Medium', 'Hard'].flatMap((Difficulty, i) =>
  Array.from({ length: [easy, medium, hard][i] }, (_, j) => ({ ID: `${i}-${j}`, Title: `${Difficulty}-${j}`, Difficulty, companies: [company] })));

test.each([2, 3, 4])('selects %i distinct company problems with at most one easy and one hard', count => {
  const pool = [...rows(5, 8, 5), ...rows(3, 3, 3, 'Other')];
  const original = JSON.stringify(pool);
  for (let seed = 1; seed <= 100; seed++) {
    let state = seed;
    const random = () => ((state = (state * 16807) % 2147483647) - 1) / 2147483646;
    const selected = selectMockProblems(pool, 'Acme', count, random);
    expect(selected).toHaveLength(count);
    expect(new Set(selected.map(p => p.ID)).size).toBe(count);
    expect(selected.every(p => p.companies.includes('Acme'))).toBe(true);
    expect(selected.filter(p => p.Difficulty === 'Easy').length).toBeLessThanOrEqual(1);
    expect(selected.filter(p => p.Difficulty === 'Hard').length).toBeLessThanOrEqual(1);
    expect(selected.some(p => p.Difficulty === 'Medium')).toBe(true);
  }
  expect(JSON.stringify(pool)).toBe(original);
});

test('weights two-problem mixes 40/40/20 when all are feasible', () => {
  const pool = rows(3, 3, 3);
  expect(selectMockProblems(pool, 'Acme', 2, () => 0.1).map(p => p.Difficulty)).toEqual(['Easy', 'Medium']);
  expect(selectMockProblems(pool, 'Acme', 2, () => 0.5).map(p => p.Difficulty)).toEqual(['Medium', 'Medium']);
  expect(selectMockProblems(pool, 'Acme', 2, () => 0.9).map(p => p.Difficulty)).toEqual(['Medium', 'Hard']);
});

test('uses only feasible mixes and rejects sparse or invalid requests', () => {
  expect(availableMockSizes(rows(1, 1, 0), 'Acme')).toEqual([2]);
  expect(availableMockSizes(rows(5, 0, 5), 'Acme')).toEqual([]);
  expect(availableMockSizes(rows(0, 4, 0), 'Acme')).toEqual([2, 3, 4]);
  expect(selectMockProblems(rows(0, 2, 0), 'Acme', 2)).toHaveLength(2);
  expect(() => selectMockProblems(rows(1, 1, 0), 'Acme', 3)).toThrow(/balanced/);
  expect(() => selectMockProblems(rows(4, 4, 4), 'Unknown', 2)).toThrow();
  expect(() => selectMockProblems(rows(4, 4, 4), 'Acme', 5)).toThrow();
});

test('deduplicates IDs and case-insensitive titles and skips unknown difficulties', () => {
  const pool = rows(0, 1, 0);
  pool.push({ ...pool[0] }, { ...pool[0], ID: 'other', Title: pool[0].Title.toUpperCase() }, { ...pool[0], ID: 'unknown', Title: 'unknown', Difficulty: 'Unknown' });
  expect(availableMockSizes(pool, 'Acme')).toEqual([]);
});

test('links directly to the problem description using an encoded lowercase slug', () => {
  expect(problemUrl({ Title: 'Two-Sum' })).toBe('https://leetcode.com/problems/two-sum/description/');
});
