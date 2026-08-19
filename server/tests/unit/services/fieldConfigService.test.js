import {
  resolveFieldConfig,
  validateFieldData,
  deriveQuestionAndExplanation,
  getVideoScanFields,
  STANDARD_TEMPLATE_FIELDS,
  MAX_CUSTOM_FIELDS,
} from '../../../services/fieldConfigService.js';

describe('fieldConfigService.resolveFieldConfig', () => {
  it('returns null for GRE-Word and GRE-MCQ decks', () => {
    expect(resolveFieldConfig({ type: 'GRE-Word' })).toBeNull();
    expect(resolveFieldConfig({ type: 'GRE-MCQ' })).toBeNull();
  });

  it('infers the standard template for a legacy named deck with no fieldConfig', () => {
    const resolved = resolveFieldConfig({ type: 'DSA' });
    const expectedNames = [...STANDARD_TEMPLATE_FIELDS]
      .sort((a, b) => a.order - b.order)
      .map((f) => f.name);
    expect(resolved.fields.map((f) => f.name)).toEqual(expectedNames);
  });

  it('uses a stored fieldConfig for a named deck if one exists, sorted by order', () => {
    const deck = {
      type: 'Behavioral',
      fieldConfig: { fields: [
        { name: 'b', order: 1 },
        { name: 'a', order: 0 },
      ] },
    };
    expect(resolveFieldConfig(deck).fields.map((f) => f.name)).toEqual(['a', 'b']);
  });

  it('never falls back to the standard template for Custom decks, even when empty', () => {
    const resolved = resolveFieldConfig({ type: 'Custom', fieldConfig: { fields: [] } });
    expect(resolved.fields).toEqual([]);
  });

  it('resolves a Custom deck to its own fieldConfig fields, sorted by order', () => {
    const deck = {
      type: 'Custom',
      fieldConfig: { fields: [
        { name: 'answerField', type: 'text', role: 'answer', order: 1 },
        { name: 'promptField', type: 'text', role: 'prompt', order: 0 },
      ] },
    };
    expect(resolveFieldConfig(deck).fields.map((f) => f.name)).toEqual(['promptField', 'answerField']);
  });
});

describe('fieldConfigService.validateFieldData', () => {
  const fieldConfig = {
    fields: [
      { name: 'req', displayName: 'Required Field', type: 'text', role: 'prompt', required: true, order: 0 },
      { name: 'opt', displayName: 'Optional Field', type: 'text', role: 'answer', required: false, order: 1 },
      { name: 'mcq', displayName: 'MCQ Field', type: 'mcq', role: 'answer', required: false, order: 2 },
    ],
  };

  it('reports a missing required field', () => {
    const errors = validateFieldData(fieldConfig, {});
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('Required Field')]));
  });

  it('passes when required fields are present and optional ones are omitted', () => {
    expect(validateFieldData(fieldConfig, { req: 'hello' })).toEqual([]);
  });

  it('rejects an mcq field with zero correct options', () => {
    const errors = validateFieldData(fieldConfig, {
      req: 'hello',
      mcq: { mcqType: 'single-correct', options: [{ text: 'a', isCorrect: false }] },
    });
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('correct option')]));
  });

  it('rejects a single-correct mcq field with more than one correct option', () => {
    const errors = validateFieldData(fieldConfig, {
      req: 'hello',
      mcq: {
        mcqType: 'single-correct',
        options: [
          { text: 'a', isCorrect: true },
          { text: 'b', isCorrect: true },
        ],
      },
    });
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('only one correct option')]));
  });

  it('accepts a multiple-correct mcq field with more than one correct option', () => {
    const errors = validateFieldData(fieldConfig, {
      req: 'hello',
      mcq: {
        mcqType: 'multiple-correct',
        options: [
          { text: 'a', isCorrect: true },
          { text: 'b', isCorrect: true },
        ],
      },
    });
    expect(errors).toEqual([]);
  });

  it('caps custom decks at MAX_CUSTOM_FIELDS by convention', () => {
    expect(MAX_CUSTOM_FIELDS).toBe(6);
  });
});

describe('fieldConfigService.deriveQuestionAndExplanation', () => {
  const fieldConfig = {
    fields: [
      { name: 'prompt1', type: 'text', role: 'prompt', order: 0 },
      { name: 'answer1', type: 'markdown', role: 'answer', order: 1 },
      { name: 'hint1', type: 'text', role: 'hint', order: 2 },
    ],
  };

  it('joins prompt-role fields into question and answer-role fields into explanation', () => {
    const { question, explanation } = deriveQuestionAndExplanation(fieldConfig, {
      prompt1: 'What is a closure?',
      answer1: 'A function bundled with its lexical scope.',
      hint1: 'Think scope chain.',
    });
    expect(question).toBe('What is a closure?');
    expect(explanation).toBe('A function bundled with its lexical scope.');
  });

  it('falls back to any non-empty field when no prompt-role field has content', () => {
    const config = { fields: [{ name: 'onlyField', type: 'text', role: 'answer', order: 0 }] };
    const { question } = deriveQuestionAndExplanation(config, { onlyField: 'Only value' });
    expect(question).toBe('Only value');
  });

  it('stringifies mcq field values into a readable option list', () => {
    const config = { fields: [{ name: 'mcq', type: 'mcq', role: 'answer', order: 0 }] };
    const { explanation } = deriveQuestionAndExplanation(config, {
      mcq: { options: [{ text: 'Yes', isCorrect: true }, { text: 'No', isCorrect: false }] },
    });
    expect(explanation).toContain('[correct] Yes');
    expect(explanation).toContain('No');
  });

  it('produces an empty explanation (not a throw) when no answer-role fields have content', () => {
    const config = { fields: [{ name: 'prompt1', type: 'text', role: 'prompt', order: 0 }] };
    const { explanation } = deriveQuestionAndExplanation(config, { prompt1: 'Q' });
    expect(explanation).toBe('');
  });
});

describe('fieldConfigService.getVideoScanFields', () => {
  it('returns only link and markdown typed fields', () => {
    const fieldConfig = {
      fields: [
        { name: 'a', type: 'link', order: 0 },
        { name: 'b', type: 'code', order: 1 },
        { name: 'c', type: 'markdown', order: 2 },
        { name: 'd', type: 'text', order: 3 },
      ],
    };
    expect(getVideoScanFields(fieldConfig).map((f) => f.name)).toEqual(['a', 'c']);
  });
});
