import Flashcard from '../models/Flashcard.js';
import cosineSimilarity from 'cosine-similarity';

const DEFAULT_MIN_CONF = 0.25;
const SCORE_THRESHOLD = 0.7;
const MAX_CARDS_SCAN = 2000;
const TOP_CARDS = 15;

/**
 * GET /api/topics/semantic?q=... — subgraph from cards whose topic labels match the query
 * by cosine similarity to `topicNodes[].embedding` (when present). Auth: same visibility as /api/graph.
 */
export async function semanticKGSearch(req, res) {
    try {
        const q = req.query.q;
        if (!q || !String(q).trim()) {
            return res.status(400).json({ error: 'Missing query' });
        }

        const minConfidence = Math.min(
            1,
            Math.max(0, Number(req.query.minConfidence) || DEFAULT_MIN_CONF)
        );

        const { getEmbedding } = await import('../services/topicClusteringService.js');
        const queryVec = await getEmbedding(String(q).trim());

        const cardQuery = {
            $or: [{ isPublic: true }, { user: req.user._id }],
            'topicNodes.0': { $exists: true },
        };

        const cards = await Flashcard.find(cardQuery)
            .select('topicNodes decks')
            .limit(MAX_CARDS_SCAN)
            .lean();

        const matchedCards = [];

        for (const card of cards) {
            let bestScore = 0;

            for (const topicNode of card.topicNodes || []) {
                const emb = topicNode.embedding;
                if (!emb?.length) continue;

                const score = cosineSimilarity(queryVec, emb);
                bestScore = Math.max(bestScore, score);
            }

            if (bestScore > SCORE_THRESHOLD) {
                matchedCards.push({ card, score: bestScore });
            }
        }

        matchedCards.sort((a, b) => b.score - a.score);
        const topCards = matchedCards.slice(0, TOP_CARDS).map((x) => x.card);

        const graph = buildGraph(topCards, minConfidence);

        res.json({
            success: true,
            graph,
            summary: {
                nodeCount: graph.nodes.length,
                edgeCount: graph.edges.length,
            },
        });
    } catch (err) {
        console.error('semanticKGSearch:', err);
        res.status(500).json({ error: err.message || 'Semantic search failed' });
    }
}

function buildGraph(cards, minConfidence) {
    const nodeMap = new Map();
    const nodeDeckMap = new Map();
    const edgeMap = new Map();

    for (const card of cards) {
        const nodes = (card.topicNodes || []).filter(
            (n) => n.confidence >= minConfidence
        );
        const cardDecks = card.decks || [];

        for (const node of nodes) {
            nodeMap.set(node.topic, (nodeMap.get(node.topic) || 0) + 1);
            if (!nodeDeckMap.has(node.topic)) {
                nodeDeckMap.set(node.topic, new Set());
            }
            for (const d of cardDecks) {
                nodeDeckMap.get(node.topic).add(String(d));
            }
        }

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i].topic;
                const b = nodes[j].topic;
                const key = [a, b].sort().join('::');
                const edgeType = nodes[i].edgeType || nodes[j].edgeType || 'related_to';
                const existing = edgeMap.get(key);
                if (existing) {
                    existing.weight += 1;
                } else {
                    edgeMap.set(key, { edgeType, weight: 1 });
                }
            }
        }
    }

    const graphNodes = [...nodeMap.entries()].map(([topic, support]) => ({
        topic,
        support,
        deckCount: nodeDeckMap.get(topic)?.size || 0,
    }));

    const graphEdges = [...edgeMap.entries()].map(([pair, { edgeType, weight }]) => {
        const [source, target] = pair.split('::');
        return { source, target, edgeType, weight };
    });

    return { nodes: graphNodes, edges: graphEdges };
}
