/**
 * Spaced-repetition scheduling (SM-2).
 *
 * Pure functions only — no DB, no clock beyond an injectable `now`. The
 * controller owns persistence (see models/CardReview.js). SM-2 reference:
 * https://super-memory.com/english/ol/sm2.htm
 */

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;

// The app grades recall as a binary correct/incorrect. Map onto the SM-2 0..5
// quality scale: a miss is a lapse (q<3 resets the card), a hit is a solid but
// not effortless recall (q=4 leaves ease unchanged).
export const QUALITY_INCORRECT = 2;
export const QUALITY_CORRECT = 4;

export function qualityFromCorrect(correct) {
    return correct ? QUALITY_CORRECT : QUALITY_INCORRECT;
}

function clampQuality(q) {
    const n = Math.round(Number(q));
    if (!Number.isFinite(n)) return 0;
    return Math.min(5, Math.max(0, n));
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Advance a card's schedule by one review.
 *
 * @param {{ easeFactor?: number, interval?: number, repetitions?: number }} state
 *        prior schedule state; missing/invalid fields fall back to a fresh card.
 * @param {number} quality  recall grade, 0..5 (values outside are clamped).
 * @param {Date}   [now]     review time, for the returned dueDate.
 * @returns {{ easeFactor: number, interval: number, repetitions: number,
 *            lapsed: boolean, dueDate: Date }}
 */
export function scheduleNext(state, quality, now = new Date()) {
    const q = clampQuality(quality);

    const prevEase = Number.isFinite(state?.easeFactor) ? state.easeFactor : DEFAULT_EASE;
    const prevReps = Number.isInteger(state?.repetitions) && state.repetitions > 0 ? state.repetitions : 0;
    const prevInterval = Number.isFinite(state?.interval) && state.interval > 0 ? state.interval : 0;

    // SM-2 adjusts ease on every review, in both directions, floored at 1.3.
    const easeFactor = Math.max(
        MIN_EASE,
        prevEase + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
    );

    let repetitions;
    let interval;
    let lapsed = false;

    if (q < 3) {
        // Failed recall: relearn from the start, but keep the (now lower) ease.
        lapsed = true;
        repetitions = 0;
        interval = 1;
    } else {
        repetitions = prevReps + 1;
        if (repetitions === 1) {
            interval = 1;
        } else if (repetitions === 2) {
            interval = 6;
        } else {
            interval = Math.max(1, Math.round(prevInterval * easeFactor));
        }
    }

    return {
        easeFactor: round2(easeFactor),
        interval,
        repetitions,
        lapsed,
        dueDate: new Date(now.getTime() + interval * DAY_MS),
    };
}
