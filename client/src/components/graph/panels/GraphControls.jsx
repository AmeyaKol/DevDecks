import React, { useState } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import useGraphStore from '../../../store/graphStore';

const LAYOUTS = [
    { key: 'force', label: 'Force' },
    { key: 'hierarchical', label: 'Tree' },
    { key: 'radial', label: 'Radial' },
];

const EDGE_TYPES = [
    { key: 'related_to', label: 'Related', color: '#a8a29e' },
    { key: 'prerequisite_of', label: 'Prerequisite', color: '#d97706' },
    { key: 'variant_of', label: 'Variant', color: '#60a5fa' },
    { key: 'used_in', label: 'Used in', color: '#b91c1c' },
];

const GraphControls = () => {
    const { filters, layoutDirection, updateFilters, setLayoutDirection, decks, fetchGraph } = useGraphStore();
    const [filtersOpen, setFiltersOpen] = useState(false);

    const handleDeckChange = (e) => {
        const deckId = e.target.value;
        updateFilters({ deck: deckId });
        fetchGraph({ deckId: deckId !== 'All' ? deckId : undefined });
    };

    const toggleEdgeType = (type) => {
        const current = filters.edgeTypes || EDGE_TYPES.map(e => e.key);
        const next = current.includes(type)
            ? current.filter(t => t !== type)
            : [...current, type];
        if (next.length > 0) {
            updateFilters({ edgeTypes: next });
        }
    };

    const activeFilterCount =
        ((filters.edgeTypes || EDGE_TYPES.map(e => e.key)).length < 4 ? 1 : 0) +
        (filters.minConfidence !== 0.25 ? 1 : 0) +
        ((filters.minSupport || 1) > 1 ? 1 : 0);

    return (
        <div className="flex items-center gap-3">
            <select
                value={filters.deck}
                onChange={handleDeckChange}
                className="px-3 py-2 text-sm rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent max-w-[180px]"
                aria-label="Filter by deck"
            >
                <option value="All">All decks</option>
                {decks.map((d) => (
                    <option key={d._id} value={d._id}>
                        {d.name}
                    </option>
                ))}
            </select>

            <div className="flex rounded-md border border-stone-300 dark:border-stone-700 overflow-hidden" role="group" aria-label="Layout mode">
                {LAYOUTS.map((l) => (
                    <button
                        key={l.key}
                        onClick={() => setLayoutDirection(l.key)}
                        className={`px-3 py-2 text-sm font-medium transition-colors min-w-[4rem] text-center ${
                            layoutDirection === l.key
                                ? 'bg-brand-600 text-white'
                                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                        }`}
                        aria-pressed={layoutDirection === l.key}
                    >
                        {l.label}
                    </button>
                ))}
            </div>

            <div className="relative">
                <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border transition-colors ${
                        filtersOpen
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                            : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                    }`}
                    aria-expanded={filtersOpen}
                    aria-label="Toggle filters"
                >
                    <FunnelIcon className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.5 text-xs rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-medium">
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {filtersOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setFiltersOpen(false)} />
                        <div className="absolute top-full left-0 mt-2 z-50 w-72 p-4 space-y-4 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg">
                            <div>
                                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Edge types</p>
                                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Edge type filters">
                                    {EDGE_TYPES.map((et) => {
                                        const active = (filters.edgeTypes || EDGE_TYPES.map(e => e.key)).includes(et.key);
                                        return (
                                            <button
                                                key={et.key}
                                                onClick={() => toggleEdgeType(et.key)}
                                                className="px-2.5 py-1 text-xs rounded-full transition-all duration-200 active:scale-95 min-w-[4.5rem] text-center"
                                                style={{
                                                    color: active ? '#fff' : et.color,
                                                    backgroundColor: active ? et.color : 'transparent',
                                                    borderWidth: '1px',
                                                    borderStyle: 'solid',
                                                    borderColor: et.color,
                                                }}
                                                aria-pressed={active}
                                                title={et.label}
                                            >
                                                {et.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                                        Confidence <span className="font-semibold text-brand-600 dark:text-brand-400 normal-case text-sm">{Math.round(filters.minConfidence * 100)}%</span>
                                    </label>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={filters.minConfidence}
                                    onChange={(e) => updateFilters({ minConfidence: parseFloat(e.target.value) })}
                                    className="w-full accent-brand-500"
                                    aria-label="Minimum confidence"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                                        Min cards <span className="font-semibold text-brand-600 dark:text-brand-400 normal-case text-sm">{filters.minSupport || 1}</span>
                                    </label>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    step="1"
                                    value={filters.minSupport || 1}
                                    onChange={(e) => updateFilters({ minSupport: parseInt(e.target.value, 10) })}
                                    className="w-full accent-brand-500"
                                    aria-label="Minimum cards per topic"
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GraphControls;
