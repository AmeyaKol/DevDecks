import {
  mergeRewrittenHint,
  mergeRewrittenExplanation,
  mergeRewrittenCode,
  mergeRewrittenCard,
} from './aiRewriteMerge';

describe('mergeRewrittenHint', () => {
  it('prefixes the AI hint when the current hint is empty', () => {
    expect(mergeRewrittenHint('', 'derived hint')).toBe('AI: derived hint');
  });

  it('appends the AI hint after the user hint when non-empty', () => {
    expect(mergeRewrittenHint('user hint', 'compressed hint')).toBe('user hint — AI: compressed hint');
  });

  it('never contains newlines, even if the AI response has them', () => {
    const merged = mergeRewrittenHint('user hint', 'line one\nline two\r\nline three');
    expect(merged).not.toMatch(/\n/);
    expect(merged).toBe('user hint — AI: line one; line two; line three');
  });

  it('replaces the previous AI block instead of stacking on a second rewrite (empty base)', () => {
    const first = mergeRewrittenHint('', 'first hint');
    const second = mergeRewrittenHint(first, 'second hint');
    expect(second).toBe('AI: second hint');
    expect(second.split('AI:').length - 1).toBe(1);
  });

  it('replaces the previous AI block instead of stacking on a second rewrite (non-empty base)', () => {
    const first = mergeRewrittenHint('user hint', 'first hint');
    const second = mergeRewrittenHint(first, 'second hint');
    expect(second).toBe('user hint — AI: second hint');
    expect(second.split('AI:').length - 1).toBe(1);
  });
});

describe('mergeRewrittenExplanation', () => {
  it('produces just the AI block when current explanation is empty', () => {
    const merged = mergeRewrittenExplanation('', '## Heading\ncontent');
    expect(merged).toContain('## Heading');
    expect(merged.startsWith('<!-- AI-REWRITE:START -->')).toBe(true);
  });

  it('appends below the existing explanation with a visible separator', () => {
    const merged = mergeRewrittenExplanation('Original notes', '## Rewritten');
    expect(merged.startsWith('Original notes')).toBe(true);
    expect(merged).toContain('---');
    expect(merged).toContain('## Rewritten');
  });

  it('does not stack duplicate AI blocks on a second rewrite', () => {
    const first = mergeRewrittenExplanation('Original notes', '## First rewrite');
    const second = mergeRewrittenExplanation(first, '## Second rewrite');
    expect(second.startsWith('Original notes')).toBe(true);
    expect(second).not.toContain('First rewrite');
    expect(second).toContain('Second rewrite');
    expect(second.split('<!-- AI-REWRITE:START -->').length - 1).toBe(1);
  });
});

describe('mergeRewrittenCode', () => {
  it('uses a # comment separator for python', () => {
    const merged = mergeRewrittenCode('def f(): pass', 'def f():\n    return 1', 'python');
    expect(merged).toContain('# --- AI REWRITE START ---');
    expect(merged).toContain('# --- AI REWRITE END ---');
  });

  it('uses a // comment separator for cpp/java/javascript', () => {
    for (const lang of ['cpp', 'java', 'javascript']) {
      const merged = mergeRewrittenCode('int x = 1;', 'int x = 2;', lang);
      expect(merged).toContain('// --- AI REWRITE START ---');
      expect(merged).toContain('// --- AI REWRITE END ---');
    }
  });

  it('does not stack duplicate AI blocks on a second rewrite', () => {
    const first = mergeRewrittenCode('int x = 1;', 'int x = 2; // first', 'cpp');
    const second = mergeRewrittenCode(first, 'int x = 3; // second', 'cpp');
    expect(second.startsWith('int x = 1;')).toBe(true);
    expect(second).not.toContain('// first');
    expect(second).toContain('// second');
    expect(second.split('AI REWRITE START').length - 1).toBe(1);
  });
});

describe('mergeRewrittenCard', () => {
  it('merges all three fields from a rewrite response', () => {
    const result = mergeRewrittenCard(
      { hint: 'h', explanation: 'e', code: 'c', language: 'python' },
      { hint: 'ai hint', explanation: 'ai explanation', code: 'ai code' }
    );
    expect(result.hint).toBe('h — AI: ai hint');
    expect(result.explanation).toContain('ai explanation');
    expect(result.code).toContain('ai code');
  });
});
