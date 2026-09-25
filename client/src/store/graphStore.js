import { create } from 'zustand';
import { fetchGraph as fetchGraphAPI, fetchGraphByDeck, fetchAllDecks } from '../services/api';

const MAX_CLIENT_NODES = 150;

const useGraphStore = create((set, get) => ({
    nodes: [],
    edges: [],
    selectedNode: null,
    hoveredNode: null,
    filters: {
        deck: 'All',
        type: 'All',
        minConfidence: 0.25,
        search: '',
        edgeTypes: ['related_to', 'prerequisite_of', 'variant_of', 'used_in'],
        minSupport: 1,
    },
    isLoading: false,
    error: null,
    layoutDirection: 'force',
    summary: null,
    _filterVersion: 0,
    decks: [],
    truncated: false,

    // The graph is only built for decks the user explicitly picks. `hasBuilt`
    // gates the canvas: until it flips true the page shows the deck picker
    // instead of mining topics across the entire library on mount.
    selectedDeckIds: [],
    hasBuilt: false,

    setSelectedDeckIds: (ids) => set({ selectedDeckIds: ids }),

    toggleDeckSelection: (deckId) => set((state) => ({
        selectedDeckIds: state.selectedDeckIds.includes(deckId)
            ? state.selectedDeckIds.filter((id) => id !== deckId)
            : [...state.selectedDeckIds, deckId],
    })),

    clearGraphSelection: () => set({
        hasBuilt: false,
        nodes: [],
        edges: [],
        summary: null,
        selectedNode: null,
        truncated: false,
        error: null,
    }),

    fetchDecks: async () => {
        try {
            const data = await fetchAllDecks();
            const list = Array.isArray(data) ? data : data.decks || [];
            set({ decks: list });
        } catch {
            // non-critical
        }
    },

    fetchGraph: async (options = {}) => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            set({ isLoading: false, error: null });
            return;
        }

        const { filters, selectedDeckIds } = get();
        const deckIds = options.deckIds || selectedDeckIds;

        // Nothing selected means there is nothing to build. Bail out rather
        // than falling back to mining every deck in the library.
        if (!deckIds.length) {
            set({ isLoading: false, error: null });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const limit = options.limit || 500;
            const minConfidence = options.minConfidence ?? filters.minConfidence;

            const data = deckIds.length === 1
                ? await fetchGraphByDeck(deckIds[0], { minConfidence })
                : await fetchGraphAPI({ limit, minConfidence, deckIds });

            const graph = data.graph || { nodes: [], edges: [] };
            let nodes = graph.nodes || [];
            let edges = graph.edges || [];
            let truncated = false;

            if (nodes.length > MAX_CLIENT_NODES) {
                truncated = true;
                nodes = [...nodes].sort((a, b) => b.support - a.support).slice(0, MAX_CLIENT_NODES);
                const kept = new Set(nodes.map((n) => n.topic));
                edges = edges.filter((e) => kept.has(e.source) && kept.has(e.target));
            }

            set({
                nodes,
                edges,
                summary: data.summary || null,
                isLoading: false,
                truncated,
                selectedDeckIds: deckIds,
                hasBuilt: true,
            });
        } catch (error) {
            if (error.response?.status === 401) {
                set({ isLoading: false, error: null });
                return;
            }
            set({
                error: error.response?.data?.message || error.message || 'Failed to fetch graph',
                isLoading: false,
            });
        }
    },

    selectNode: (nodeTopic) => {
        set({ selectedNode: nodeTopic });
    },

    deselectNode: () => {
        set({ selectedNode: null });
    },

    setHoveredNode: (nodeTopic) => {
        set({ hoveredNode: nodeTopic });
    },

    updateFilters: (newFilters) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
            _filterVersion: state._filterVersion + 1,
        }));
    },

    setLayoutDirection: (direction) => {
        set({ layoutDirection: direction });
    },

    resetGraph: () => {
        set({
            nodes: [],
            edges: [],
            selectedNode: null,
            hoveredNode: null,
            filters: { deck: 'All', type: 'All', minConfidence: 0.25, search: '', edgeTypes: ['related_to', 'prerequisite_of', 'variant_of', 'used_in'], minSupport: 1 },
            isLoading: false,
            error: null,
            layoutDirection: 'force',
            summary: null,
            _filterVersion: 0,
            decks: [],
            truncated: false,
            selectedDeckIds: [],
            hasBuilt: false,
        });
    },

    getFilteredGraph: () => {
        const { nodes, edges, filters } = get();
        let filteredNodes = nodes;

        if (filters.minSupport > 1) {
            filteredNodes = filteredNodes.filter((n) => n.support >= filters.minSupport);
        }

        const topicSet = new Set(filteredNodes.map((n) => n.topic));
        let filteredEdges = edges.filter(
            (e) => topicSet.has(e.source) && topicSet.has(e.target)
        );

        if (filters.edgeTypes && filters.edgeTypes.length < 4) {
            filteredEdges = filteredEdges.filter(
                (e) => filters.edgeTypes.includes(e.edgeType)
            );
        }

        filteredEdges = filteredEdges.filter(
            (e) => (e.confidence ?? 1) >= filters.minConfidence
        );

        return { nodes: filteredNodes, edges: filteredEdges };
    },
}));

export default useGraphStore;
