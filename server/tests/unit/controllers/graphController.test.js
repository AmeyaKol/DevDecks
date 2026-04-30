import { jest, expect } from '@jest/globals';

const mockCards = [
    {
        _id: '1',
        question: 'What is BFS?',
        topicNodes: [
            { topic: 'BFS', confidence: 0.9, edgeType: 'related_to' },
            { topic: 'Graph Algorithms', confidence: 0.8, edgeType: 'prerequisite_of' },
        ],
        type: 'DSA',
        decks: ['deck1'],
    },
    {
        _id: '2',
        question: 'What is DFS?',
        topicNodes: [
            { topic: 'DFS', confidence: 0.85, edgeType: 'related_to' },
            { topic: 'Graph Algorithms', confidence: 0.8, edgeType: 'prerequisite_of' },
        ],
        type: 'DSA',
        decks: ['deck1'],
    },
    {
        _id: '3',
        question: 'Low confidence topic',
        topicNodes: [
            { topic: 'Obscure', confidence: 0.1, edgeType: 'related_to' },
        ],
        type: 'DSA',
        decks: [],
    },
];

const leanFn = jest.fn(() => Promise.resolve(mockCards));
const limitFn = jest.fn(() => ({ lean: leanFn }));
const selectFn = jest.fn(() => ({ limit: limitFn, lean: leanFn }));
const mockFind = jest.fn(() => ({ select: selectFn }));

jest.unstable_mockModule('../../../models/Flashcard.js', () => ({
    default: { find: mockFind },
}));

let getGraph, getGraphByDeck;

beforeAll(async () => {
    const mod = await import('../../../controllers/graphController.js');
    getGraph = mod.getGraph;
    getGraphByDeck = mod.getGraphByDeck;
});

const buildMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('graphController', () => {
    describe('getGraph', () => {
        it('returns graph with nodes and edges', async () => {
            const req = {
                query: { minConfidence: '0.25', limit: '500' },
                user: { _id: 'user1' },
            };
            const res = buildMockRes();

            await getGraph(req, res);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.graph).toHaveProperty('nodes');
            expect(response.graph).toHaveProperty('edges');
            expect(response.summary).toHaveProperty('nodeCount');
            expect(response.summary).toHaveProperty('edgeCount');
        });

        it('filters by minConfidence', async () => {
            const req = {
                query: { minConfidence: '0.85', limit: '500' },
                user: { _id: 'user1' },
            };
            const res = buildMockRes();

            await getGraph(req, res);

            const response = res.json.mock.calls[0][0];
            const topics = response.graph.nodes.map((n) => n.topic);
            expect(topics).not.toContain('Obscure');
        });

        it('builds edges between co-occurring topics', async () => {
            const req = {
                query: { minConfidence: '0.25', limit: '500' },
                user: { _id: 'user1' },
            };
            const res = buildMockRes();

            await getGraph(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.graph.edges.length).toBeGreaterThan(0);
            const graphAlgEdges = response.graph.edges.filter(
                (e) => e.source === 'BFS' || e.target === 'BFS'
            );
            expect(graphAlgEdges.length).toBeGreaterThan(0);
        });

        it('returns correct summary counts', async () => {
            const req = {
                query: { minConfidence: '0.25', limit: '500' },
                user: { _id: 'user1' },
            };
            const res = buildMockRes();

            await getGraph(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.summary.nodeCount).toBe(response.graph.nodes.length);
            expect(response.summary.edgeCount).toBe(response.graph.edges.length);
        });
    });

    describe('getGraphByDeck', () => {
        it('returns graph scoped to deck', async () => {
            const req = {
                params: { deckId: 'deck1' },
                query: { minConfidence: '0.25' },
            };
            const res = buildMockRes();

            await getGraphByDeck(req, res);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.graph).toHaveProperty('nodes');
            expect(response.graph).toHaveProperty('edges');
        });
    });
});
