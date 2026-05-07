import React, { useEffect, useRef } from 'react';
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import useGraphStore from '../../../store/graphStore';
import useFlashcardStore from '../../../store/flashcardStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { getBasePath } from '../../../utils/greUtils';
import { normalizeTag } from '../../../utils/tagUtils';
import { useReactFlow } from '@xyflow/react';

const EDGE_TYPE_COLORS = {
    related_to: '#a8a29e',
    prerequisite_of: '#d97706',
    variant_of: '#60a5fa',
    used_in: '#b91c1c',
};

const NodeDetailPanel = () => {
    const { selectedNode, nodes, edges, deselectNode } = useGraphStore();
    const allTags = useFlashcardStore((s) => s.allTags);
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = getBasePath(location.pathname);
    const panelRef = useRef(null);
    const reactFlow = useReactFlow();

    useEffect(() => {
        if (selectedNode && panelRef.current) {
            panelRef.current.focus();
        }
    }, [selectedNode]);

    if (!selectedNode) return null;

    const nodeData = nodes.find((n) => n.topic === selectedNode);
    const connectedEdges = edges.filter(
        (e) => e.source === selectedNode || e.target === selectedNode
    );
    const connectedTopics = connectedEdges.map((e) =>
        e.source === selectedNode ? e.target : e.source
    );
    const uniqueConnected = [...new Set(connectedTopics)];

    const handleStudyTopic = () => {
        const slug = normalizeTag(selectedNode);
        const matchedTag = (allTags || []).find((t) => t === slug);
        const tagParam = matchedTag || slug;
        navigate(`${basePath}/home?tab=content&view=cards&tag=${encodeURIComponent(tagParam)}&_t=${Date.now()}`);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') deselectNode();
    };

    const handleNeighborClick = (topic) => {
        useGraphStore.getState().selectNode(topic);
        if (reactFlow) {
            const rfNodes = reactFlow.getNodes();
            const target = rfNodes.find((n) => n.id === topic);
            if (target) {
                const x = target.position.x + (target.measured?.width || 60) / 2;
                const y = target.position.y + (target.measured?.height || 60) / 2;
                reactFlow.setCenter(x, y, { zoom: 1.2, duration: 400 });
            }
        }
    };

    return (
        <>
            <div
                className="absolute inset-0 z-30 bg-black/10 lg:hidden"
                onClick={deselectNode}
                aria-hidden="true"
            />
            <div
                ref={panelRef}
                className="absolute top-0 right-0 z-40 h-full w-full sm:w-[360px] bg-white dark:bg-stone-900 border-l border-stone-300 dark:border-stone-800 shadow-xl flex flex-col animate-slide-in-right"
                role="complementary"
                aria-label={`Details for ${selectedNode}`}
                onKeyDown={handleKeyDown}
                tabIndex={-1}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-800 shrink-0">
                    <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 truncate">
                        {selectedNode}
                    </h3>
                    <button
                        onClick={deselectNode}
                        className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                        aria-label="Close panel"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    <div className="flex items-baseline gap-4">
                        <div>
                            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide">Cards</p>
                            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                                {nodeData?.support || 0}
                            </p>
                        </div>
                        {nodeData?.deckCount != null && (
                            <div>
                                <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide">Decks</p>
                                <p className="text-2xl font-bold text-stone-700 dark:text-stone-200">
                                    {nodeData.deckCount}
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-2 uppercase tracking-wide">
                            Connected Topics ({uniqueConnected.length})
                        </p>
                        {uniqueConnected.length > 0 ? (
                            <ul className="space-y-1">
                                {uniqueConnected.map((topic) => {
                                    const edge = connectedEdges.find(
                                        (e) => e.source === topic || e.target === topic
                                    );
                                    const edgeType = edge?.edgeType || 'related_to';
                                    const chipColor = EDGE_TYPE_COLORS[edgeType] || EDGE_TYPE_COLORS.related_to;
                                    return (
                                        <li key={topic}>
                                            <button
                                                onClick={() => handleNeighborClick(topic)}
                                                className="w-full text-left px-3 py-2 rounded text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center justify-between focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                                            >
                                                <span className="truncate">{topic}</span>
                                                <span
                                                    className="text-[10px] px-1.5 py-0.5 rounded-full ml-2 shrink-0 font-medium"
                                                    style={{
                                                        color: chipColor,
                                                        backgroundColor: `${chipColor}18`,
                                                        border: `1px solid ${chipColor}40`,
                                                    }}
                                                >
                                                    {edgeType.replace(/_/g, ' ')}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-stone-400 dark:text-stone-500 italic">No connections</p>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-stone-200 dark:border-stone-800 shrink-0">
                    <button
                        onClick={handleStudyTopic}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors text-sm font-medium focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        Study this topic
                    </button>
                </div>
            </div>
        </>
    );
};

export default NodeDetailPanel;
