import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import RelationshipEdge from '../edges/RelationshipEdge';

const defaultProps = {
    id: 'e-test-1',
    sourceX: 0,
    sourceY: 0,
    targetX: 200,
    targetY: 200,
    data: { edgeType: 'related_to', weight: 3, pairIndex: 0, pairCount: 1, sourceSupport: 10, targetSupport: 10, maxSupport: 20, layoutDirection: 'force' },
    selected: false,
    sourcePosition: 'bottom',
    targetPosition: 'top',
};

function getVisiblePath(container) {
    return container.querySelector('path[stroke]:not([stroke="transparent"])');
}

describe('RelationshipEdge', () => {
    it('renders a visible path', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} /></svg>
        );
        expect(getVisiblePath(container)).toBeInTheDocument();
    });

    it('uses uniform stroke width of 1.5', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={{ ...defaultProps.data, weight: 8 }} /></svg>
        );
        expect(getVisiblePath(container).getAttribute('stroke-width')).toBe('1.5');
    });

    it('computes opacity from weight', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={{ ...defaultProps.data, weight: 1 }} /></svg>
        );
        expect(parseFloat(getVisiblePath(container).getAttribute('stroke-opacity'))).toBeCloseTo(0.45, 1);
    });

    it('uses solid stroke for related_to', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={{ ...defaultProps.data, edgeType: 'related_to' }} /></svg>
        );
        expect(getVisiblePath(container).getAttribute('stroke-dasharray')).toBe('none');
    });

    it('uses dashed stroke for prerequisite_of', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={{ ...defaultProps.data, edgeType: 'prerequisite_of' }} /></svg>
        );
        expect(getVisiblePath(container).getAttribute('stroke-dasharray')).toBe('8 4');
    });

    it('uses dotted stroke for variant_of', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={{ ...defaultProps.data, edgeType: 'variant_of' }} /></svg>
        );
        expect(getVisiblePath(container).getAttribute('stroke-dasharray')).toBe('2 4');
    });

    it('changes color when selected', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} selected={true} /></svg>
        );
        expect(getVisiblePath(container).getAttribute('stroke')).toBe('#b91c1c');
    });

    it('renders Bézier path (Q command) in force layout', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={{ ...defaultProps.data, layoutDirection: 'force' }} /></svg>
        );
        expect(getVisiblePath(container).getAttribute('d')).toMatch(/M .+ Q .+/);
    });

    it('renders straight line in tree layout for tree edges', () => {
        const { container } = render(
            <svg>
                <RelationshipEdge
                    {...defaultProps}
                    data={{ ...defaultProps.data, layoutDirection: 'hierarchical', isTreeEdge: true, pairCount: 1 }}
                />
            </svg>
        );
        expect(getVisiblePath(container).getAttribute('d')).toMatch(/M .+ L .+/);
    });

    it('returns null when source and target overlap', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} sourceX={50} sourceY={50} targetX={50} targetY={50} /></svg>
        );
        expect(getVisiblePath(container)).toBeNull();
    });

    it('handles missing data gracefully', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={null} /></svg>
        );
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('dims non-tree edges with low opacity and dashed stroke', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={{ ...defaultProps.data, isTreeEdge: false }} /></svg>
        );
        const path = getVisiblePath(container);
        expect(parseFloat(path.getAttribute('stroke-opacity'))).toBeCloseTo(0.12, 2);
        expect(path.getAttribute('stroke-dasharray')).toBe('4 4');
    });

    it('renders arrowhead polygon for prerequisite_of', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={{ ...defaultProps.data, edgeType: 'prerequisite_of' }} /></svg>
        );
        expect(container.querySelector('polygon')).toBeInTheDocument();
    });

    it('renders arrowhead polygon for used_in', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={{ ...defaultProps.data, edgeType: 'used_in' }} /></svg>
        );
        expect(container.querySelector('polygon')).toBeInTheDocument();
    });

    it('does not render arrowhead for related_to', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={{ ...defaultProps.data, edgeType: 'related_to' }} /></svg>
        );
        expect(container.querySelector('polygon')).toBeNull();
    });

    it('does not render arrowhead for variant_of', () => {
        const { container } = render(
            <svg><RelationshipEdge {...defaultProps} data={{ ...defaultProps.data, edgeType: 'variant_of' }} /></svg>
        );
        expect(container.querySelector('polygon')).toBeNull();
    });
});
