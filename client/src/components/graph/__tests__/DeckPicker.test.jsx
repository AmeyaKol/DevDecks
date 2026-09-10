import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeckPicker from '../panels/DeckPicker';
import useGraphStore from '../../../store/graphStore';

jest.mock('../../../services/api', () => ({
  fetchGraph: jest.fn(),
  fetchGraphByDeck: jest.fn(),
  fetchAllDecks: jest.fn(),
}));

const decks = [
  { _id: '1', name: 'Blind 75', type: 'DSA' },
  { _id: '2', name: 'Graph Problems', type: 'DSA' },
  { _id: '3', name: 'System Design Primer', type: 'System Design' },
  { _id: '4', name: 'GRE Words', type: 'GRE-Word' },
  { _id: '5', name: 'Untyped deck' },
];

const setup = (onBuild = jest.fn()) => {
  useGraphStore.getState().resetGraph();
  useGraphStore.setState({ decks });
  render(<DeckPicker onBuild={onBuild} />);
  return onBuild;
};

const typeGroup = () => screen.getByRole('group', { name: /filter decks by type/i });
const checkboxes = () => screen.getAllByRole('checkbox');

describe('DeckPicker deck-type filtering', () => {
  it('derives type pills from the decks present, with counts', () => {
    setup();
    const pills = within(typeGroup()).getAllByRole('button');
    expect(pills.map((p) => p.textContent)).toEqual([
      'All5', 'DSA2', 'GRE-Word1', 'Other1', 'System Design1',
    ]);
  });

  it('narrows the deck list to the chosen type', () => {
    setup();
    expect(checkboxes()).toHaveLength(5);

    fireEvent.click(within(typeGroup()).getByRole('button', { name: /^DSA/ }));

    expect(checkboxes()).toHaveLength(2);
    expect(screen.getByText('Blind 75')).toBeInTheDocument();
    expect(screen.queryByText('System Design Primer')).not.toBeInTheDocument();
  });

  // A deck with no `type` would otherwise vanish from every filter.
  it('groups untyped decks under Other', () => {
    setup();
    fireEvent.click(within(typeGroup()).getByRole('button', { name: /^Other/ }));

    expect(checkboxes()).toHaveLength(1);
    expect(screen.getByText('Untyped deck')).toBeInTheDocument();
  });

  it('combines the type filter with the text search', () => {
    setup();
    fireEvent.click(within(typeGroup()).getByRole('button', { name: /^DSA/ }));
    fireEvent.change(screen.getByLabelText('Filter decks'), { target: { value: 'graph' } });

    expect(checkboxes()).toHaveLength(1);
    expect(screen.getByText('Graph Problems')).toBeInTheDocument();
  });

  it('keeps selections made under a different type filter', () => {
    setup();
    fireEvent.click(within(typeGroup()).getByRole('button', { name: /^DSA/ }));
    fireEvent.click(checkboxes()[0]);

    fireEvent.click(within(typeGroup()).getByRole('button', { name: /^GRE-Word/ }));

    expect(useGraphStore.getState().selectedDeckIds).toEqual(['1']);
    expect(screen.getByText('1 deck selected')).toBeInTheDocument();
  });

  it('explains an empty result instead of showing a blank list', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Filter decks'), { target: { value: 'nothing matches' } });

    expect(screen.getByText(/No decks match this filter/)).toBeInTheDocument();
  });

  it('only builds once decks are selected', () => {
    const onBuild = setup();
    const build = screen.getByRole('button', { name: /build graph/i });
    expect(build).toBeDisabled();

    fireEvent.click(checkboxes()[0]);
    expect(build).toBeEnabled();

    fireEvent.click(build);
    expect(onBuild).toHaveBeenCalled();
  });
});
