import logger from '../utils/logger.js';
import Flashcard from '../models/Flashcard.js';
import {
    buildSemanticArtifacts,
    computeCardContentHash,
    getEmbeddingModelName,
} from './embeddingService.js';

const DEFAULT_BATCH_SIZE = 50;

function shouldSkip(card, currentHash, targetModel, force) {
    if (force) return false;
    const meta = card.embeddingMeta;
    if (!meta) return false;
    return (
        meta.contentHash === currentHash
        && meta.model === targetModel
        && meta.status === 'ok'
    );
}

/**
 * Reembed flashcards matching `filter`. Idempotent: skips cards whose stored
 * `embeddingMeta.contentHash` and `model` already match the current target.
 *
 * @param {Object}   [opts]
 * @param {Object}   [opts.filter]      any Mongo filter for Flashcard.find
 * @param {boolean}  [opts.force]       reembed even if hash+model match
 * @param {number}   [opts.batchSize]   reembed N cards per batch (default 50)
 * @param {number}   [opts.limit]       cap on total cards processed
 * @param {boolean}  [opts.dryRun]      report counts only, no DB writes
 * @param {Function} [opts.onProgress]  called with cumulative counts after each batch
 * @returns {Promise<{ processed: number, skipped: number, failed: number, durationMs: number, model: string }>}
 */
export async function reindexCards({
    filter = {},
    force = false,
    batchSize = DEFAULT_BATCH_SIZE,
    limit = null,
    dryRun = false,
    onProgress = () => {},
} = {}) {
    const startedAt = Date.now();
    const targetModel = getEmbeddingModelName();
    const counters = { processed: 0, skipped: 0, failed: 0 };

    const cursor = Flashcard.find(filter).cursor({ batchSize: Math.max(1, batchSize) });

    let buffer = [];
    const flush = async () => {
        if (!buffer.length) return;
        const batch = buffer;
        buffer = [];

        const work = batch.map((card) => {
            const contentHash = computeCardContentHash({
                question: card.question,
                explanation: card.explanation,
                problemStatement: card.problemStatement,
                code: card.code,
                tags: card.tags,
            });
            return { card, contentHash };
        });

        for (const item of work) {
            const { card, contentHash } = item;
            if (shouldSkip(card, contentHash, targetModel, force)) {
                counters.skipped += 1;
                continue;
            }

            if (dryRun) {
                counters.processed += 1;
                continue;
            }

            try {
                const artifacts = await buildSemanticArtifacts(
                    {
                        question: card.question,
                        explanation: card.explanation,
                        problemStatement: card.problemStatement,
                        code: card.code,
                        tags: card.tags,
                    },
                    { cardId: card._id, allowFallback: false },
                );

                card.embeddingVersion = artifacts.embeddingVersion;
                card.cardEmbedding = artifacts.cardEmbedding;
                card.embeddingMeta = artifacts.embeddingMeta;
                card.semanticChunks = artifacts.semanticChunks;
                card.topicNodes = artifacts.topics.map((topicNode) => ({
                    ...topicNode,
                    edgeType: 'related_to',
                }));
                await card.save();
                counters.processed += 1;
            } catch (err) {
                logger?.error?.('reindexCards: failed to embed card', {
                    cardId: card._id?.toString(),
                    message: err?.message,
                });
                try {
                    card.embeddingMeta = {
                        contentHash,
                        embeddedAt: new Date(),
                        model: targetModel,
                        dimension: card.embeddingMeta?.dimension || 0,
                        tokenCount: 0,
                        status: 'failed',
                        error: err?.message?.slice(0, 500) || 'unknown error',
                    };
                    await card.save();
                } catch (persistErr) {
                    logger?.error?.('reindexCards: failed to persist failure status', {
                        cardId: card._id?.toString(),
                        message: persistErr?.message,
                    });
                }
                counters.failed += 1;
            }
        }

        onProgress({ ...counters });
    };

    let total = 0;
    for await (const card of cursor) {
        if (limit && total >= limit) {
            break;
        }
        total += 1;
        buffer.push(card);
        if (buffer.length >= batchSize) {
            await flush();
        }
    }
    await flush();

    return {
        ...counters,
        durationMs: Date.now() - startedAt,
        model: targetModel,
    };
}
