import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const EDGE_TYPES = [
    { type: 'related_to', label: 'Related to', dash: 'none', color: '#a8a29e' },
    { type: 'prerequisite_of', label: 'Prerequisite of', dash: '8 4', color: '#d97706' },
    { type: 'variant_of', label: 'Variant of', dash: '2 4', color: '#60a5fa' },
    { type: 'used_in', label: 'Used in', dash: 'none', color: '#b91c1c' },
];

const GraphLegend = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute top-4 left-4 z-10 max-w-[200px] rounded-lg border border-stone-200/60 dark:border-stone-700/60 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50/80 dark:hover:bg-stone-800/80 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                aria-expanded={isOpen}
            >
                Legend
                {isOpen ? (
                    <ChevronUpIcon className="h-3.5 w-3.5" />
                ) : (
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                )}
            </button>

            {isOpen && (
                <div className="px-3 pb-2.5 space-y-2.5 border-t border-stone-200/60 dark:border-stone-700/60 pt-2.5">
                    <div>
                        <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wide">
                            Edge Types
                        </p>
                        <div className="space-y-1.5">
                            {EDGE_TYPES.map((et) => (
                                <div key={et.type} className="flex items-center gap-2">
                                    <svg width="28" height="8" className="shrink-0">
                                        <line
                                            x1="0" y1="4" x2="28" y2="4"
                                            stroke={et.color}
                                            strokeWidth="2"
                                            strokeDasharray={et.dash}
                                        />
                                        {(et.type === 'prerequisite_of' || et.type === 'used_in') && (
                                            <polygon
                                                points="22,0 28,4 22,8"
                                                fill={et.color}
                                            />
                                        )}
                                    </svg>
                                    <span className="text-[11px] text-stone-600 dark:text-stone-400">
                                        {et.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wide">
                            Node Size
                        </p>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-brand-500 shrink-0" />
                                <span className="text-[11px] text-stone-600 dark:text-stone-400">Few (1–5)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-brand-600 shrink-0" />
                                <span className="text-[11px] text-stone-600 dark:text-stone-400">Some (6–19)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-brand-800 shrink-0" />
                                <span className="text-[11px] text-stone-600 dark:text-stone-400">Many (20+)</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraphLegend;
