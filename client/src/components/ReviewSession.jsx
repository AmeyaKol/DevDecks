import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFlashcardStore from '../store/flashcardStore';
import Navbar from './Navbar';
import { fetchReviewQueue, gradeCardReview } from '../services/api';
import { getBasePath, isGREMode } from '../utils/greUtils';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  TrophyIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import CodeEditor from './common/CodeEditor';

const markdownComponents = {
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

const CARD_TYPES = ['All', 'DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ', 'Custom'];
const GRE_CARD_TYPES = ['All', 'GRE-Word', 'GRE-MCQ'];
const INCLUDE_OPTIONS = [
  { value: 'both', label: 'Due + new' },
  { value: 'due', label: 'Due only' },
  { value: 'new', label: 'New only' },
];

const btnPrimary =
  'inline-flex items-center justify-center px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
const btnGhost =
  'inline-flex items-center justify-center px-6 py-3 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors';
const fieldClass =
  'w-full rounded-lg border-stone-300 dark:border-stone-600 shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500 focus:ring-opacity-50 p-2.5 bg-white dark:bg-stone-700 text-stone-900 dark:text-white';

// Keep component identities stable so state updates preserve input focus.
const Shell = ({ children }) => (
  <div className="w-full min-h-screen bg-warm-50 dark:bg-stone-950 transition-colors duration-300">
    <Navbar />
    <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
  </div>
);

const Header = ({ title, subtitle, right, onBack }) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center">
      <button onClick={onBack} className="flex items-center p-2 sm:px-4 sm:py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 transition-colors mr-4">
        <ArrowLeftIcon className="h-5 w-5" />
        <span className="hidden sm:inline ml-2">Back to Profile</span>
      </button>
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-stone-600 dark:text-stone-400">{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

const ReviewSession = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const basePath = getBasePath(pathname);
  const greMode = isGREMode(pathname);

  const decks = useFlashcardStore((s) => s.decks);
  const fetchDecks = useFlashcardStore((s) => s.fetchDecks);

  const [phase, setPhase] = useState('config'); // 'config' | 'running' | 'summary'

  // --- config ---
  const [deck, setDeck] = useState('');
  const [type, setType] = useState(greMode ? 'GRE-Word' : 'All');
  const [include, setInclude] = useState('both');
  const [recencyDays, setRecencyDays] = useState(30);
  const [sessionSize, setSessionSize] = useState(20);
  const [counts, setCounts] = useState(null); // { due, new }
  const [countsLoading, setCountsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- session ---
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [answerDraft, setAnswerDraft] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]); // { cardId, isCorrect, schedule }
  const [grading, setGrading] = useState(false);

  const typeOptions = greMode ? GRE_CARD_TYPES : CARD_TYPES;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`${basePath}/profile`);
      return;
    }
    if (!decks || decks.length === 0) {
      fetchDecks().catch(() => {});
    }
  }, [isAuthenticated, navigate, basePath, decks, fetchDecks]);

  const configForRequest = useMemo(
    () => ({ deck: deck || undefined, type, include, recencyDays: Number(recencyDays) || 30 }),
    [deck, type, include, recencyDays],
  );

  // Live counts on the filter screen.
  useEffect(() => {
    if (phase !== 'config' || !isAuthenticated) return;
    let cancelled = false;
    setCountsLoading(true);
    const t = setTimeout(() => {
      fetchReviewQueue({ ...configForRequest, preview: true })
        .then((data) => {
          if (!cancelled) {
            setCounts(data.counts);
            setError(null);
          }
        })
        .catch(() => {
          if (!cancelled) setError('Could not load review counts.');
        })
        .finally(() => {
          if (!cancelled) setCountsLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [phase, isAuthenticated, configForRequest]);

  const availableForSession = counts ? counts.due + counts.new : 0;

  const startSession = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchReviewQueue({ ...configForRequest, limit: Number(sessionSize) || 20 });
      if (!data.cards || data.cards.length === 0) {
        setError('No cards match these filters right now.');
        return;
      }
      setCards(data.cards);
      setIndex(0);
      setAnswerDraft('');
      setRevealed(false);
      setResults([]);
      setPhase('running');
    } catch {
      setError('Could not start the review session.');
    }
  }, [configForRequest, sessionSize]);

  const currentCard = cards[index];

  const grade = async (isCorrect) => {
    if (!currentCard || grading) return;
    setGrading(true);
    let schedule = null;
    try {
      schedule = await gradeCardReview(currentCard._id, isCorrect);
    } catch (err) {
      console.error('Failed to record review grade:', err);
    }
    setGrading(false);

    setResults((prev) => [...prev, { cardId: currentCard._id, isCorrect, schedule }]);

    if (index < cards.length - 1) {
      setIndex(index + 1);
      setAnswerDraft('');
      setRevealed(false);
    } else {
      setPhase('summary');
    }
  };

  const backToProfile = () => navigate(`${basePath}/profile`);
  const restart = () => {
    setPhase('config');
    setCards([]);
    setResults([]);
    setIndex(0);
  };

  if (!isAuthenticated) return null;

  // ---------- CONFIG ----------
  if (phase === 'config') {
    return (
      <Shell>
        <Header onBack={backToProfile} title="Spaced Repetition Review" subtitle="Pick what to review, then start a session" />

        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-8 border border-stone-300 dark:border-stone-700 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Deck</span>
              <select className={fieldClass} value={deck} onChange={(e) => setDeck(e.target.value)}>
                <option value="">All decks</option>
                {(decks || []).map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Card type</span>
              <select className={fieldClass} value={type} onChange={(e) => setType(e.target.value)}>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>{t === 'All' ? 'All types' : t}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Include</span>
            <div className="flex flex-wrap gap-2">
              {INCLUDE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setInclude(opt.value)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                    include === opt.value
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-600 hover:border-brand-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {include !== 'due' && (
              <label className="block">
                <span className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  New cards from the last (days)
                </span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  className={fieldClass}
                  value={recencyDays}
                  onChange={(e) => setRecencyDays(e.target.value)}
                />
              </label>
            )}
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Session size</span>
              <input
                type="number"
                min="1"
                max="100"
                className={fieldClass}
                value={sessionSize}
                onChange={(e) => setSessionSize(e.target.value)}
              />
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-700">
            <p className="text-stone-600 dark:text-stone-400">
              {countsLoading || !counts ? (
                'Counting…'
              ) : (
                <>
                  <span className="font-semibold text-stone-900 dark:text-white">{counts.due}</span> due
                  {' · '}
                  <span className="font-semibold text-stone-900 dark:text-white">{counts.new}</span> new
                </>
              )}
            </p>
            <button className={btnPrimary} onClick={startSession} disabled={availableForSession === 0}>
              Start review
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </Shell>
    );
  }

  // ---------- SUMMARY ----------
  if (phase === 'summary') {
    const correct = results.filter((r) => r.isCorrect).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const intervals = results
      .map((r) => r.schedule?.interval)
      .filter((n) => Number.isFinite(n));
    const spread =
      intervals.length > 0
        ? `Next reviews scheduled ${Math.min(...intervals)}–${Math.max(...intervals)} day(s) out`
        : null;

    return (
      <Shell>
        <Header onBack={backToProfile} title="Review Complete 🎉" />
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-12 text-center border border-stone-300 dark:border-stone-700">
          <TrophyIcon className={`h-28 w-28 mx-auto mb-6 ${pct >= 70 ? 'text-yellow-500' : pct >= 50 ? 'text-stone-400' : 'text-orange-500'}`} />
          <div className="text-6xl font-bold mb-4">
            <span className={pct >= 70 ? 'text-green-600 dark:text-green-400' : pct >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}>
              {pct}%
            </span>
          </div>
          <p className="text-2xl text-stone-700 dark:text-stone-300 mb-2">{correct} of {total} recalled</p>
          {spread && <p className="text-stone-600 dark:text-stone-400 mb-8">{spread}</p>}
          <div className="flex justify-center gap-4 mt-4">
            <button className={btnPrimary} onClick={restart}>New session</button>
            <button className={btnGhost} onClick={backToProfile}>Back to Profile</button>
          </div>
        </div>
      </Shell>
    );
  }

  // ---------- RUNNING ----------
  const progress = cards.length > 0 ? (index / cards.length) * 100 : 0;

  return (
    <Shell>
      <Header
        onBack={backToProfile}
        title="Reviewing"
        subtitle={`Card ${index + 1} of ${cards.length}`}
        right={
          <button onClick={restart} className="flex items-center px-3 py-2 text-sm bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600 transition-colors">
            <AdjustmentsHorizontalIcon className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        }
      />

      <div className="mb-8 w-full bg-stone-200 dark:bg-stone-700 rounded-full h-3">
        <div className="bg-brand-600 dark:bg-amber-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {currentCard && (
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-lg p-8 mb-6 border border-stone-300 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Question</h2>
            {currentCard.isNew ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">new</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                seen ×{currentCard.review?.repetitions ?? 0}
              </span>
            )}
          </div>
          <p className="text-lg text-stone-700 dark:text-stone-300 mb-6">{currentCard.question}</p>

          {currentCard.hint && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">💡 Hint</h3>
              <p className="text-stone-700 dark:text-stone-300">{currentCard.hint}</p>
            </div>
          )}

          {!revealed ? (
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Recall it in your own words (optional):
              </label>
              <textarea
                value={answerDraft}
                onChange={(e) => setAnswerDraft(e.target.value)}
                rows="5"
                className={fieldClass}
                placeholder="Type what you remember, or just hit Show answer…"
              />
              <button onClick={() => setRevealed(true)} className={`mt-4 w-full ${btnPrimary}`}>
                Show answer
                <ChevronRightIcon className="h-5 w-5 ml-2" />
              </button>
            </div>
          ) : (
            <div>
              {answerDraft.trim() && (
                <div className="mb-6 p-4 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-700">
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-300 mb-2">Your recall:</h3>
                  <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{answerDraft}</p>
                </div>
              )}

              <div className="space-y-6">
                {currentCard.explanation && (
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-3">Explanation</h3>
                    <div className="prose dark:prose-invert max-w-none bg-stone-50 dark:bg-stone-900/50 p-4 rounded-lg">
                      <ReactMarkdown components={markdownComponents}>{currentCard.explanation}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {currentCard.problemStatement && (
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-3">Problem Statement</h3>
                    <div className="prose dark:prose-invert max-w-none bg-stone-50 dark:bg-stone-900/50 p-4 rounded-lg">
                      <ReactMarkdown components={markdownComponents}>{currentCard.problemStatement}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {currentCard.code && (
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-3">Code</h3>
                    <CodeEditor value={currentCard.code} language={currentCard.language || 'python'} readOnly />
                  </div>
                )}
                {currentCard.link && (
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-3">Link</h3>
                    <a href={currentCard.link} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-amber-500 hover:underline">
                      {currentCard.link}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700">
                <p className="text-center text-stone-700 dark:text-stone-300 mb-4 font-medium">Did you recall it?</p>
                <div className="flex gap-4">
                  <button onClick={() => grade(false)} disabled={grading} className="flex-1 flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    No
                  </button>
                  <button onClick={() => grade(true)} disabled={grading} className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
};

export default ReviewSession;
