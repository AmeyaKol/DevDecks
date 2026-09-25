import React, { useMemo, useState } from 'react';
import { MagnifyingGlassIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline';
import useGraphStore from '../../../store/graphStore';

// Shown before any graph is built. Mining topics across every deck is slow and
// almost never what someone wants, so the user picks a few decks first and the
// graph is built over just those cards.
const DeckPicker = ({ onBuild }) => {
    const decks = useGraphStore((s) => s.decks);
    const selectedDeckIds = useGraphStore((s) => s.selectedDeckIds);
    const toggleDeckSelection = useGraphStore((s) => s.toggleDeckSelection);
    const setSelectedDeckIds = useGraphStore((s) => s.setSelectedDeckIds);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');

    // Built from the decks actually present rather than the model's full enum,
    // so we never render a filter that would match nothing.
    const typeOptions = useMemo(() => {
        const counts = new Map();
        for (const d of decks) {
            const t = d.type || 'Other';
            counts.set(t, (counts.get(t) || 0) + 1);
        }
        return [
            { key: 'All', label: 'All', count: decks.length },
            ...[...counts.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([key, count]) => ({ key, label: key, count })),
        ];
    }, [decks]);

    const visibleDecks = useMemo(() => {
        const q = search.trim().toLowerCase();
        return decks.filter((d) => {
            if (typeFilter !== 'All' && (d.type || 'Other') !== typeFilter) return false;
            if (q && !d.name.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [decks, search, typeFilter]);

    const selectedCount = selectedDeckIds.length;

    return (
        <div className="w-full h-full overflow-y-auto scrollbar-thin">
            <div className="max-w-3xl mx-auto p-6">
                <div className="text-center mb-6">
                    <Square3Stack3DIcon className="h-10 w-10 mx-auto text-brand-500 mb-3" />
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-1">
                        Choose decks to map
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                        The graph is built from the cards in the decks you pick. Start with
                        a couple of related decks — you can always change the selection later.
                    </p>
                </div>

                <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 dark:text-stone-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter decks..."
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            aria-label="Filter decks"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedDeckIds([])}
                        disabled={selectedCount === 0}
                        className="px-3 py-2 text-sm rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-40"
                    >
                        Clear
                    </button>
                </div>

                {typeOptions.length > 2 && (
                    <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label="Filter decks by type">
                        {typeOptions.map((opt) => {
                            const active = typeFilter === opt.key;
                            return (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => setTypeFilter(opt.key)}
                                    aria-pressed={active}
                                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                                        active
                                            ? 'bg-brand-600 border-brand-600 text-white'
                                            : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-brand-400 dark:hover:border-stone-600'
                                    }`}
                                >
                                    {opt.label}
                                    <span className={`ml-1.5 ${active ? 'text-brand-100' : 'text-stone-400 dark:text-stone-500'}`}>
                                        {opt.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {decks.length === 0 ? (
                    <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-10">
                        No decks available yet. Create a deck with some cards first.
                    </p>
                ) : visibleDecks.length === 0 ? (
                    <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-10">
                        No decks match this filter.
                        {selectedCount > 0 && ` Your ${selectedCount} selected deck${selectedCount === 1 ? '' : 's'} ${selectedCount === 1 ? 'is' : 'are'} still selected.`}
                    </p>
                ) : (
                    <ul className="space-y-2 mb-4">
                        {visibleDecks.map((deck) => {
                            const checked = selectedDeckIds.includes(deck._id);
                            return (
                                <li key={deck._id}>
                                    <label
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            checked
                                                ? 'border-brand-400 dark:border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                                                : 'border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900/50 hover:border-brand-400 dark:hover:border-stone-600'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleDeckSelection(deck._id)}
                                            className="h-4 w-4 accent-brand-600 shrink-0"
                                        />
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-medium text-stone-800 dark:text-stone-100 truncate">
                                                {deck.name}
                                            </span>
                                            {deck.description && (
                                                <span className="block text-xs text-stone-500 dark:text-stone-400 truncate">
                                                    {deck.description}
                                                </span>
                                            )}
                                        </span>
                                        {typeof deck.flashcardCount === 'number' && (
                                            <span className="text-xs text-stone-500 dark:text-stone-400 shrink-0">
                                                {deck.flashcardCount} cards
                                            </span>
                                        )}
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <div className="sticky bottom-0 pt-3 pb-1 bg-white dark:bg-stone-900 flex items-center justify-between gap-3 border-t border-stone-200 dark:border-stone-800">
                    <span className="text-sm text-stone-600 dark:text-stone-400">
                        {selectedCount === 0
                            ? 'No decks selected'
                            : `${selectedCount} deck${selectedCount === 1 ? '' : 's'} selected`}
                    </span>
                    <button
                        type="button"
                        onClick={onBuild}
                        disabled={selectedCount === 0}
                        className="px-4 py-2 bg-brand-600 text-white rounded-md text-sm hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        Build graph
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeckPicker;
