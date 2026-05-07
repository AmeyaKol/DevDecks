import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const TopicNode = memo(({ data, selected }) => {
    const { topic, support } = data;
    const isSearchMatch = data.isSearchMatch || false;
    const maxSupport = data.maxSupport || 20;
    const ratio = Math.min(support / maxSupport, 1);
    const radius = 14 + Math.sqrt(ratio) * 20;
    const size = Math.round(radius * 2);

    const fontSize = Math.max(11, Math.min(14, size / 5));

    return (
        <div
            className="relative flex items-center justify-center group"
            style={{ width: size, height: size }}
            role="button"
            tabIndex={0}
            aria-label={`${topic}, ${support} cards`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-transparent !border-0 !w-0 !h-0"
                style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-transparent !border-0 !w-0 !h-0"
                style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            />

            <div
                className={`
                    absolute inset-0 rounded-full transition-all duration-200
                    ${selected
                        ? 'ring-3 ring-brand-500 ring-offset-2 ring-offset-warm-50 dark:ring-offset-stone-950'
                        : isSearchMatch
                            ? 'ring-3 ring-amber-400 ring-offset-2 ring-offset-warm-50 dark:ring-offset-stone-950'
                            : ''
                    }
                `}
                style={{
                    background: `rgba(185, 28, 28, 1)`,
                    boxShadow: selected
                        ? '0 0 16px rgba(185, 28, 28, 0.5)'
                        : isSearchMatch
                            ? '0 0 16px rgba(251, 191, 36, 0.6)'
                            : 'none',
                    transition: 'box-shadow 0.2s, background 0.2s',
                }}
            />

            <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{
                    boxShadow: '0 0 12px rgba(185, 28, 28, 0.3)',
                }}
            />

            <span
                className="relative z-10 text-center font-medium leading-tight px-1 select-none text-white"
                style={{
                    fontSize,
                    paintOrder: 'stroke',
                    WebkitTextStroke: '3px rgba(0,0,0,0.5)',
                    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    color: '#fff',
                }}
            >
                {topic}
            </span>

            <div
                className="
                    absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                    px-2 py-1 rounded text-xs
                    bg-stone-800 dark:bg-stone-700 text-white
                    opacity-0 group-hover:opacity-100 transition-opacity duration-150
                    pointer-events-none z-20
                "
            >
                {topic} — {support} card{support !== 1 ? 's' : ''}
            </div>
        </div>
    );
});

TopicNode.displayName = 'TopicNode';

export default TopicNode;
