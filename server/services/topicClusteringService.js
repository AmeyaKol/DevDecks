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
    const allTopics = [];

    for (const card of cards) {
        for (const t of card.topicNodes) {
            const embedding = await getEmbedding(t.topic);

            allTopics.push({
                ...t,
                topic: t.topic.toLowerCase(), // normalize here
                embedding,
            });
        }
    }

    const clusters = clusterTopics(allTopics);
    // console.log("=== CLUSTER QUALITY ===");

    // clusters
    //     .filter(c => c.members.length > 1)
    //     .forEach(c => {
    //         console.log(c.topic, "<--", c.members);
    //     });

    // console.log("=== CLUSTER STATS ===");
    // console.log("Total topics:", allTopics.length);
    // console.log("Total clusters:", clusters.length);
    // console.log(
    //     "Avg cluster size:",
    //     (allTopics.length / clusters.length).toFixed(2)
    // );
    const map = new Map();

    for (const cluster of clusters) {
        const canonical = cluster.topic.toLowerCase();

        for (const member of cluster.members || []) {
            map.set(member.toLowerCase(), canonical);
        }
    }

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

        await Flashcard.updateOne(
            { _id: card._id },
            { $set: { topicNodes: updated } }
        );
    }
}