import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import useGraphStore from '../../../store/graphStore';
import useFlashcardStore from '../../../store/flashcardStore';
import NodeDetailPanel from '../panels/NodeDetailPanel';

const mockSetCenter = jest.fn();
const mockGetNodes = jest.fn(() => []);

jest.mock('@xyflow/react', () => ({
    useReactFlow: () => ({ getNodes: mockGetNodes, setCenter: mockSetCenter }),
}));

const { __mockNavigate: mockNavigate } = require('react-router-dom');

beforeEach(() => {
    useGraphStore.getState().resetGraph();
    mockNavigate.mockClear();
    mockSetCenter.mockClear();
    mockGetNodes.mockReturnValue([]);
});

describe('NodeDetailPanel', () => {
    it('renders nothing when no node selected', () => {
        const { container } = render(<NodeDetailPanel />);
        expect(container.querySelector('[role="complementary"]')).toBeNull();
    });

    it('renders panel when node is selected', () => {
        useGraphStore.setState({
            selectedNode: 'Binary Search',
            nodes: [{ topic: 'Binary Search', support: 12 }],
            edges: [],
        });
        render(<NodeDetailPanel />);
        expect(screen.getByText('Binary Search')).toBeInTheDocument();
    });

    it('shows support count', () => {
        useGraphStore.setState({
            selectedNode: 'Trees',
            nodes: [{ topic: 'Trees', support: 14 }],
            edges: [],
        });
        render(<NodeDetailPanel />);
        expect(screen.getByText('14')).toBeInTheDocument();
    });

    it('shows connected topics with edge type chips', () => {
        useGraphStore.setState({
            selectedNode: 'Trees',
            nodes: [
                { topic: 'Trees', support: 14 },
                { topic: 'BFS', support: 7 },
                { topic: 'DFS', support: 7 },
            ],
            edges: [
                { source: 'Trees', target: 'BFS', edgeType: 'used_in', weight: 5 },
                { source: 'Trees', target: 'DFS', edgeType: 'prerequisite_of', weight: 5 },
            ],
        });
        render(<NodeDetailPanel />);
        expect(screen.getByText('BFS')).toBeInTheDocument();
        expect(screen.getByText('DFS')).toBeInTheDocument();
        expect(screen.getByText('used in')).toBeInTheDocument();
        expect(screen.getByText('prerequisite of')).toBeInTheDocument();
    });

    it('shows connected topics count', () => {
        useGraphStore.setState({
            selectedNode: 'Trees',
            nodes: [
                { topic: 'Trees', support: 14 },
                { topic: 'BFS', support: 7 },
            ],
            edges: [
                { source: 'Trees', target: 'BFS', edgeType: 'used_in', weight: 5 },
            ],
        });
        render(<NodeDetailPanel />);
        expect(screen.getByText('Connected Topics (1)')).toBeInTheDocument();
    });

    it('deselects on close button click', () => {
        useGraphStore.setState({
            selectedNode: 'Trees',
            nodes: [{ topic: 'Trees', support: 14 }],
            edges: [],
        });
        render(<NodeDetailPanel />);
        fireEvent.click(screen.getByLabelText('Close panel'));
        expect(useGraphStore.getState().selectedNode).toBeNull();
    });

    it('deselects on Escape key', () => {
        useGraphStore.setState({
            selectedNode: 'Trees',
            nodes: [{ topic: 'Trees', support: 14 }],
            edges: [],
        });
        render(<NodeDetailPanel />);
        const panel = screen.getByRole('complementary');
        fireEvent.keyDown(panel, { key: 'Escape' });
        expect(useGraphStore.getState().selectedNode).toBeNull();
    });

    it('has study topic button', () => {
        useGraphStore.setState({
            selectedNode: 'Trees',
            nodes: [{ topic: 'Trees', support: 14 }],
            edges: [],
        });
        render(<NodeDetailPanel />);
        expect(screen.getByText('Study this topic')).toBeInTheDocument();
    });

    it('navigates on study button click with normalized tag', () => {
        useGraphStore.setState({
            selectedNode: 'Trees',
            nodes: [{ topic: 'Trees', support: 14 }],
            edges: [],
        });
        useFlashcardStore.setState({ allTags: ['tree', 'binary-search', 'dynamic-programming'] });
        render(<NodeDetailPanel />);
        fireEvent.click(screen.getByText('Study this topic'));
        expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('/home?tab=content&view=cards&tag=tree&_t=')
        );
    });

    it('shows no connections message when isolated', () => {
        useGraphStore.setState({
            selectedNode: 'Isolated',
            nodes: [{ topic: 'Isolated', support: 1 }],
            edges: [],
        });
        render(<NodeDetailPanel />);
        expect(screen.getByText('No connections')).toBeInTheDocument();
    });

    it('pans to neighbor node on click', () => {
        mockGetNodes.mockReturnValue([
            { id: 'BFS', position: { x: 100, y: 200 }, measured: { width: 60, height: 60 } },
        ]);
        useGraphStore.setState({
            selectedNode: 'Trees',
            nodes: [
                { topic: 'Trees', support: 14 },
                { topic: 'BFS', support: 7 },
            ],
            edges: [
                { source: 'Trees', target: 'BFS', edgeType: 'used_in', weight: 5 },
            ],
        });
        render(<NodeDetailPanel />);
        fireEvent.click(screen.getByText('BFS'));
        expect(mockSetCenter).toHaveBeenCalledWith(130, 230, { zoom: 1.2, duration: 400 });
        expect(useGraphStore.getState().selectedNode).toBe('BFS');
    });

    it('shows deck count when available', () => {
        useGraphStore.setState({
            selectedNode: 'Trees',
            nodes: [{ topic: 'Trees', support: 14, deckCount: 3 }],
            edges: [],
        });
        render(<NodeDetailPanel />);
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Decks')).toBeInTheDocument();
    });
});
