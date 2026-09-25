import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  __esModule: true,
  MemoryRouter: ({ children }) => children,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/review' }),
}));

// eslint-disable-next-line import/first
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { _id: 'u1' } }),
}));

jest.mock('../Navbar', () => () => <nav data-testid="navbar" />);
jest.mock('../common/CodeEditor', () => ({ value }) => <pre>{value}</pre>);
jest.mock('react-markdown', () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));

jest.mock('../../services/api', () => ({
  fetchReviewQueue: jest.fn(),
  gradeCardReview: jest.fn(),
}));

import { fetchReviewQueue, gradeCardReview } from '../../services/api';
import useFlashcardStore from '../../store/flashcardStore';
import ReviewSession from '../ReviewSession';

const SESSION_CARDS = [
  { _id: 'c1', question: 'What is a hash map?', explanation: 'Key to value in O(1) average.', isNew: true, review: null },
  { _id: 'c2', question: 'What is a bloom filter?', explanation: 'Probabilistic set membership.', isNew: false, review: { repetitions: 2 } },
];

const renderView = () =>
  render(
    <MemoryRouter initialEntries={['/review']}>
      <ReviewSession />
    </MemoryRouter>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  useFlashcardStore.setState({
    decks: [{ _id: 'd1', name: 'Blind 75' }],
    fetchDecks: jest.fn().mockResolvedValue(undefined),
  });
  fetchReviewQueue.mockImplementation(({ preview } = {}) =>
    Promise.resolve(
      preview
        ? { counts: { due: 2, new: 3 }, cards: [] }
        : { counts: { due: 2, new: 3 }, cards: SESSION_CARDS },
    ),
  );
  gradeCardReview.mockResolvedValue({ interval: 1, repetitions: 1 });
});

test('config screen shows live counts and the deck options', async () => {
  renderView();

  expect(await screen.findByText(/due/)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument()); // due
  expect(screen.getByText('3')).toBeInTheDocument(); // new
  expect(screen.getByRole('option', { name: 'Blind 75' })).toBeInTheDocument();
});

test('starting a session runs the queue and grades advance to the summary', async () => {
  renderView();

  await waitFor(() =>
    expect(screen.getByRole('button', { name: /start review/i })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: /start review/i }));

  // First card
  expect(await screen.findByText('What is a hash map?')).toBeInTheDocument();
  expect(screen.getByText('new')).toBeInTheDocument();
  expect(fetchReviewQueue).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));

  fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
  fireEvent.click(screen.getByRole('button', { name: /^yes$/i }));
  await waitFor(() => expect(gradeCardReview).toHaveBeenCalledWith('c1', true));

  // Second card
  expect(await screen.findByText('What is a bloom filter?')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
  fireEvent.click(screen.getByRole('button', { name: /^no$/i }));
  await waitFor(() => expect(gradeCardReview).toHaveBeenCalledWith('c2', false));

  // Summary
  expect(await screen.findByText(/review complete/i)).toBeInTheDocument();
  expect(screen.getByText(/1 of 2 recalled/i)).toBeInTheDocument();
});

test('start is disabled when nothing is available', async () => {
  fetchReviewQueue.mockResolvedValue({ counts: { due: 0, new: 0 }, cards: [] });
  renderView();

  const startBtn = await screen.findByRole('button', { name: /start review/i });
  await waitFor(() => expect(startBtn).toBeDisabled());
});

test('keeps focus while typing a recall answer and resets the draft for the next card', async () => {
  const user = userEvent.setup();
  renderView();
  await waitFor(() => expect(screen.getByRole('button', { name: /start review/i })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: /start review/i }));
  const answer = await screen.findByRole('textbox');
  await user.type(answer, 'A hash map stores key-value pairs.');
  expect(answer).toHaveFocus();
  expect(answer).toHaveValue('A hash map stores key-value pairs.');
  await user.click(screen.getByRole('button', { name: /show answer/i }));
  expect(screen.getByText('A hash map stores key-value pairs.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /^yes$/i }));
  expect(await screen.findByRole('textbox')).toHaveValue('');
});

test.each([
  ['Session size', '25'],
  ['New cards from the last (days)', '14'],
])('keeps focus while editing %s and refreshing counts', async (label, value) => {
  const user = userEvent.setup();
  renderView();
  await waitFor(() => expect(screen.getByRole('button', { name: /start review/i })).toBeEnabled());
  const input = screen.getByRole('spinbutton', { name: label });
  await user.clear(input);
  await user.type(input, value);
  expect(input).toHaveFocus();
  expect(input).toHaveValue(Number(value));
  await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
  expect(input).toHaveFocus();
});
