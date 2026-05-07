import useGraphLayout from '../hooks/useGraphLayout';
import { renderHook, act } from '@testing-library/react';

describe('useGraphLayout', () => {
    const sampleNodes = [
        { topic: 'A', support: 5 },
        { topic: 'B', support: 3 },
        { topic: 'C', support: 8 },
    ];
    const sampleEdges = [
        { source: 'A', target: 'B', edgeType: 'related_to', weight: 2 },
        { source: 'B', target: 'C', edgeType: 'prerequisite_of', weight: 4 },
    ];

    it('returns computeLayout and clearCache functions', () => {
        const { result } = renderHook(() => useGraphLayout());
        expect(typeof result.current.computeLayout).toBe('function');
        expect(typeof result.current.clearCache).toBe('function');
    });

    it('computes force layout with positioned nodes', async () => {
        const { result } = renderHook(() => useGraphLayout());
        let layout;
        await act(async () => {
            layout = await result.current.computeLayout(sampleNodes, sampleEdges, 'force');
        });

        expect(layout.nodes).toHaveLength(3);
        expect(layout.edges).toHaveLength(2);
        layout.nodes.forEach((node) => {
            expect(node).toHaveProperty('id');
            expect(node).toHaveProperty('position');
            expect(node).toHaveProperty('type', 'topicNode');
            expect(typeof node.position.x).toBe('number');
            expect(typeof node.position.y).toBe('number');
            expect(node.data).toHaveProperty('topic');
            expect(node.data).toHaveProperty('support');
        });
    });

    it('computes hierarchical layout', async () => {
        const { result } = renderHook(() => useGraphLayout());
        let layout;
        await act(async () => {
            layout = await result.current.computeLayout(sampleNodes, sampleEdges, 'hierarchical');
        });

        expect(layout.nodes).toHaveLength(3);
        expect(layout.edges).toHaveLength(2);
    });

    it('computes radial layout', async () => {
        const { result } = renderHook(() => useGraphLayout());
        let layout;
        await act(async () => {
            layout = await result.current.computeLayout(sampleNodes, sampleEdges, 'radial');
        });

        expect(layout.nodes).toHaveLength(3);
    });

    it('returns empty arrays for empty input', async () => {
        const { result } = renderHook(() => useGraphLayout());
        let layout;
        await act(async () => {
            layout = await result.current.computeLayout([], [], 'force');
        });

        expect(layout.nodes).toEqual([]);
        expect(layout.edges).toEqual([]);
    });

    it('caches layout results', async () => {
        const { result } = renderHook(() => useGraphLayout());
        let layout1, layout2;
        await act(async () => {
            layout1 = await result.current.computeLayout(sampleNodes, sampleEdges, 'force');
            layout2 = await result.current.computeLayout(sampleNodes, sampleEdges, 'force');
        });

        expect(layout1).toBe(layout2);
    });

    it('clearCache resets the cache', async () => {
        const { result } = renderHook(() => useGraphLayout());
        let layout1, layout2;
        await act(async () => {
            layout1 = await result.current.computeLayout(sampleNodes, sampleEdges, 'force');
            result.current.clearCache();
            layout2 = await result.current.computeLayout(sampleNodes, sampleEdges, 'force');
        });

        expect(layout1).not.toBe(layout2);
        expect(layout1.nodes).toHaveLength(layout2.nodes.length);
    });

    it('edges have correct type and data', async () => {
        const { result } = renderHook(() => useGraphLayout());
        let layout;
        await act(async () => {
            layout = await result.current.computeLayout(sampleNodes, sampleEdges, 'force');
        });

        layout.edges.forEach((edge) => {
            expect(edge.type).toBe('relationshipEdge');
            expect(edge.data).toHaveProperty('edgeType');
            expect(edge.data).toHaveProperty('weight');
        });
    });
});
