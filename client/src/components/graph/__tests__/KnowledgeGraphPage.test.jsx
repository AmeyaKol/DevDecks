import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import useGraphStore from '../../../store/graphStore';

jest.mock('@xyflow/react', () => ({
    ReactFlowProvider: ({ children }) => <div data-testid="rf-provider">{children}</div>,
    ReactFlow: ({ children }) => <div data-testid="react-flow">{children}</div>,
    MiniMap: () => <div data-testid="minimap" />,
    Controls: () => <div data-testid="controls" />,
    Background: () => <div data-testid="background" />,
    useNodesState: () => [[], jest.fn(), jest.fn()],
    useEdgesState: () => [[], jest.fn(), jest.fn()],
    useReactFlow: () => ({ fitView: jest.fn(), getNodes: () => [], setCenter: jest.fn() }),
    Handle: () => null,
    Position: { Top: 'top', Bottom: 'bottom' },
    BaseEdge: () => null,
    getStraightPath: () => ['M 0 0'],
}));

jest.mock('../hooks/useGraphLayout', () => () => ({
    computeLayout: jest.fn().mockResolvedValue({ nodes: [], edges: [] }),
    clearCache: jest.fn(),
}));

jest.mock('../../../utils/greUtils', () => ({
    getBasePath: () => '',
    isGREMode: () => false,
    getNavigationLinks: () => ({ home: '/home', knowledgeGraph: '/knowledge-graph' }),
}));

jest.mock('../../../store/graphStore', () => {
    const actual = jest.requireActual('../../../store/graphStore');
    return {
        __esModule: true,
        default: actual.default,
    };
});

import KnowledgeGraphPage from '../KnowledgeGraphPage';

beforeEach(() => {
    useGraphStore.setState({
        nodes: [],
        edges: [],
        selectedNode: null,
        hoveredNode: null,
        isLoading: false,
        error: null,
        layoutDirection: 'force',
        summary: null,
        _filterVersion: 0,
        filters: { deck: 'All', type: 'All', minConfidence: 0.25, search: '', edgeTypes: ['related_to', 'prerequisite_of', 'variant_of', 'used_in'], minSupport: 1 },
        fetchGraph: jest.fn(() => Promise.resolve()),
        resetGraph: jest.fn(),
    });
});

describe('KnowledgeGraphPage', () => {
    it('renders page title', () => {
        render(<KnowledgeGraphPage />);
        expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
        render(<KnowledgeGraphPage />);
        expect(screen.getByText(/Explore topic relationships/)).toBeInTheDocument();
    });

    it('shows empty state when no nodes', () => {
        render(<KnowledgeGraphPage />);
        expect(screen.getByText('No topics mined yet')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        useGraphStore.setState({ isLoading: true });
        render(<KnowledgeGraphPage />);
        expect(screen.getByText('Mining topics...')).toBeInTheDocument();
    });

    it('shows error state', () => {
        useGraphStore.setState({ error: 'Network error', isLoading: false });
        render(<KnowledgeGraphPage />);
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('shows topic counter when nodes exist', () => {
        useGraphStore.setState({
            nodes: [
                { topic: 'A', support: 1 },
                { topic: 'B', support: 2 },
            ],
            edges: [],
        });
        render(<KnowledgeGraphPage />);
        expect(screen.getByText(/Showing 2\/2 topics/)).toBeInTheDocument();
    });

    it('renders ReactFlowProvider', () => {
        render(<KnowledgeGraphPage />);
        expect(screen.getByTestId('rf-provider')).toBeInTheDocument();
    });

    it('calls fetchGraph on mount', () => {
        const mockFetch = jest.fn(() => Promise.resolve());
        useGraphStore.setState({ fetchGraph: mockFetch });
        render(<KnowledgeGraphPage />);
        expect(mockFetch).toHaveBeenCalled();
    });
});
