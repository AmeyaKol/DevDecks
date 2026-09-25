import { jest, expect } from '@jest/globals';

// Stand in for the MiniLM pipeline so no model is loaded/downloaded in tests and
// we can count how often a topic label is actually embedded.
const embedCalls = [];
const mockEmbedder = jest.fn(async (text) => {
    embedCalls.push(text);
    const seed = String(text).length;
    return { data: Float32Array.from([seed % 5, (seed * 7) % 5, 1]) };
});

jest.unstable_mockModule('@xenova/transformers', () => ({
    pipeline: jest.fn(async () => mockEmbedder),
}));

// buildGlobalTopicMap never touches the model, but the module imports it.
jest.unstable_mockModule('../../../models/Flashcard.js', () => ({
    default: { updateOne: jest.fn() },
}));

let buildGlobalTopicMap;
let _clearTopicMapCache;

beforeAll(async () => {
    const mod = await import('../../../services/topicClusteringService.js');
    buildGlobalTopicMap = mod.buildGlobalTopicMap;
    _clearTopicMapCache = mod._clearTopicMapCache;
});

beforeEach(() => {
    embedCalls.length = 0;
    mockEmbedder.mockClear();
    _clearTopicMapCache();
});

const cardWithTopics = (labels) => ({
    _id: Math.random().toString(36).slice(2),
    topicNodes: labels.map((topic) => ({ topic, confidence: 0.9, edgeType: 'related_to' })),
});

describe('buildGlobalTopicMap', () => {
    it('embeds each distinct label once, not once per card occurrence', async () => {
        const cards = Array.from({ length: 40 }, () =>
            cardWithTopics(['Binary Search', 'Graph Traversal']));

        const map = await buildGlobalTopicMap(cards);

        expect(mockEmbedder).toHaveBeenCalledTimes(2);
        expect(new Set(embedCalls)).toEqual(new Set(['binary search', 'graph traversal']));
        expect(map.get('binary search')).toBeDefined();
        expect(map.get('graph traversal')).toBeDefined();
    });

    it('serves a repeat call for the same label set from cache without re-embedding', async () => {
        const first = await buildGlobalTopicMap([cardWithTopics(['Binary Search', 'DFS'])]);
        expect(mockEmbedder).toHaveBeenCalledTimes(2);

        mockEmbedder.mockClear();
        const second = await buildGlobalTopicMap([
            cardWithTopics(['DFS']),
            cardWithTopics(['Binary Search']),
        ]);

        expect(mockEmbedder).not.toHaveBeenCalled();
        expect([...second.entries()].sort()).toEqual([...first.entries()].sort());
    });

    it('rebuilds when the distinct label set changes', async () => {
        await buildGlobalTopicMap([cardWithTopics(['Binary Search'])]);
        mockEmbedder.mockClear();

        await buildGlobalTopicMap([cardWithTopics(['Binary Search', 'Dynamic Programming'])]);

        expect(mockEmbedder).toHaveBeenCalledTimes(2);
    });

    it('reuses a persisted topic embedding instead of calling the model', async () => {
        const cards = [{
            _id: 'c1',
            topicNodes: [
                { topic: 'Heaps', confidence: 0.9, embedding: [0.2, 0.1, 0.9] },
                { topic: 'Sorting', confidence: 0.8 },
            ],
        }];

        await buildGlobalTopicMap(cards);

        expect(embedCalls).toEqual(['sorting']);
    });
});
