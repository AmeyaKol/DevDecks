// Feature flags for AI-powered features that call external/local LLM or embedding
// services. Read at server startup from env vars so a deployment can disable a
// feature without a code change — restart the process to pick up a change.
//
// Unset (or any value other than the literal string "false") => enabled. This is an
// opt-out default so existing dev/staging environments keep working unless a flag is
// explicitly turned off.
function parseFlag(value) {
    return value !== 'false';
}

export const FEATURE_FLAGS = {
    // Gates POST /api/ai/rag-tutor (Gemini call) and the RAG chat UI.
    chat: parseFlag(process.env.FEATURE_CHAT),
    // Gates POST /api/ai/rewrite-card (Gemini call) and the StudyView "AI Rewrite" button.
    aiRewrite: parseFlag(process.env.FEATURE_AI_REWRITE),
    // Gates GET /api/graph, /api/graph/deck/:deckId, and GET /api/topics/semantic, plus
    // the Knowledge Graph UI. Note: neither route calls an external LLM — /api/graph is
    // a Mongo aggregation over stored topicNodes, and /api/topics/semantic embeds the
    // query with a local Xenova model (no API cost). This flag exists to hide/disable
    // the feature itself, not to cap LLM spend.
    knowledgeGraph: parseFlag(process.env.FEATURE_KNOWLEDGE_GRAPH),
};

export default FEATURE_FLAGS;
