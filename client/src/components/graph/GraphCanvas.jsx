import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './graph-overrides.css';
import TopicNode from './nodes/TopicNode';
import RelationshipEdge from './edges/RelationshipEdge';
import useGraphStore from '../../store/graphStore';
import useGraphLayout from './hooks/useGraphLayout';

import GraphLegend from './panels/GraphLegend';

const nodeTypes = { topicNode: TopicNode };
const edgeTypes = { relationshipEdge: RelationshipEdge };

const GraphCanvas = () => {
    const graphNodes = useGraphStore((s) => s.nodes);
    const graphEdges = useGraphStore((s) => s.edges);
    const selectedNode = useGraphStore((s) => s.selectedNode);
    const hoveredNode = useGraphStore((s) => s.hoveredNode);
    const layoutDirection = useGraphStore((s) => s.layoutDirection);
    const filterVersion = useGraphStore((s) => s._filterVersion);
    const selectNode = useGraphStore((s) => s.selectNode);
    const deselectNode = useGraphStore((s) => s.deselectNode);
    const setHoveredNode = useGraphStore((s) => s.setHoveredNode);
    const getFilteredGraph = useGraphStore((s) => s.getFilteredGraph);
    const setLayoutDirection = useGraphStore((s) => s.setLayoutDirection);
    const updateFilters = useGraphStore((s) => s.updateFilters);

    const { computeLayout } = useGraphLayout();
    const { fitView } = useReactFlow();

    const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
    const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
    const [isLayouting, setIsLayouting] = useState(false);
    const [orphanCount, setOrphanCount] = useState(0);

    const searchQuery = useGraphStore((s) => s.filters.search);

    const filtered = useMemo(
        () => getFilteredGraph(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [graphNodes, graphEdges, filterVersion]
    );

    const maxSupport = useMemo(
        () => Math.max(...filtered.nodes.map((n) => n.support), 1),
        [filtered.nodes]
    );

    useEffect(() => {
        if (!filtered.nodes.length) {
            setRfNodes([]);
            setRfEdges([]);
            return;
        }

        let cancelled = false;
        setIsLayouting(true);

        computeLayout(filtered.nodes, filtered.edges, layoutDirection, maxSupport).then((result) => {
            if (cancelled) return;

            setRfNodes(result.nodes.map((n) => ({
                ...n,
                data: { ...n.data, maxSupport },
            })));
            setRfEdges(result.edges.map((e) => ({
                ...e,
                data: { ...e.data, maxSupport },
            })));
            setOrphanCount(result.orphanCount || 0);
            setIsLayouting(false);

            setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
        });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered, layoutDirection, maxSupport, computeLayout, fitView, setRfNodes, setRfEdges]);

    useEffect(() => {
        setRfNodes((nds) =>
            nds.map((n) => ({
                ...n,
                selected: n.id === selectedNode,
            }))
        );
        setRfEdges((eds) =>
            eds.map((e) => ({
                ...e,
                selected: selectedNode && (e.source === selectedNode || e.target === selectedNode),
            }))
        );
    }, [selectedNode, setRfNodes, setRfEdges]);

    // Enter to fit search matches, Escape to clear search
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Enter' && searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchIds = rfNodes
                    .filter((n) => n.data.topic.toLowerCase().includes(q))
                    .map((n) => n.id);
                if (matchIds.length > 0) {
                    fitView({ nodes: matchIds.map((id) => ({ id })), padding: 0.3, duration: 400 });
                }
                if (matchIds.length === 1) {
                    selectNode(matchIds[0]);
                }
            }
            if (e.key === 'Escape' && searchQuery) {
                e.stopPropagation();
                updateFilters({ search: '' });
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [searchQuery, rfNodes, fitView, selectNode, updateFilters]);

    const onNodeClick = useCallback((_event, node) => {
        selectNode(node.id);
    }, [selectNode]);

    const onPaneClick = useCallback(() => {
        deselectNode();
    }, [deselectNode]);

    const onNodeMouseEnter = useCallback((_event, node) => {
        setHoveredNode(node.id);
    }, [setHoveredNode]);

    const onNodeMouseLeave = useCallback(() => {
        setHoveredNode(null);
    }, [setHoveredNode]);

    const onNodeKeyDown = useCallback((event, node) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectNode(node.id);
        }
    }, [selectNode]);

    const styledNodes = useMemo(() => {
        let baseNodes = rfNodes;

        // Search dimming layer
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchSet = new Set(
                rfNodes.filter((n) => n.data.topic.toLowerCase().includes(q)).map((n) => n.id)
            );
            const neighborSet = new Set();
            rfEdges.forEach((e) => {
                if (matchSet.has(e.source)) neighborSet.add(e.target);
                if (matchSet.has(e.target)) neighborSet.add(e.source);
            });

            baseNodes = rfNodes.map((n) => ({
                ...n,
                style: {
                    ...n.style,
                    opacity: matchSet.has(n.id) ? 1 : neighborSet.has(n.id) ? 0.6 : 0.2,
                    transition: 'opacity 200ms',
                },
                data: { ...n.data, isSearchMatch: matchSet.has(n.id) },
            }));
        }

        // Hover dimming layer (overrides search)
        if (!hoveredNode) return baseNodes;
        const hoverNeighborSet = new Set([hoveredNode]);
        rfEdges.forEach((e) => {
            if (e.source === hoveredNode) hoverNeighborSet.add(e.target);
            if (e.target === hoveredNode) hoverNeighborSet.add(e.source);
        });
        return baseNodes.map((n) => ({
            ...n,
            style: {
                ...n.style,
                opacity: hoverNeighborSet.has(n.id) ? 1 : 0.15,
                transition: 'opacity 200ms',
            },
        }));
    }, [rfNodes, rfEdges, hoveredNode, searchQuery]);

    const styledEdges = useMemo(() => {
        let baseEdges = rfEdges;

        // Search dimming layer for edges
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchSet = new Set(
                rfNodes.filter((n) => n.data.topic.toLowerCase().includes(q)).map((n) => n.id)
            );
            baseEdges = rfEdges.map((e) => {
                const srcMatch = matchSet.has(e.source);
                const tgtMatch = matchSet.has(e.target);
                const opacity = (srcMatch && tgtMatch) ? 1 : (srcMatch || tgtMatch) ? 0.5 : 0.08;
                return { ...e, style: { ...e.style, opacity, transition: 'opacity 200ms' } };
            });
        }

        // Hover dimming layer
        if (!hoveredNode) return baseEdges;
        return baseEdges.map((e) => ({
            ...e,
            style: {
                ...e.style,
                opacity: (e.source === hoveredNode || e.target === hoveredNode) ? 1 : 0.08,
                transition: 'opacity 200ms',
            },
        }));
    }, [rfNodes, rfEdges, hoveredNode, searchQuery]);

    return (
        <div className="relative w-full h-full" role="application" aria-label="Knowledge graph visualization">
            {isLayouting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-warm-50/50 dark:bg-stone-950/50">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
                </div>
            )}
            <ReactFlow
                nodes={styledNodes}
                edges={styledEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onNodeMouseEnter={onNodeMouseEnter}
                onNodeMouseLeave={onNodeMouseLeave}
                onNodeKeyDown={onNodeKeyDown}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.1}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                className="bg-warm-50 dark:bg-stone-950"
            >
                <Background
                    variant="dots"
                    gap={20}
                    size={1}
                    className="!bg-warm-50 dark:!bg-stone-950"
                    color="var(--dot-color, #d6d3d1)"
                />
                <Controls
                    className="!bg-white dark:!bg-stone-800 !border-stone-300 dark:!border-stone-700 !rounded-lg !shadow-sm"
                    showInteractive={false}
                />
                <MiniMap
                    nodeColor={() => '#b91c1c'}
                    maskColor="rgba(0,0,0,0.1)"
                    className="!bg-white dark:!bg-stone-800 !border-stone-300 dark:!border-stone-700 !rounded-lg"
                />
            </ReactFlow>
            {layoutDirection === 'hierarchical' && orphanCount > 0 && (
                <button
                    onClick={() => setLayoutDirection('force')}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full text-xs font-medium bg-stone-800 dark:bg-stone-700 text-white shadow-md hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
                >
                    {orphanCount} unconnected node{orphanCount !== 1 ? 's' : ''} hidden — switch to Force to view
                </button>
            )}
            <GraphLegend />
        </div>
    );
};

export default GraphCanvas;
