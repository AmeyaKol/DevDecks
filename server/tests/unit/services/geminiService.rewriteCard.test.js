import { jest, expect } from '@jest/globals';

const mockGenerateContent = jest.fn();

jest.unstable_mockModule('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({ generateContent: mockGenerateContent }),
    })),
    SchemaType: { OBJECT: 'OBJECT', STRING: 'STRING' },
}));

let rewriteCard;
let originalApiKey;

beforeAll(async () => {
    originalApiKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
    const mod = await import('../../../services/geminiService.js');
    rewriteCard = mod.rewriteCard;
});

afterAll(() => {
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
});

function mockResponseText(text) {
    mockGenerateContent.mockResolvedValue({ response: { text: () => text } });
}

describe('geminiService.rewriteCard', () => {
    beforeEach(() => {
        mockGenerateContent.mockReset();
    });

    it('parses a clean JSON response directly', async () => {
        mockResponseText(JSON.stringify({
            hint: 'compressed hint',
            explanation: '## Heading\n- point one',
            code: 'def f():\n    return 1',
        }));

        const result = await rewriteCard({ hint: 'h', explanation: 'e', code: 'c', language: 'python' });

        expect(result).toEqual({
            hint: 'compressed hint',
            explanation: '## Heading\n- point one',
            code: 'def f():\n    return 1',
        });
    });

    it('falls back to regex extraction and survives brace-heavy, nested code content', async () => {
        // Deeply nested braces in the code field, plus backticks in the explanation —
        // exactly the shape that breaks a naive /\{[\s\S]*\}/ slice if extraction is wrong.
        const braceHeavyCode = [
            'function outer() {',
            '  if (x) {',
            '    return { a: 1, b: { c: 2, d: [3, 4] } };',
            '  }',
            '  return {};',
            '}',
        ].join('\n');
        const payload = {
            hint: 'derived hint',
            explanation: 'Uses `outer()` which returns an object; see the {code}.',
            code: braceHeavyCode,
        };
        // Simulate the model wrapping the JSON in prose, forcing the regex fallback path.
        const wrapped = `Sure, here's the rewritten card:\n${JSON.stringify(payload)}\nLet me know if you need changes.`;
        mockResponseText(wrapped);

        const result = await rewriteCard({ hint: '', explanation: 'old', code: 'old code', language: 'javascript' });

        expect(result.hint).toBe('derived hint');
        expect(result.explanation).toContain('outer()');
        expect(result.code).toBe(braceHeavyCode);
    });

    it('falls back to the original field when the rewrite returns it empty', async () => {
        mockResponseText(JSON.stringify({ hint: '', explanation: '## New', code: '' }));

        const result = await rewriteCard({ hint: 'original hint', explanation: 'old', code: 'original code', language: 'python' });

        expect(result.hint).toBe('original hint');
        expect(result.explanation).toBe('## New');
        expect(result.code).toBe('original code');
    });

    it('throws when hint, explanation, and code are all empty', async () => {
        await expect(rewriteCard({ hint: '  ', explanation: '', code: '' })).rejects.toThrow(
            'At least one of hint, explanation, or code must be provided.'
        );
        expect(mockGenerateContent).not.toHaveBeenCalled();
    });
});
