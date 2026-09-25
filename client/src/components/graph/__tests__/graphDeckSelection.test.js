import useGraphStore from '../../../store/graphStore';
import { fetchGraph as fetchGraphAPI, fetchGraphByDeck } from '../../../services/api';

jest.mock('../../../services/api', () => ({
  fetchGraph: jest.fn(),
  fetchGraphByDeck: jest.fn(),
  fetchAllDecks: jest.fn(),
}));

const emptyGraph = { graph: { nodes: [], edges: [] }, summary: null };

describe('graph deck selection', () => {
  beforeEach(() => {
    useGraphStore.getState().resetGraph();
    jest.clearAllMocks();
    localStorage.setItem('userInfo', JSON.stringify({ token: 't' }));
  });

  afterEach(() => localStorage.clear());

  it('starts with nothing selected and nothing built', () => {
    const state = useGraphStore.getState();
    expect(state.selectedDeckIds).toEqual([]);
    expect(state.hasBuilt).toBe(false);
  });

  // The whole point of the change: landing on the page must not kick off a
  // graph build across every deck in the library.
  it('does not call the API when no decks are selected', async () => {
    await useGraphStore.getState().fetchGraph();

    expect(fetchGraphAPI).not.toHaveBeenCalled();
    expect(fetchGraphByDeck).not.toHaveBeenCalled();
    expect(useGraphStore.getState().hasBuilt).toBe(false);
  });

  it('sends the selected deck ids when several are chosen', async () => {
    fetchGraphAPI.mockResolvedValue(emptyGraph);
    useGraphStore.getState().setSelectedDeckIds(['a', 'b']);

    await useGraphStore.getState().fetchGraph();

    expect(fetchGraphAPI).toHaveBeenCalledWith(
      expect.objectContaining({ deckIds: ['a', 'b'] })
    );
    expect(useGraphStore.getState().hasBuilt).toBe(true);
  });

  it('uses the single-deck endpoint when exactly one is chosen', async () => {
    fetchGraphByDeck.mockResolvedValue(emptyGraph);
    useGraphStore.getState().setSelectedDeckIds(['solo']);

    await useGraphStore.getState().fetchGraph();

    expect(fetchGraphByDeck).toHaveBeenCalledWith('solo', expect.any(Object));
    expect(fetchGraphAPI).not.toHaveBeenCalled();
  });

  it('toggleDeckSelection adds and removes ids', () => {
    const { toggleDeckSelection } = useGraphStore.getState();
    toggleDeckSelection('x');
    expect(useGraphStore.getState().selectedDeckIds).toEqual(['x']);
    toggleDeckSelection('y');
    expect(useGraphStore.getState().selectedDeckIds).toEqual(['x', 'y']);
    toggleDeckSelection('x');
    expect(useGraphStore.getState().selectedDeckIds).toEqual(['y']);
  });

  it('clearGraphSelection returns to the picker but keeps the deck list', () => {
    useGraphStore.setState({ hasBuilt: true, nodes: [{ topic: 'A', support: 1 }], decks: [{ _id: 'd' }] });

    useGraphStore.getState().clearGraphSelection();

    const state = useGraphStore.getState();
    expect(state.hasBuilt).toBe(false);
    expect(state.nodes).toEqual([]);
    expect(state.decks).toHaveLength(1);
  });
});
