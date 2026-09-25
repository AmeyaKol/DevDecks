import { parseProblemCsv } from './problemCsv';

const header = 'ID,Title,Rating,Difficulty,Companies,Tags';

test('loads six fields and semicolon-delimited filters', () => {
  expect(parseProblemCsv(`${header}\n1,two-sum,1234,Easy,A;B,Array;Hash Table\n`)).toEqual([
    { ID: '1', Title: 'two-sum', Rating: 1234, Difficulty: 'Easy', companies: ['A', 'B'], tags: ['Array', 'Hash Table'] },
  ]);
});

test('reads quoted commas, escaped quotes, CRLF and BOM without shifting columns', () => {
  const rows = parseProblemCsv(`\uFEFF${header}\r\n1333,"Filter-Restaurants-by-Vegan-Friendly,-Price-and-Distance",,Medium,"A, Inc.;B",Array\r\n2,"a-""quoted""-title",1000,Easy,,\r\n`);
  expect(rows[0].Title).toBe('Filter-Restaurants-by-Vegan-Friendly,-Price-and-Distance');
  expect(rows[0].companies).toEqual(['A, Inc.', 'B']);
  expect(rows[0].tags).toEqual(['Array']);
  expect(rows[1].Title).toBe('a-"quoted"-title');
});

test('handles embedded newlines and legacy frequency without exposing it', () => {
  const rows = parseProblemCsv(`${header},Frequency\n1,"two\nsum",,Easy,,Array,100%`);
  expect(rows[0].Title).toBe('two\nsum');
  expect(rows[0]).not.toHaveProperty('Frequency');
});

test('rejects malformed headers, rows and quotes', () => {
  for (const text of ['', 'Title,ID', `${header}\n1,title`, `${header}\n1,"unclosed`, `${header}\n1,"title"x,,Easy,,`]) {
    expect(() => parseProblemCsv(text)).toThrow();
  }
});
