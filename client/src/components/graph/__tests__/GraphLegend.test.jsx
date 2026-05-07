import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GraphLegend from '../panels/GraphLegend';

jest.mock('@heroicons/react/24/outline', () => ({
    ChevronDownIcon: () => <span data-testid="chevron-down" />,
    ChevronUpIcon: () => <span data-testid="chevron-up" />,
}));

describe('GraphLegend', () => {
    it('renders collapsed by default', () => {
        render(<GraphLegend />);
        expect(screen.getByText('Legend')).toBeInTheDocument();
        expect(screen.queryByText('Edge Types')).not.toBeInTheDocument();
    });

    it('expands on click', () => {
        render(<GraphLegend />);
        fireEvent.click(screen.getByText('Legend'));
        expect(screen.getByText('Edge Types')).toBeInTheDocument();
        expect(screen.getByText('Node Size')).toBeInTheDocument();
    });

    it('shows all edge type labels when expanded', () => {
        render(<GraphLegend />);
        fireEvent.click(screen.getByText('Legend'));
        expect(screen.getByText('Related to')).toBeInTheDocument();
        expect(screen.getByText('Prerequisite of')).toBeInTheDocument();
        expect(screen.getByText('Variant of')).toBeInTheDocument();
        expect(screen.getByText('Used in')).toBeInTheDocument();
    });

    it('collapses on second click', () => {
        render(<GraphLegend />);
        fireEvent.click(screen.getByText('Legend'));
        expect(screen.getByText('Edge Types')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Legend'));
        expect(screen.queryByText('Edge Types')).not.toBeInTheDocument();
    });

    it('has correct aria-expanded attribute', () => {
        render(<GraphLegend />);
        const button = screen.getByText('Legend').closest('button');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('shows chevron down when collapsed', () => {
        render(<GraphLegend />);
        expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('shows chevron up when expanded', () => {
        render(<GraphLegend />);
        fireEvent.click(screen.getByText('Legend'));
        expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    });

    it('shows three node size tiers when expanded', () => {
        render(<GraphLegend />);
        fireEvent.click(screen.getByText('Legend'));
        expect(screen.getByText('Few (1–5)')).toBeInTheDocument();
        expect(screen.getByText('Some (6–19)')).toBeInTheDocument();
        expect(screen.getByText('Many (20+)')).toBeInTheDocument();
    });
});
