import { useCallback, useRef } from 'react';
import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide,
    forceX,
    forceY,
} from 'd3-force';
import { stratify, tree as d3Tree } from 'd3-hierarchy';

function getNodeRadius(support, maxSupport) {
    const ratio = Math.min(support / Math.max(maxSupport, 1), 1);
    return 14 + Math.sqrt(ratio) * 20;
}

function stableHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash;
}

function graphCacheKey(graphNodes, graphEdges) {
    const nodeKey = graphNodes.map((n) => `${n.topic}:${n.support}`).sort().join(',');
    const edgeKey = graphEdges.map((e) => `${e.source}-${e.target}`).sort().join(',');
    return `kg-force-${stableHash(nodeKey + '|' + edgeKey)}`;
}

function loadCachedPositions(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveCachedPositions(key, positions) {
    try {
        localStorage.setItem(key, JSON.stringify(positions));
    } catch {
        // localStorage full or unavailable
    }
}

function findRootTopic(nodes, edges) {
    const degree = new Map();
    nodes.forEach((n) => degree.set(n.topic, 0));
    edges.forEach((e) => {
        degree.set(e.source, (degree.get(e.source) || 0) + 1);
        degree.set(e.target, (degree.get(e.target) || 0) + 1);
    });
    let root = nodes[0]?.topic;
    let maxDeg = -1;
    for (const [topic, deg] of degree) {
        if (deg > maxDeg) {
            maxDeg = deg;
            root = topic;
        }
    }
    return root;
}

function runForceLayout(graphNodes, graphEdges, maxSupport) {
    const cacheKey = graphCacheKey(graphNodes, graphEdges);
    const cached = loadCachedPositions(cacheKey);
    if (cached) {
        const cachedMap = new Map(cached.map((p) => [p.id, p]));
        if (graphNodes.every((n) => cachedMap.has(n.topic))) {
            return cached;
        }
    }

    const simNodes = graphNodes.map((n) => ({
        id: n.topic,
        support: n.support,
        x: Math.random() * 600 - 300,
        y: Math.random() * 600 - 300,
    }));

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks = graphEdges
        .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
        .map((e) => ({
            source: e.source,
            target: e.target,
            weight: e.weight || 1,
        }));

    const sim = forceSimulation(simNodes)
        .force(
            'link',
            forceLink(simLinks)
                .id((d) => d.id)
                .distance(160)
                .strength(0.7)
        )
        .force('charge', forceManyBody().strength(-600))
        .force('center', forceCenter(0, 0).strength(0.1))
        .force(
            'collide',
            forceCollide((d) => getNodeRadius(d.support, maxSupport) + 16)
        )
        .force('x', forceX(0).strength(0.04))
        .force('y', forceY(0).strength(0.04))
        .stop();

    for (let i = 0; i < 400; i++) sim.tick();

    const positions = simNodes.map((n) => ({ id: n.id, x: n.x, y: n.y }));
    saveCachedPositions(cacheKey, positions);
    return positions;
}

function runTreeLayout(graphNodes, graphEdges, maxSupport) {
    const rootTopic = findRootTopic(graphNodes, graphEdges);

    const adj = new Map();
    graphNodes.forEach((n) => adj.set(n.topic, []));
    graphEdges.forEach((e) => {
        if (adj.has(e.source)) adj.get(e.source).push(e.target);
        if (adj.has(e.target)) adj.get(e.target).push(e.source);
    });

    const visited = new Set();
    const parentMap = new Map();
    parentMap.set(rootTopic, null);
    const queue = [rootTopic];
    visited.add(rootTopic);

    while (queue.length > 0) {
        const current = queue.shift();
        for (const nb of adj.get(current) || []) {
            if (!visited.has(nb)) {
                visited.add(nb);
                parentMap.set(nb, current);
                queue.push(nb);
            }
        }
    }

    // Collect orphans (disconnected from main component)
    const orphans = graphNodes.filter((n) => !visited.has(n.topic));
    const connectedNodes = graphNodes.filter((n) => visited.has(n.topic));

    // Build tree edges set for later marking
    const treeEdgeSet = new Set();
    for (const [child, parent] of parentMap) {
        if (parent) {
            treeEdgeSet.add(`${parent}->${child}`);
            treeEdgeSet.add(`${child}->${parent}`);
        }
    }

    // Build hierarchy rows for connected nodes only
    const rows = [];
    for (const [child, parent] of parentMap) {
        rows.push({ id: child, parentId: parent || '' });
    }

    try {
        const root = stratify()
            .id((d) => d.id)
            .parentId((d) => d.parentId || null)(rows);

        const layout = d3Tree().nodeSize([80, 120]);
        layout(root);

        const positions = root.descendants().map((d) => ({
            id: d.data.id,
            x: d.x,
            y: d.y,
        }));

        // Place orphans in a bottom row
        if (orphans.length > 0) {
            const maxY = Math.max(...positions.map((p) => p.y), 0);
            const orphanY = maxY + 180;
            const orphanStartX = -((orphans.length - 1) * 80) / 2;
            orphans.forEach((n, i) => {
                positions.push({
                    id: n.topic,
                    x: orphanStartX + i * 80,
                    y: orphanY,
                });
            });
        }

        return { positions, treeEdgeSet, orphanCount: orphans.length, orphanTopics: orphans.map((n) => n.topic) };
    } catch {
        return {
            positions: runForceLayout(graphNodes, graphEdges, maxSupport),
            treeEdgeSet: new Set(),
            orphanCount: 0,
            orphanTopics: [],
        };
    }
}

function runRadialLayout(graphNodes, graphEdges, maxSupport) {
    if (!graphNodes.length) return [];

    const rootTopic = findRootTopic(graphNodes, graphEdges);

    const adj = new Map();
    graphNodes.forEach((n) => adj.set(n.topic, []));
    graphEdges.forEach((e) => {
        if (adj.has(e.source)) adj.get(e.source).push(e.target);
        if (adj.has(e.target)) adj.get(e.target).push(e.source);
    });

    const depthMap = new Map();
    depthMap.set(rootTopic, 0);
    const queue = [rootTopic];
    const visited = new Set([rootTopic]);

    while (queue.length > 0) {
        const current = queue.shift();
        for (const nb of adj.get(current) || []) {
            if (!visited.has(nb)) {
                visited.add(nb);
                depthMap.set(nb, depthMap.get(current) + 1);
                queue.push(nb);
            }
        }
    }

    let maxDepth = 0;
    for (const d of depthMap.values()) {
        if (d > maxDepth) maxDepth = d;
    }

    // Disconnected nodes go to outermost ring + 1
    const disconnectedDepth = maxDepth + 1;
    graphNodes.forEach((n) => {
        if (!depthMap.has(n.topic)) {
            depthMap.set(n.topic, disconnectedDepth);
        }
    });
    if (disconnectedDepth > maxDepth) maxDepth = disconnectedDepth;

    const depthGroups = new Map();
    for (const [topic, depth] of depthMap) {
        if (!depthGroups.has(depth)) depthGroups.set(depth, []);
        depthGroups.get(depth).push(topic);
    }

    const ringSpacing = Math.max(150, 700 / (maxDepth + 1));

    return graphNodes.map((n) => {
        const depth = depthMap.get(n.topic);
        if (depth === 0) return { id: n.topic, x: 0, y: 0 };
        const group = depthGroups.get(depth);
        const index = group.indexOf(n.topic);
        const angle = (index / group.length) * 2 * Math.PI;
        const r = depth * ringSpacing;
        return {
            id: n.topic,
            x: r * Math.cos(angle),
            y: r * Math.sin(angle),
        };
    });
}

const useGraphLayout = () => {
    const layoutCacheRef = useRef(new Map());

    const computeLayout = useCallback(
        async (graphNodes, graphEdges, direction = 'force', maxSupport = 1) => {
            if (!graphNodes.length) return { nodes: [], edges: [] };

            const cacheKey = `${direction}-${graphNodes
                .map((n) => `${n.topic}:${n.support}`)
                .sort()
                .join(',')}-${graphEdges.length}`;

            if (layoutCacheRef.current.has(cacheKey)) {
                return layoutCacheRef.current.get(cacheKey);
            }

            let positions;
            let treeEdgeSet = null;
            let orphanTopics = [];
            if (direction === 'hierarchical') {
                const treeResult = runTreeLayout(graphNodes, graphEdges, maxSupport);
                positions = treeResult.positions;
                treeEdgeSet = treeResult.treeEdgeSet;
                orphanTopics = treeResult.orphanTopics || [];
            } else if (direction === 'radial') {
                positions = runRadialLayout(graphNodes, graphEdges, maxSupport);
            } else {
                positions = runForceLayout(graphNodes, graphEdges, maxSupport);
            }

            const posMap = new Map(positions.map((p) => [p.id, p]));
            const orphanSet = new Set(orphanTopics);

            const visibleNodes = direction === 'hierarchical'
                ? graphNodes.filter((n) => !orphanSet.has(n.topic))
                : graphNodes;

            const positionedNodes = visibleNodes.map((node) => {
                const pos = posMap.get(node.topic) || { x: 0, y: 0 };
                return {
                    id: node.topic,
                    type: 'topicNode',
                    position: { x: pos.x, y: pos.y },
                    data: {
                        label: node.topic,
                        topic: node.topic,
                        support: node.support,
                    },
                };
            });

            const visibleNodeIds = new Set(visibleNodes.map((n) => n.topic));
            const nodeMap = new Map(graphNodes.map((n) => [n.topic, n]));

            const visibleEdges = graphEdges.filter(
                (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
            );

            // Compute per-pair edge index for multi-edge fan-out
            const pairCount = new Map();
            const pairIndex = new Map();
            visibleEdges.forEach((edge, i) => {
                const pairKey = [edge.source, edge.target].sort().join('||');
                pairCount.set(pairKey, (pairCount.get(pairKey) || 0) + 1);
            });
            const pairCursor = new Map();

            const positionedEdges = visibleEdges.map((edge, i) => {
                const pairKey = [edge.source, edge.target].sort().join('||');
                const cursor = pairCursor.get(pairKey) || 0;
                pairCursor.set(pairKey, cursor + 1);
                const count = pairCount.get(pairKey) || 1;

                const isTreeEdge = treeEdgeSet
                    ? treeEdgeSet.has(`${edge.source}->${edge.target}`) ||
                      treeEdgeSet.has(`${edge.target}->${edge.source}`)
                    : true;
                return {
                    id: `e-${edge.source}-${edge.target}-${i}`,
                    source: edge.source,
                    target: edge.target,
                    type: 'relationshipEdge',
                    data: {
                        edgeType: edge.edgeType,
                        weight: edge.weight,
                        confidence: edge.confidence,
                        pairIndex: cursor,
                        pairCount: count,
                        sourceSupport: nodeMap.get(edge.source)?.support || 1,
                        targetSupport: nodeMap.get(edge.target)?.support || 1,
                        isTreeEdge,
                        layoutDirection: direction,
                    },
                };
            });

            const result = { nodes: positionedNodes, edges: positionedEdges, orphanCount: orphanTopics.length };
            layoutCacheRef.current.set(cacheKey, result);

            if (layoutCacheRef.current.size > 20) {
                const firstKey = layoutCacheRef.current.keys().next().value;
                layoutCacheRef.current.delete(firstKey);
            }

            return result;
        },
        []
    );

    const clearCache = useCallback(() => {
        layoutCacheRef.current.clear();
    }, []);

    return { computeLayout, clearCache };
};

export default useGraphLayout;
