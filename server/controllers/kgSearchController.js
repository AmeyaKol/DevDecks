import vectorStore from "../services/vectorStore/index.js";
import Flashcard from '../models/Flashcard.js';
import { pipeline } from "@xenova/transformers";
import cosineSimilarity from "cosine-similarity";

const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

export async function getEmbedding(text) {
    const output = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}

export async function semanticKGSearch(req, res) {

    try {

        const query = req.query.q;

        if (!query) {
            return res.status(400).json({
                error: "Missing query"
            });
        }
        console.log("query",query)
        // ------------------------------------
        // 1. Embed query
        // ------------------------------------

        const result = await getEmbedding(query);

        // ------------------------------------
        // 2. Semantic search cards
        // ------------------------------------

        // const matches = await vectorStore.semanticSearch({
        //     vector: result,
        //     topK: 10,
        // });
        const card_query = {
            'topicNodes.0': { $exists: true },
        };

        const cards = await Flashcard.find(card_query)

        console.log(cards.length)

        const matchedCards = [];

        for (const card of cards) {

            let bestScore = 0;

            for (const topicNode of card.topicNodes || []) {

                if (!topicNode.embedding?.length) continue;

                const score = cosineSimilarity(
                    result,
                    topicNode.embedding
                );

                bestScore = Math.max(bestScore, score);
            }

            if (bestScore > 0.7) {
                matchedCards.push({
                    card,
                    score: bestScore,
                });
            }
        }
        matchedCards.sort((a, b) => b.score - a.score);
        const topCards = matchedCards.slice(0, 15).map(x => x.card);
        // 3. Extract cards
        // 4. Build graph
        const graph = buildGraph(topCards);
        
        // 5. Return graph
        res.json(graph);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
}


function buildGraph(cards) {
    const nodeMap = new Map();
    const nodeDeckMap = new Map();
    const edgeMap = new Map();

    for (const card of cards) {
        const nodes = (card.topicNodes || [])
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
    // console.log("node:",graphNodes.length, "edge:", graphEdges.length)
    return { nodes: graphNodes, edges: graphEdges };
}