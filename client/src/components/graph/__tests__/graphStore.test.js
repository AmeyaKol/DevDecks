import useGraphStore from '../../../store/graphStore';

beforeEach(() => {
    useGraphStore.getState().resetGraph();
});

describe('graphStore', () => {
    it('has correct initial state', () => {
        const state = useGraphStore.getState();
        expect(state.nodes).toEqual([]);
        expect(state.edges).toEqual([]);
        expect(state.selectedNode).toBeNull();
        expect(state.hoveredNode).toBeNull();
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
        expect(state.layoutDirection).toBe('force');
        expect(state.filters).toEqual({
            deck: 'All',
            type: 'All',
            minConfidence: 0.25,
            search: '',
            edgeTypes: ['related_to', 'prerequisite_of', 'variant_of', 'used_in'],
            minSupport: 1,
        });
    });

    it('selectNode sets selectedNode', () => {
        useGraphStore.getState().selectNode('Binary Search');
        expect(useGraphStore.getState().selectedNode).toBe('Binary Search');
    });

    it('deselectNode clears selectedNode', () => {
        useGraphStore.getState().selectNode('Binary Search');
        useGraphStore.getState().deselectNode();
        expect(useGraphStore.getState().selectedNode).toBeNull();
    });

    it('setHoveredNode sets hoveredNode', () => {
        useGraphStore.getState().setHoveredNode('Trees');
        expect(useGraphStore.getState().hoveredNode).toBe('Trees');
    });

    it('updateFilters merges filters and bumps version', () => {
        const v0 = useGraphStore.getState()._filterVersion;
        useGraphStore.getState().updateFilters({ search: 'tree' });
        expect(useGraphStore.getState().filters.search).toBe('tree');
        expect(useGraphStore.getState().filters.deck).toBe('All');
        expect(useGraphStore.getState()._filterVersion).toBe(v0 + 1);
    });

    it('setLayoutDirection updates direction', () => {
        useGraphStore.getState().setLayoutDirection('hierarchical');
        expect(useGraphStore.getState().layoutDirection).toBe('hierarchical');
    });

    it('resetGraph restores initial state', () => {
        useGraphStore.getState().selectNode('Trees');
        useGraphStore.getState().updateFilters({ search: 'test' });
        useGraphStore.getState().setLayoutDirection('radial');
        useGraphStore.getState().resetGraph();

        const state = useGraphStore.getState();
        expect(state.selectedNode).toBeNull();
        expect(state.filters.search).toBe('');
        expect(state.layoutDirection).toBe('force');
    });

    it('getFilteredGraph filters by search', () => {
        useGraphStore.setState({
            nodes: [
                { topic: 'Binary Search', support: 12 },
                { topic: 'Trees', support: 14 },
                { topic: 'Binary Trees', support: 8 },
            ],
            edges: [
                { source: 'Binary Search', target: 'Trees', edgeType: 'related_to', weight: 3 },
                { source: 'Trees', target: 'Binary Trees', edgeType: 'variant_of', weight: 2 },
            ],
        });

        useGraphStore.getState().updateFilters({ search: 'binary' });
        const filtered = useGraphStore.getState().getFilteredGraph();

        expect(filtered.nodes).toHaveLength(2);
        expect(filtered.nodes.map((n) => n.topic)).toContain('Binary Search');
        expect(filtered.nodes.map((n) => n.topic)).toContain('Binary Trees');
        expect(filtered.edges).toHaveLength(0);
    });

    it('getFilteredGraph filters by minSupport', () => {
        useGraphStore.setState({
            nodes: [
                { topic: 'A', support: 5 },
                { topic: 'B', support: 2 },
                { topic: 'C', support: 10 },
            ],
            edges: [
                { source: 'A', target: 'B', edgeType: 'related_to', weight: 1 },
                { source: 'A', target: 'C', edgeType: 'related_to', weight: 1 },
            ],
        });

        useGraphStore.getState().updateFilters({ minSupport: 5 });
        const filtered = useGraphStore.getState().getFilteredGraph();

        expect(filtered.nodes).toHaveLength(2);
        expect(filtered.nodes.map((n) => n.topic)).toEqual(['A', 'C']);
        expect(filtered.edges).toHaveLength(1);
    });

    it('getFilteredGraph filters by edgeTypes', () => {
        useGraphStore.setState({
            nodes: [
                { topic: 'A', support: 5 },
                { topic: 'B', support: 5 },
                { topic: 'C', support: 5 },
            ],
            edges: [
                { source: 'A', target: 'B', edgeType: 'related_to', weight: 1 },
                { source: 'B', target: 'C', edgeType: 'prerequisite_of', weight: 1 },
            ],
        });

        useGraphStore.getState().updateFilters({ edgeTypes: ['prerequisite_of'] });
        const filtered = useGraphStore.getState().getFilteredGraph();

        expect(filtered.edges).toHaveLength(1);
        expect(filtered.edges[0].edgeType).toBe('prerequisite_of');
    });

    it('getFilteredGraph returns all when no search', () => {
        useGraphStore.setState({
            nodes: [
                { topic: 'A', support: 1 },
                { topic: 'B', support: 2 },
            ],
            edges: [{ source: 'A', target: 'B', edgeType: 'related_to', weight: 1 }],
        });

        const filtered = useGraphStore.getState().getFilteredGraph();
        expect(filtered.nodes).toHaveLength(2);
        expect(filtered.edges).toHaveLength(1);
    });

    it('getFilteredGraph removes edges with missing nodes', () => {
        useGraphStore.setState({
            nodes: [
                { topic: 'A', support: 1 },
                { topic: 'B', support: 2 },
                { topic: 'C', support: 3 },
            ],
            edges: [
                { source: 'A', target: 'B', edgeType: 'related_to', weight: 1 },
                { source: 'B', target: 'C', edgeType: 'related_to', weight: 1 },
            ],
        });

        useGraphStore.getState().updateFilters({ search: 'A' });
        const filtered = useGraphStore.getState().getFilteredGraph();
        expect(filtered.nodes).toHaveLength(1);
        expect(filtered.edges).toHaveLength(0);
    });

    it('getFilteredGraph filters edges by minConfidence', () => {
        useGraphStore.setState({
            nodes: [
                { topic: 'A', support: 5 },
                { topic: 'B', support: 5 },
                { topic: 'C', support: 5 },
            ],
            edges: [
                { source: 'A', target: 'B', edgeType: 'related_to', weight: 1, confidence: 0.8 },
                { source: 'B', target: 'C', edgeType: 'related_to', weight: 1, confidence: 0.3 },
            ],
        });

        useGraphStore.getState().updateFilters({ minConfidence: 0.5 });
        const filtered = useGraphStore.getState().getFilteredGraph();
        expect(filtered.edges).toHaveLength(1);
        expect(filtered.edges[0].source).toBe('A');
    });

    it('getFilteredGraph treats missing confidence as 1', () => {
        useGraphStore.setState({
            nodes: [
                { topic: 'A', support: 5 },
                { topic: 'B', support: 5 },
            ],
            edges: [
                { source: 'A', target: 'B', edgeType: 'related_to', weight: 1 },
            ],
        });

        useGraphStore.getState().updateFilters({ minConfidence: 0.9 });
        const filtered = useGraphStore.getState().getFilteredGraph();
        expect(filtered.edges).toHaveLength(1);
    });
});
