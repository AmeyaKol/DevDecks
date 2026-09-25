import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import useGraphStore from '../../../store/graphStore';
import useFlashcardStore from '../../../store/flashcardStore';
import NodeDetailPanel from '../panels/NodeDetailPanel';

jest.mock('@xyflow/react', () => ({
  useReactFlow: () => ({ getNodes: () => [], setCenter: jest.fn() }),
}));

const { __mockNavigate: mockNavigate } = require('react-router-dom');

const ID_A = '6a1f81dc5b4652a0cc8f7b3b';
const ID_B = '69ced4fc13707aec8489af00';

beforeEach(() => {
  useGraphStore.getState().resetGraph();
  mockNavigate.mockClear();
});

describe('NodeDetailPanel - studying a topic\'s source cards', () => {
  it('navigates to the exact cards the topic was mined from', () => {
    useGraphStore.setState({
      selectedNode: 'Graph Algorithms',
      nodes: [{ topic: 'Graph Algorithms', support: 2, cardIds: [ID_A, ID_B] }],
      edges: [],
    });
    render(<NodeDetailPanel />);

    fireEvent.click(screen.getByRole('button', { name: /study these 2 cards/i }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const url = mockNavigate.mock.calls[0][0];
    expect(url).toContain(`ids=${ID_A},${ID_B}`);
    expect(url).toContain('view=cards');
    // The old tag-slug search must not be used when real ids are available.
    expect(url).not.toContain('tag=');
  });

  it('labels the button with the real source-card count', () => {
    useGraphStore.setState({
      selectedNode: 'Trees',
      nodes: [{ topic: 'Trees', support: 3, cardIds: [ID_A, ID_B, '69ced6ba13707aec8489b08b'] }],
      edges: [],
    });
    render(<NodeDetailPanel />);

    expect(screen.getByRole('button', { name: /study these 3 cards/i })).toBeInTheDocument();
  });

  it('uses the singular for a single source card', () => {
    useGraphStore.setState({
      selectedNode: 'Inverted Index',
      nodes: [{ topic: 'Inverted Index', support: 1, cardIds: [ID_A] }],
      edges: [],
    });
    render(<NodeDetailPanel />);

    expect(screen.getByRole('button', { name: /^study this card$/i })).toBeInTheDocument();
  });

  // A graph payload cached from before cardIds existed should still do
  // something sensible rather than navigating to an empty list.
  it('falls back to the tag search when a node has no cardIds', () => {
    useFlashcardStore.setState({ allTags: [] });
    useGraphStore.setState({
      selectedNode: 'Dynamic Programming',
      nodes: [{ topic: 'Dynamic Programming', support: 3 }],
      edges: [],
    });
    render(<NodeDetailPanel />);

    fireEvent.click(screen.getByRole('button', { name: /study this topic/i }));

    const url = mockNavigate.mock.calls[0][0];
    expect(url).toContain('tag=');
    expect(url).not.toContain('ids=');
  });
});
