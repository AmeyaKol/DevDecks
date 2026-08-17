// Feature flags for AI-powered features. Controls whether the associated UI (nav
// links, routes, buttons) renders at all.
//
// CRA inlines REACT_APP_* vars into the JS bundle at BUILD time, not at server
// start — changing one of these in .env requires a rebuild (`npm run build` /
// restarting `npm start`), not just a process restart.
//
// This only hides the UI. The corresponding API routes are gated independently on
// the server (see server/config/featureFlags.js) — a client flag alone can't stop
// someone from calling the endpoint directly with a valid token.
//
// Unset (or any value other than the literal string "false") => enabled. This is an
// opt-out default so existing dev environments keep working unless a flag is
// explicitly turned off.
function parseFlag(value) {
  return value !== 'false';
}

export const FEATURE_FLAGS = {
  chat: parseFlag(process.env.REACT_APP_FEATURE_CHAT),
  aiRewrite: parseFlag(process.env.REACT_APP_FEATURE_AI_REWRITE),
  knowledgeGraph: parseFlag(process.env.REACT_APP_FEATURE_KNOWLEDGE_GRAPH),
};

export default FEATURE_FLAGS;
