import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

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
