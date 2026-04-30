import Flashcard from '../models/Flashcard.js';

export const getGraph = async (req, res) => {
    try {
        const { minConfidence = 0.25, limit = 500 } = req.query;
        const query = {
            $or: [{ isPublic: true }, { user: req.user._id }],
            'topicNodes.0': { $exists: true },
        };

        const cards = await Flashcard.find(query)
            .select('question topicNodes type decks')
            .limit(Math.min(Number(limit) || 500, 1000))
            .lean();

        const { nodes, edges } = buildGraph(cards, Number(minConfidence));

        res.json({
            success: true,
            graph: { nodes, edges },
            summary: { nodeCount: nodes.length, edgeCount: edges.length },
        });
    } catch (error) {
        console.error('Error in getGraph:', error);
        res.status(500).json({ error: 'Failed to build graph', message: error.message });
    }
};

export const getGraphByDeck = async (req, res) => {
    try {
        const { deckId } = req.params;
        const { minConfidence = 0.25 } = req.query;

        const cards = await Flashcard.find({
            decks: deckId,
            'topicNodes.0': { $exists: true },
        })
            .select('question topicNodes type decks')
            .lean();

        const { nodes, edges } = buildGraph(cards, Number(minConfidence));

        res.json({
            success: true,
            graph: { nodes, edges },
            summary: { nodeCount: nodes.length, edgeCount: edges.length },
        });
    } catch (error) {
        console.error('Error in getGraphByDeck:', error);
        res.status(500).json({ error: 'Failed to build deck graph', message: error.message });
    }
};

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
