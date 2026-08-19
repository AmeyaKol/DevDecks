// server/services/fieldConfigService.js
//
// Single source of truth for how a deck's card fields are structured. Named
// deck types (DSA, System Design, Behavioral, Technical Knowledge, Other)
// share one standard field list today, described here (not enforced in the
// schema) so resolveFieldConfig() can infer it for legacy decks that have no
// stored fieldConfig -- this is what makes Custom decks additive rather than
// a migration. GRE-Word/GRE-MCQ decks are intentionally excluded: they keep
// their existing bespoke rendering/validation untouched.

// "style content" is deliberately not a content type here -- it's a per-field
// presentation attribute (Deck.js's fieldDefSchema.style: plain/callout/accent)
// applied on top of any of these 5, not a 7th thing to author content in.
export const FIELD_TYPES = ['text', 'link', 'markdown', 'code', 'mcq'];
export const FIELD_ROLES = ['prompt', 'answer', 'hint'];
export const MAX_CUSTOM_FIELDS = 6;

// Fields every non-GRE named deck type renders today (FlashcardForm/StudyView).
// `role` classifies each field for study/test mode: 'prompt' fields appear on
// the question side, 'answer' fields on the reveal side, 'hint' is optional.
export const STANDARD_TEMPLATE_FIELDS = [
    { name: 'problemStatement', displayName: 'Problem Statement', type: 'markdown', role: 'prompt', required: false, order: 0 },
    { name: 'question', displayName: 'Question', type: 'text', role: 'prompt', required: true, order: 1 },
    { name: 'hint', displayName: 'Hint', type: 'text', role: 'hint', required: false, order: 2 },
    { name: 'code', displayName: 'Code', type: 'code', role: 'answer', required: false, order: 3, language: 'python' },
    { name: 'explanation', displayName: 'Explanation', type: 'markdown', role: 'answer', required: true, order: 4 },
    { name: 'link', displayName: 'Link', type: 'link', role: 'answer', required: false, order: 5 },
];

const STANDARD_TYPES = new Set(['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other']);
const GRE_TYPES = new Set(['GRE-Word', 'GRE-MCQ']);

const sortByOrder = (fields) => [...(fields || [])].sort((a, b) => a.order - b.order);

/**
 * Resolve the effective field list for a deck.
 * - GRE-Word/GRE-MCQ: returns null -- those types keep their existing dedicated
 *   rendering path and never go through the field-config system.
 * - Custom: always uses the deck's own stored fieldConfig (even if empty --
 *   an empty Custom deck has no fields yet, it does not fall back to the
 *   standard template).
 * - Standard named types: uses the deck's stored fieldConfig if present,
 *   otherwise infers the standard template. This is what lets legacy decks
 *   (created before this feature existed) resolve without any migration.
 */
export function resolveFieldConfig(deck) {
    if (!deck) return null;
    if (GRE_TYPES.has(deck.type)) return null;

    if (deck.type === 'Custom') {
        return { fields: sortByOrder(deck.fieldConfig?.fields) };
    }

    if (STANDARD_TYPES.has(deck.type)) {
        if (deck.fieldConfig?.fields?.length) {
            return { fields: sortByOrder(deck.fieldConfig.fields) };
        }
        return { fields: sortByOrder(STANDARD_TEMPLATE_FIELDS) };
    }

    return null;
}

function stringifyFieldValue(field, value) {
    if (value === undefined || value === null) return '';
    if (field.type === 'mcq') {
        const options = Array.isArray(value.options) ? value.options : [];
        return options
            .map((opt) => `${opt.isCorrect ? '[correct] ' : ''}${opt.text || ''}`.trim())
            .filter(Boolean)
            .join('; ');
    }
    if (typeof value === 'string') return value;
    return String(value);
}

/**
 * Validate fieldData against a resolved fieldConfig. Returns an array of
 * human-readable error strings; empty array means valid.
 */
export function validateFieldData(fieldConfig, fieldData) {
    const errors = [];
    const fields = fieldConfig?.fields || [];
    const data = fieldData || {};

    for (const field of fields) {
        const value = data[field.name];
        const isEmpty = value === undefined || value === null ||
            (typeof value === 'string' && value.trim() === '') ||
            (field.type === 'mcq' && !(Array.isArray(value?.options) && value.options.length > 0));

        if (field.required && isEmpty) {
            errors.push(`Field "${field.displayName}" is required`);
            continue;
        }
        if (isEmpty) continue;

        if (field.type === 'mcq') {
            if (!Array.isArray(value.options)) {
                errors.push(`Field "${field.displayName}" must have an options array`);
                continue;
            }
            const correctCount = value.options.filter((opt) => opt.isCorrect).length;
            if (correctCount === 0) {
                errors.push(`Field "${field.displayName}" needs at least one correct option`);
            }
            if (value.mcqType === 'single-correct' && correctCount > 1) {
                errors.push(`Field "${field.displayName}" allows only one correct option`);
            }
        }
    }

    return errors;
}

/**
 * Derive question/explanation from role-tagged fieldData so Flashcard.question
 * and Flashcard.explanation can stay required with no schema/service changes --
 * every AI-pipeline consumer only ever needed a non-empty representative string.
 */
export function deriveQuestionAndExplanation(fieldConfig, fieldData) {
    const fields = sortByOrder(fieldConfig?.fields);
    const data = fieldData || {};

    const promptFields = fields.filter((f) => f.role === 'prompt');
    const answerFields = fields.filter((f) => f.role === 'answer');

    const renderFields = (list) => list
        .map((field) => stringifyFieldValue(field, data[field.name]))
        .filter((text) => text.trim().length > 0)
        .join('\n\n');

    let question = renderFields(promptFields);
    if (!question) {
        // Fall back to the first field with any content so a Custom card with
        // no 'prompt'-role field still saves rather than failing validation.
        question = renderFields(fields);
    }

    const explanation = renderFields(answerFields);

    return { question, explanation };
}

/**
 * Which field values should be scanned for an embedded YouTube link -- the
 * generalization of StudyView's hardcoded link/explanation/problemStatement
 * scan, per the "video is emergent, not a field type" decision.
 */
export function getVideoScanFields(fieldConfig) {
    return sortByOrder(fieldConfig?.fields).filter((f) => f.type === 'link' || f.type === 'markdown');
}
