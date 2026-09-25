import Flashcard from '../models/Flashcard.js';
import cosineSimilarity from "cosine-similarity";
import { pipeline } from "@xenova/transformers";

/**
 * Input:
 * [
 *   { topic: "Greedy", confidence: 0.7 },
 *   { topic: "Greedy Algorithm", confidence: 0.9 }
 * ]
 *
 * Output:
 * [
 *   { topic: "Greedy Algorithm", support: 2 }
 * ]
 */

const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

export async function getEmbedding(text) {
    const output = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}

/**
 * In-process cache of label-set -> canonical-label map. `/api/graph` rebuilds
 * the whole topic map on every request; for a stable set of decks the distinct
 * topic labels don't change between loads, so the MiniLM embeddings + O(n^2)
 * clustering only need to run once. Keyed by the sorted distinct-label set so a
 * different deck selection (different labels) misses and rebuilds.
 *
 * Redis (services/cache.js) is not used here: it's unconfigured in dev/test and
 * the payload is per-instance derived data, not shared truth.
 */
const TOPIC_MAP_CACHE_TTL_MS = 10 * 60 * 1000;
const TOPIC_MAP_CACHE_MAX = 50;
const topicMapCache = new Map();

function distinctLabelsKey(labels) {
    return [...labels].sort().join('');
}

function readTopicMapCache(key) {
    const hit = topicMapCache.get(key);
    if (!hit) return null;
    if (hit.expiresAt < Date.now()) {
        topicMapCache.delete(key);
        return null;
    }
    // Re-insert to keep most-recently-used at the tail for eviction.
    topicMapCache.delete(key);
    topicMapCache.set(key, hit);
    return new Map(hit.entries);
}

function writeTopicMapCache(key, map) {
    topicMapCache.set(key, {
        entries: [...map.entries()],
        expiresAt: Date.now() + TOPIC_MAP_CACHE_TTL_MS,
    });
    while (topicMapCache.size > TOPIC_MAP_CACHE_MAX) {
        topicMapCache.delete(topicMapCache.keys().next().value);
    }
}

/** Test hook: drop the in-process topic-map cache. */
export function _clearTopicMapCache() {
    topicMapCache.clear();
}

function clusterTopics(topicNodes, threshold = 0.75) {
    const clusters = [];

    for (const node of topicNodes) {
        let assigned = false;

        for (const cluster of clusters) {
            const sim = Math.max(
                ...cluster.nodes.map(n =>
                    cosineSimilarity(node.embedding, n.embedding)
                )
            );

            if (sim >= threshold) {
                // merge into cluster
                cluster.nodes.push(node);

                // update centroid (average)
                cluster.centroid = averageVectors(cluster.nodes.map(n => n.embedding));

                assigned = true;
                break;
            }
        }

        if (!assigned) {
            clusters.push({
                nodes: [node],
                centroid: node.embedding,
            });
        }
    }

    return clusters.map(c => mergeCluster(c));
}

/* =========================
   HELPERS
========================= */

function averageVectors(vectors) {
    const length = vectors[0].length;
    const avg = new Array(length).fill(0);

    for (const vec of vectors) {
        for (let i = 0; i < length; i++) {
            avg[i] += vec[i];
        }
    }

    return avg.map(v => v / vectors.length);
}

function mergeCluster(cluster) {
    // choose best representative
    const best = cluster.nodes.reduce((a, b) =>
        a.confidence > b.confidence ? a : b
    );

    return {
        topic: best.topic,
        confidence: best.confidence,
        edgeType: best.edgeType,
        support: cluster.nodes.length,
        members: cluster.nodes.map(n => n.topic)
    };
}

export async function buildGlobalTopicMap(cards) {
    // Collapse to one representative node per distinct (lowercased) label before
    // embedding. The old code embedded every topicNode of every card, so a
    // 500-card selection with 40 distinct topics ran 500+ sequential MiniLM
    // inferences per request instead of 40.
    const byLabel = new Map();
    for (const card of cards) {
        for (const t of card.topicNodes || []) {
            const label = String(t.topic || '').toLowerCase().trim();
            if (!label) continue;
            const existing = byLabel.get(label);
            if (!existing || (t.confidence || 0) > (existing.confidence || 0)) {
                byLabel.set(label, { ...t, topic: label });
            }
        }
    }

    if (byLabel.size === 0) {
        return new Map();
    }

    const cacheKey = distinctLabelsKey(byLabel.keys());
    const cached = readTopicMapCache(cacheKey);
    if (cached) {
        return cached;
    }

    const allTopics = [];
    for (const node of byLabel.values()) {
        // Prefer a persisted topic embedding when the card carries one; only
        // fall back to a live MiniLM call for labels indexed before embeddings
        // were stored.
        const embedding = Array.isArray(node.embedding) && node.embedding.length
            ? node.embedding
            : await getEmbedding(node.topic);
        allTopics.push({ ...node, embedding });
    }

    const clusters = clusterTopics(allTopics);
    const map = new Map();

    for (const cluster of clusters) {
        const canonical = cluster.topic.toLowerCase();

        for (const member of cluster.members || []) {
            map.set(member.toLowerCase(), canonical);
        }
    }

    writeTopicMapCache(cacheKey, map);
    return map;
}

export function applyTopicMap_returncard(cards, topicMap) {
    for (const card of cards) {
        card.topicNodes = card.topicNodes.map(t => ({
            ...t,
            topic: topicMap.get(t.topic.toLowerCase()) || t.topic,
        }));
    }

    return cards;
}

export async function applyTopicMap(cards, topicMap) {
    for (const card of cards) {
        const updated = card.topicNodes.map((t) => ({
            ...t,
            topic: topicMap.get(t.topic.toLowerCase()) || t.topic,
        }));

        // Re-clustering topic labels is a maintenance rewrite, not a user edit —
        // don't advance updatedAt (the EOD queue keys off it).
        await Flashcard.updateOne(
            { _id: card._id },
            { $set: { topicNodes: updated } },
            { timestamps: false }
        );
    }
}