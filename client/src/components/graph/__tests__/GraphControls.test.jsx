import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GraphControls from '../panels/GraphControls';
import useGraphStore from '../../../store/graphStore';

beforeEach(() => {
    useGraphStore.getState().resetGraph();
});

describe('GraphControls', () => {
    it('renders search input', () => {
        render(<GraphControls onRefresh={jest.fn()} />);
        expect(screen.getByPlaceholderText('Search topics...')).toBeInTheDocument();
    });

    it('renders layout buttons', () => {
        render(<GraphControls onRefresh={jest.fn()} />);
        expect(screen.getByText('Force')).toBeInTheDocument();
        expect(screen.getByText('Tree')).toBeInTheDocument();
        expect(screen.getByText('Radial')).toBeInTheDocument();
    });

    it('renders refresh button', () => {
        render(<GraphControls onRefresh={jest.fn()} />);
        expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('updates search filter on input', () => {
        render(<GraphControls onRefresh={jest.fn()} />);
        const input = screen.getByPlaceholderText('Search topics...');
        fireEvent.change(input, { target: { value: 'tree' } });
        expect(useGraphStore.getState().filters.search).toBe('tree');
    });

    it('changes layout direction on button click', () => {
        render(<GraphControls onRefresh={jest.fn()} />);
        fireEvent.click(screen.getByText('Tree'));
        expect(useGraphStore.getState().layoutDirection).toBe('hierarchical');
    });

    it('calls onRefresh when refresh button clicked', () => {
        const onRefresh = jest.fn();
        render(<GraphControls onRefresh={onRefresh} />);
        fireEvent.click(screen.getByText('Refresh'));
        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('updates confidence slider', () => {
        render(<GraphControls onRefresh={jest.fn()} />);
        const slider = screen.getByLabelText('Minimum confidence');
        fireEvent.change(slider, { target: { value: '0.5' } });
        expect(useGraphStore.getState().filters.minConfidence).toBe(0.5);
    });

    it('highlights active layout button', () => {
        render(<GraphControls onRefresh={jest.fn()} />);
        const forceBtn = screen.getByText('Force');
        expect(forceBtn.className).toContain('bg-brand-600');
    });
});
