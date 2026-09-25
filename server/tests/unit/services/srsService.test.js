import { expect } from '@jest/globals';
import {
    scheduleNext,
    qualityFromCorrect,
    DEFAULT_EASE,
    MIN_EASE,
    QUALITY_CORRECT,
    QUALITY_INCORRECT,
} from '../../../services/srsService.js';

const AT = new Date('2026-01-01T12:00:00.000Z');
const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / 86400000);

describe('srsService.qualityFromCorrect', () => {
    it('maps the binary grade onto the SM-2 quality scale', () => {
        expect(qualityFromCorrect(true)).toBe(QUALITY_CORRECT);
        expect(qualityFromCorrect(false)).toBe(QUALITY_INCORRECT);
    });
});

describe('srsService.scheduleNext', () => {
    it('first successful recall: interval 1 day, ease unchanged at 2.5', () => {
        const next = scheduleNext({ easeFactor: DEFAULT_EASE, interval: 0, repetitions: 0 }, QUALITY_CORRECT, AT);
        expect(next).toMatchObject({ repetitions: 1, interval: 1, easeFactor: 2.5, lapsed: false });
        expect(daysBetween(AT, next.dueDate)).toBe(1);
    });

    it('second successful recall steps to 6 days', () => {
        const next = scheduleNext({ easeFactor: 2.5, interval: 1, repetitions: 1 }, QUALITY_CORRECT, AT);
        expect(next).toMatchObject({ repetitions: 2, interval: 6 });
    });

    it('third+ successful recall multiplies the interval by ease and rounds', () => {
        const next = scheduleNext({ easeFactor: 2.5, interval: 6, repetitions: 2 }, QUALITY_CORRECT, AT);
        expect(next.repetitions).toBe(3);
        expect(next.interval).toBe(Math.round(6 * 2.5)); // 15
    });

    it('a miss lapses the card: repetitions and interval reset, ease drops', () => {
        const next = scheduleNext({ easeFactor: 2.5, interval: 15, repetitions: 3 }, QUALITY_INCORRECT, AT);
        expect(next.lapsed).toBe(true);
        expect(next.repetitions).toBe(0);
        expect(next.interval).toBe(1);
        expect(next.easeFactor).toBeCloseTo(2.18, 2); // 2.5 - 0.32
    });

    it('ease never falls below the 1.3 floor no matter how many misses', () => {
        let state = { easeFactor: DEFAULT_EASE, interval: 0, repetitions: 0 };
        for (let i = 0; i < 20; i += 1) {
            state = scheduleNext(state, QUALITY_INCORRECT, AT);
        }
        expect(state.easeFactor).toBe(MIN_EASE);
    });

    it('a perfect grade (q=5) raises ease by 0.1', () => {
        const next = scheduleNext({ easeFactor: 2.5, interval: 0, repetitions: 0 }, 5, AT);
        expect(next.easeFactor).toBeCloseTo(2.6, 5);
    });

    it('treats missing/garbage prior state as a fresh card', () => {
        const next = scheduleNext(undefined, QUALITY_CORRECT, AT);
        expect(next).toMatchObject({ repetitions: 1, interval: 1, easeFactor: DEFAULT_EASE });
    });

    it('clamps out-of-range quality', () => {
        expect(scheduleNext({}, 99, AT).lapsed).toBe(false); // clamps to 5
        expect(scheduleNext({}, -3, AT).lapsed).toBe(true);  // clamps to 0
    });
});
