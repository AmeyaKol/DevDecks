import mockGraphData from '../mockGraphData';

describe('mockGraphData', () => {
    it('has nodes with required fields', () => {
        expect(mockGraphData.nodes.length).toBeGreaterThan(0);
        mockGraphData.nodes.forEach((node) => {
            expect(node).toHaveProperty('topic');
            expect(node).toHaveProperty('support');
            expect(typeof node.topic).toBe('string');
            expect(typeof node.support).toBe('number');
            expect(node.support).toBeGreaterThan(0);
        });
    });

    it('has edges with required fields', () => {
        expect(mockGraphData.edges.length).toBeGreaterThan(0);
        mockGraphData.edges.forEach((edge) => {
            expect(edge).toHaveProperty('source');
            expect(edge).toHaveProperty('target');
            expect(edge).toHaveProperty('edgeType');
            expect(edge).toHaveProperty('weight');
        });
    });

    it('has valid edge types', () => {
        const validTypes = ['related_to', 'prerequisite_of', 'variant_of', 'used_in'];
        mockGraphData.edges.forEach((edge) => {
            expect(validTypes).toContain(edge.edgeType);
        });
    });

    it('has edges referencing existing nodes', () => {
        const topics = new Set(mockGraphData.nodes.map((n) => n.topic));
        mockGraphData.edges.forEach((edge) => {
            expect(topics.has(edge.source)).toBe(true);
            expect(topics.has(edge.target)).toBe(true);
        });
    });

    it('has unique node topics', () => {
        const topics = mockGraphData.nodes.map((n) => n.topic);
        expect(new Set(topics).size).toBe(topics.length);
    });

    it('has positive edge weights', () => {
        mockGraphData.edges.forEach((edge) => {
            expect(edge.weight).toBeGreaterThan(0);
        });
    });

    it('has confidence values between 0 and 1 on every edge', () => {
        mockGraphData.edges.forEach((edge) => {
            expect(edge).toHaveProperty('confidence');
            expect(edge.confidence).toBeGreaterThanOrEqual(0);
            expect(edge.confidence).toBeLessThanOrEqual(1);
        });
    });
});
