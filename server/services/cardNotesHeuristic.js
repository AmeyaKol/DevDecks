/**
 * "Did the learner actually take notes on this card?"
 *
 * Alternative ingestion paths (YouTube playlist / split-card imports in the web
 * client and the Chrome extension) create skeleton cards with a placeholder
 * `explanation` so the required field validates. Those shouldn't show up in a
 * revision queue until the learner fills them in.
 *
 * This is derived purely from card content — no schema flag — so it applies
 * retroactively to every card and to ingestion paths this repo doesn't own.
 * The sentinels below are the exact strings those importers write.
 */

const SENTINEL_EXPLANATIONS = new Set([
    'enter explanation here',
    'enter your explanation here',
    'add explanation here',
    'add your notes here',
    'no explanation',
    'n a', // "n/a" after punctuation stripping
]);

// Trailing chapter timestamp the split-card importers append, e.g.
// "Two Pointers: [12:34]" or "Intro [1:02:03]".
const TRAILING_TIMESTAMP = /:?\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*$/;

function normalize(text = '') {
    return String(text)
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // markdown link -> its label
        .replace(/[#>*_`~|]+/g, ' ') // markdown syntax
        .replace(/[.,;:!?()"'/\\-]+/g, ' ') // punctuation (so "n/a" / "N.A." collapse)
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

/**
 * @param {{ explanation?: string, question?: string, problemStatement?: string, code?: string }} card
 * @returns {boolean} true unless the card is a recognisable auto-generated skeleton
 */
export function hasUserNotes(card = {}) {
    // Any structured content is a deliberate contribution.
    if (String(card.problemStatement || '').trim()) return true;
    if (String(card.code || '').trim()) return true;

    const explanationRaw = String(card.explanation || '');
    // Strip the timestamp marker before normalising so "Title: [12:34]" reduces
    // to just the title.
    const explanation = normalize(explanationRaw.replace(TRAILING_TIMESTAMP, ''));
    if (!explanation) return false;

    const normalizedFull = normalize(explanationRaw);
    if (SENTINEL_EXPLANATIONS.has(explanation) || SENTINEL_EXPLANATIONS.has(normalizedFull)) {
        return false;
    }

    // Split-card skeleton: the "explanation" is just the chapter title, which is
    // also the question.
    const question = normalize(card.question);
    if (question && explanation === question) return false;

    return true;
}

export default { hasUserNotes };
