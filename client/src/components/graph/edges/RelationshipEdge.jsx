import React, { memo } from 'react';

const EDGE_STYLES = {
    related_to: { strokeDasharray: 'none', color: '#8a8a8a', arrow: false },
    prerequisite_of: { strokeDasharray: '8 4', color: '#d97706', arrow: true },
    variant_of: { strokeDasharray: '2 4', color: '#60a5fa', arrow: false },
    used_in: { strokeDasharray: 'none', color: '#b91c1c', arrow: true },
};

function getNodeRadius(support, maxSupport) {
    const ratio = Math.min(support / Math.max(maxSupport, 1), 1);
    return 14 + Math.sqrt(ratio) * 20;
}

function offsetAlongTangent(cx, cy, ctrlX, ctrlY, radius) {
    const tx = cx - ctrlX;
    const ty = cy - ctrlY;
    const len = Math.sqrt(tx * tx + ty * ty);
    if (len === 0) return { x: cx, y: cy };
    return { x: cx - (tx / len) * radius, y: cy - (ty / len) * radius };
}

const ARROW_LEN = 7;
const ARROW_HALF_W = 3;

const RelationshipEdge = memo(({
    id,
    sourceX, sourceY, targetX, targetY,
    data, selected,
}) => {
    const {
        edgeType = 'related_to',
        weight = 1,
        pairIndex = 0,
        pairCount = 1,
        sourceSupport = 1,
        targetSupport = 1,
        maxSupport = 1,
        isTreeEdge = true,
        layoutDirection = 'force',
    } = data || {};

    const style = EDGE_STYLES[edgeType] || EDGE_STYLES.related_to;

    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return null;

    const ux = dx / dist;
    const uy = dy / dist;

    const srcR = getNodeRadius(sourceSupport, maxSupport);
    const tgtR = getNodeRadius(targetSupport, maxSupport);

    const fanOffset = pairCount > 1
        ? (pairIndex - (pairCount - 1) / 2) * 14
        : 0;

    let ctrlX, ctrlY;
    let edgePath;
    let isStraight = false;

    if (layoutDirection === 'hierarchical' && isTreeEdge && pairCount <= 1) {
        const sx = sourceX + ux * srcR;
        const sy = sourceY + uy * srcR;
        const tx = targetX - ux * tgtR;
        const ty = targetY - uy * tgtR;
        if (Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2) <= 0) return null;
        edgePath = `M ${sx},${sy} L ${tx},${ty}`;
        isStraight = true;
    } else {
        let perpOffset;
        if (layoutDirection === 'hierarchical') {
            const chordLen = Math.sqrt(
                (targetX - ux * tgtR - (sourceX + ux * srcR)) ** 2 +
                (targetY - uy * tgtR - (sourceY + uy * srcR)) ** 2
            );
            perpOffset = fanOffset || (Math.min(20, chordLen * 0.1) * (pairIndex % 2 === 0 ? 1 : -1));
        } else if (pairCount <= 1) {
            const chordLen = dist - srcR - tgtR;
            perpOffset = Math.min(8, Math.max(chordLen, 0) * 0.03);
        } else {
            perpOffset = fanOffset;
        }
        ctrlX = (sourceX + targetX) / 2 + (-uy) * perpOffset;
        ctrlY = (sourceY + targetY) / 2 + ux * perpOffset;
        const src = offsetAlongTangent(sourceX, sourceY, ctrlX, ctrlY, srcR);
        const tgt = offsetAlongTangent(targetX, targetY, ctrlX, ctrlY, tgtR);
        if (Math.sqrt((tgt.x - src.x) ** 2 + (tgt.y - src.y) ** 2) <= 0) return null;
        edgePath = `M ${src.x},${src.y} Q ${ctrlX},${ctrlY} ${tgt.x},${tgt.y}`;
    }

    // Compute arrowhead triangle
    let arrowPoints = null;
    if (style.arrow) {
        let tipX, tipY, tanX, tanY;
        if (isStraight) {
            tipX = targetX - ux * tgtR;
            tipY = targetY - uy * tgtR;
            tanX = ux;
            tanY = uy;
        } else {
            tipX = targetX - ((targetX - ctrlX) / Math.sqrt((targetX - ctrlX) ** 2 + (targetY - ctrlY) ** 2)) * tgtR;
            tipY = targetY - ((targetY - ctrlY) / Math.sqrt((targetX - ctrlX) ** 2 + (targetY - ctrlY) ** 2)) * tgtR;
            const tLen = Math.sqrt((tipX - ctrlX) ** 2 + (tipY - ctrlY) ** 2);
            tanX = (tipX - ctrlX) / tLen;
            tanY = (tipY - ctrlY) / tLen;
        }
        const baseX = tipX - tanX * ARROW_LEN;
        const baseY = tipY - tanY * ARROW_LEN;
        const perpX = -tanY;
        const perpY = tanX;
        arrowPoints = `${tipX},${tipY} ${baseX + perpX * ARROW_HALF_W},${baseY + perpY * ARROW_HALF_W} ${baseX - perpX * ARROW_HALF_W},${baseY - perpY * ARROW_HALF_W}`;
    }

    const baseOpacity = 0.45 + Math.min((weight - 1) / 7, 1) * 0.25;
    let strokeOpacity, strokeDash;
    if (selected) {
        strokeOpacity = 1;
        strokeDash = style.strokeDasharray;
    } else if (!isTreeEdge) {
        strokeOpacity = 0.12;
        strokeDash = '4 4';
    } else {
        strokeOpacity = baseOpacity;
        strokeDash = style.strokeDasharray;
    }

    const strokeColor = selected ? '#b91c1c' : style.color;

    return (
        <g>
            <path
                d={edgePath}
                fill="none"
                stroke={strokeColor}
                strokeWidth={1.5}
                strokeDasharray={strokeDash}
                strokeOpacity={strokeOpacity}
                style={{ transition: 'stroke 0.2s, stroke-opacity 0.2s' }}
            />
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
            />
            {arrowPoints && (
                <polygon
                    points={arrowPoints}
                    fill={strokeColor}
                    fillOpacity={strokeOpacity}
                    style={{ transition: 'fill 0.2s, fill-opacity 0.2s' }}
                />
            )}
        </g>
    );
});

RelationshipEdge.displayName = 'RelationshipEdge';

export default RelationshipEdge;
