import { jest, expect } from '@jest/globals';

const mockRewriteCard = jest.fn();

jest.unstable_mockModule('../../../services/geminiService.js', () => ({
    default: { rewriteCard: mockRewriteCard },
}));

let rewriteCard;

beforeAll(async () => {
    const mod = await import('../../../controllers/aiController.js');
    rewriteCard = mod.rewriteCard;
});

const buildMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('aiController.rewriteCard', () => {
    beforeEach(() => {
        mockRewriteCard.mockReset();
    });

    it('returns the rewritten fields on success', async () => {
        mockRewriteCard.mockResolvedValue({
            hint: 'compressed hint',
            explanation: '## Rewritten',
            code: 'def f():\n    return 1',
        });

        const req = {
            body: { hint: 'h', explanation: 'e', code: 'c', language: 'python', question: 'q', problemStatement: 'p' },
        };
        const res = buildMockRes();

        await rewriteCard(req, res);

        expect(mockRewriteCard).toHaveBeenCalledWith({
            hint: 'h', explanation: 'e', code: 'c', language: 'python', question: 'q', problemStatement: 'p',
        });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            rewritten: {
                hint: 'compressed hint',
                explanation: '## Rewritten',
                code: 'def f():\n    return 1',
            },
        }));
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 400 when hint, explanation, and code are all empty', async () => {
        const req = { body: { hint: '  ', explanation: '', code: '' } };
        const res = buildMockRes();

        await rewriteCard(req, res);

        expect(mockRewriteCard).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('proceeds when only code is provided', async () => {
        mockRewriteCard.mockResolvedValue({ hint: 'derived hint', explanation: '', code: 'x = 1' });
        const req = { body: { hint: '', explanation: '', code: 'x = 1' } };
        const res = buildMockRes();

        await rewriteCard(req, res);

        expect(mockRewriteCard).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalledWith(400);
    });

    it('maps a rate-limit error to 429', async () => {
        mockRewriteCard.mockRejectedValue(new Error('Rate limit exceeded. Please wait 12 seconds before trying again.'));

        const req = { body: { hint: 'h', explanation: '', code: '' } };
        const res = buildMockRes();

        await rewriteCard(req, res);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Rate limit exceeded' }));
    });

    it('maps any other error to 500', async () => {
        mockRewriteCard.mockRejectedValue(new Error('Gemini API is down'));

        const req = { body: { hint: 'h', explanation: '', code: '' } };
        const res = buildMockRes();

        await rewriteCard(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to rewrite card' }));
    });
});
