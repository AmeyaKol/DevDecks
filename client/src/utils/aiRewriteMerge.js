// Merges AI-rewritten hint/explanation/code into the user's existing field content,
// appending below the original with a visible separator so the user keeps final
// editing control. Each merge is idempotent — running it twice replaces the previous
// AI block instead of stacking a second one.

const HINT_SUFFIX_MARKER = ' — AI: ';
const HINT_PREFIX_MARKER = 'AI: ';

const EXPLANATION_START = '<!-- AI-REWRITE:START -->';
const EXPLANATION_END = '<!-- AI-REWRITE:END -->';
const EXPLANATION_HEADING = '### ✨ AI Rewrite';

const CODE_START_LABEL = 'AI REWRITE START';
const CODE_END_LABEL = 'AI REWRITE END';

/**
 * Hint field cannot render newlines, so the AI portion must stay on one line.
 */
export function stripHint(hint) {
  const text = hint || '';
  const suffixIdx = text.indexOf(HINT_SUFFIX_MARKER);
  if (suffixIdx !== -1) return text.slice(0, suffixIdx);
  if (text.startsWith(HINT_PREFIX_MARKER)) return '';
  return text;
}

export function mergeRewrittenHint(currentHint, aiHint) {
  const base = stripHint(currentHint).trim();
  const ai = (aiHint || '').replace(/\r?\n+/g, '; ').trim();
  return base ? `${base}${HINT_SUFFIX_MARKER}${ai}` : `${HINT_PREFIX_MARKER}${ai}`;
}

export function stripExplanation(explanation) {
  const text = explanation || '';
  const startIdx = text.indexOf(EXPLANATION_START);
  if (startIdx === -1) return text;
  return text.slice(0, startIdx).replace(/\s+$/, '');
}

export function mergeRewrittenExplanation(currentExplanation, aiExplanation) {
  const base = stripExplanation(currentExplanation).trim();
  const ai = (aiExplanation || '').trim();
  const block = `${EXPLANATION_START}\n\n---\n\n${EXPLANATION_HEADING}\n\n${ai}\n\n${EXPLANATION_END}`;
  return base ? `${base}\n\n${block}` : block;
}

function commentPrefixForLanguage(language) {
  return language === 'python' ? '#' : '//';
}

function codeStartLine(language) {
  return `${commentPrefixForLanguage(language)} --- ${CODE_START_LABEL} ---`;
}

function codeEndLine(language) {
  return `${commentPrefixForLanguage(language)} --- ${CODE_END_LABEL} ---`;
}

export function stripCode(code, language) {
  const text = code || '';
  const idx = text.indexOf(codeStartLine(language));
  if (idx === -1) return text;
  return text.slice(0, idx).replace(/\s+$/, '');
}

export function mergeRewrittenCode(currentCode, aiCode, language) {
  const base = stripCode(currentCode, language).trim();
  const ai = (aiCode || '').trim();
  const block = `${codeStartLine(language)}\n${ai}\n${codeEndLine(language)}`;
  return base ? `${base}\n\n${block}` : block;
}

/**
 * Merge all three fields at once from a `rewriteCardContent` API result.
 */
export function mergeRewrittenCard({ hint, explanation, code, language }, rewritten) {
  return {
    hint: mergeRewrittenHint(hint, rewritten.hint),
    explanation: mergeRewrittenExplanation(explanation, rewritten.explanation),
    code: mergeRewrittenCode(code, rewritten.code, language),
  };
}
