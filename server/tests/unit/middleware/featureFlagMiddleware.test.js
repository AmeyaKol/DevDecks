import { jest, expect } from '@jest/globals';

jest.unstable_mockModule('../../../config/featureFlags.js', () => ({
    FEATURE_FLAGS: { enabledFeature: true, disabledFeature: false },
}));

let requireFeature;

beforeAll(async () => {
    const mod = await import('../../../middleware/featureFlagMiddleware.js');
    requireFeature = mod.requireFeature;
});

const buildMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('requireFeature', () => {
    it('calls next() when the flag is enabled', () => {
        const req = {};
        const res = buildMockRes();
        const next = jest.fn();

        requireFeature('enabledFeature')(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 403 without calling next() when the flag is disabled', () => {
        const req = {};
        const res = buildMockRes();
        const next = jest.fn();

        requireFeature('disabledFeature')(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });

    it('treats an unknown flag name as disabled (fail closed)', () => {
        const req = {};
        const res = buildMockRes();
        const next = jest.fn();

        requireFeature('someFlagThatDoesNotExist')(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
