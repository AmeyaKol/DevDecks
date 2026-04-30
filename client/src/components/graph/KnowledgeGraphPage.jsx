import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import useGraphStore from '../../store/graphStore';
import GraphCanvas from './GraphCanvas';
import GraphControls from './panels/GraphControls';
import NodeDetailPanel from './panels/NodeDetailPanel';
import mockGraphData from './mockGraphData';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const KnowledgeGraphPage = () => {
    const { nodes, edges, isLoading, error, fetchGraph, resetGraph, filters, truncated, fetchDecks } = useGraphStore();
    const filterVersion = useGraphStore((s) => s._filterVersion);
    const updateFilters = useGraphStore((s) => s.updateFilters);
    const [searchParams] = useSearchParams();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const deepLinked = useRef(false);

    const [usingMock, setUsingMock] = useState(false);

    // Debounced search
    const [searchLocal, setSearchLocal] = useState(filters.search);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (searchLocal === filters.search) return;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            updateFilters({ search: searchLocal });
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [searchLocal, updateFilters, filters.search]);

    useEffect(() => {
        setSearchLocal(filters.search);
    }, [filters.search]);

    useEffect(() => {
        fetchDecks();

        const deckParam = searchParams.get('deck');
        const nodeParam = searchParams.get('node');

        const opts = {};
        if (deckParam) {
            opts.deckId = deckParam;
            useGraphStore.getState().updateFilters({ deck: deckParam });
        }

        fetchGraph(opts).then(() => {
            const { nodes: fetched } = useGraphStore.getState();
            if (!fetched.length) {
                useGraphStore.setState({
                    nodes: mockGraphData.nodes,
                    edges: mockGraphData.edges,
                    summary: {
                        nodeCount: mockGraphData.nodes.length,
                        edgeCount: mockGraphData.edges.length,
                    },
                });
                setUsingMock(true);
            }

            if (nodeParam && !deepLinked.current) {
                deepLinked.current = true;
                setTimeout(() => {
                    useGraphStore.getState().selectNode(nodeParam);
                }, 500);
            }
        });
        return () => resetGraph();
    }, [fetchGraph, resetGraph, fetchDecks, searchParams]);

    const prevConfidence = useRef(filters.minConfidence);

    useEffect(() => {
        if (usingMock) return;
        if (filters.minConfidence === prevConfidence.current) return;
        prevConfidence.current = filters.minConfidence;
        const t = setTimeout(() => {
            fetchGraph({ minConfidence: filters.minConfidence });
        }, 400);
        return () => clearTimeout(t);
    }, [filters.minConfidence, fetchGraph, usingMock]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        useGraphStore.setState({ nodes: [], edges: [], summary: null });
        const minDelay = new Promise((r) => setTimeout(r, 600));
        await fetchGraph({ minConfidence: useGraphStore.getState().filters.minConfidence });
        const { nodes: fetched } = useGraphStore.getState();
        if (!fetched.length) {
            useGraphStore.setState({
                nodes: mockGraphData.nodes,
                edges: mockGraphData.edges,
                summary: {
                    nodeCount: mockGraphData.nodes.length,
                    edgeCount: mockGraphData.edges.length,
                },
            });
            setUsingMock(true);
        } else {
            setUsingMock(false);
        }
        await minDelay;
        setIsRefreshing(false);
    }, [fetchGraph]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            useGraphStore.getState().deselectNode();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.querySelector('[aria-label="Search topics"]');
            if (searchInput) searchInput.focus();
        }
    }, []);

    const filtered = useMemo(
        () => useGraphStore.getState().getFilteredGraph(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [nodes, edges, filterVersion]
    );
    const totalNodes = nodes.length;
    const visibleNodes = filtered.nodes.length;
    const visibleEdges = filtered.edges.length;

    return (
        <div
            className="min-h-screen bg-warm-50 dark:bg-stone-950 transition-colors duration-300"
            onKeyDown={handleKeyDown}
        >
            <div className="max-w-[1920px] mx-auto px-4 py-6 space-y-4">
                <div className="bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 shadow-sm p-4">
                    {/* Tier 1: Title + stats | Search + Refresh */}
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 flex items-baseline gap-2 shrink-0">
                            <span className="bg-gradient-to-r from-brand-600 to-amber-600 bg-clip-text text-transparent">
                                Knowledge Graph
                            </span>
                            {totalNodes > 0 && (
                                <span className="text-sm font-normal text-stone-400 dark:text-stone-500">
                                    · {visibleNodes} topics · {visibleEdges} edges
                                </span>
                            )}
                        </h1>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" />
                                <input
                                    type="text"
                                    placeholder="Search topics..."
                                    value={searchLocal}
                                    onChange={(e) => setSearchLocal(e.target.value)}
                                    className="pl-9 pr-3 py-2 text-sm rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-48"
                                    aria-label="Search topics"
                                />
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-2 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                                aria-label="Refresh graph"
                                title="Refresh graph"
                            >
                                <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Tier 2: Deck, Layout, Filters */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                        <GraphControls />
                    </div>
                </div>

                {truncated && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-sm text-amber-800 dark:text-amber-200">
                        <span>Showing top 150 topics by frequency. Increase filters to narrow results.</span>
                    </div>
                )}

                <div className="relative" style={{ height: 'calc(100vh - 220px)' }}>
                    <div className="w-full h-full bg-white dark:bg-stone-900 rounded-md border border-stone-300 dark:border-stone-800 shadow-sm overflow-hidden relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-warm-50/80 dark:bg-stone-950/80">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse" />
                                        <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse" />
                                        <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse" />
                                    </div>
                                    <div className="flex gap-6 -mt-2">
                                        <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse" />
                                        <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse" />
                                    </div>
                                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">Mining topics...</p>
                                </div>
                            </div>
                        )}

                        {error && !isLoading && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center">
                                <div className="text-center p-6" role="alert">
                                    <p className="text-brand-600 dark:text-brand-400 font-medium mb-2">
                                        Something went wrong
                                    </p>
                                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">{error}</p>
                                    <button
                                        onClick={handleRefresh}
                                        className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                                    >
                                        Try again
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isLoading && !error && nodes.length === 0 && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center">
                                <div className="text-center p-6">
                                    <p className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-2">
                                        No topics mined yet
                                    </p>
                                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                                        Add flashcards with topic annotations to populate the knowledge graph.
                                    </p>
                                    <button
                                        onClick={handleRefresh}
                                        className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                                    >
                                        Refresh
                                    </button>
                                </div>
                            </div>
                        )}

                        <ReactFlowProvider>
                            <GraphCanvas />
                            <NodeDetailPanel />
                        </ReactFlowProvider>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeGraphPage;
