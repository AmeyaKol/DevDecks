import mongoose from 'mongoose';
import CardReview from '../models/CardReview.js';
import Flashcard from '../models/Flashcard.js';
import { scheduleNext, qualityFromCorrect, DEFAULT_EASE } from '../services/srsService.js';
import { hasUserNotes } from '../services/cardNotesHeuristic.js';

const QUEUE_CARD_FIELDS = 'question explanation hint problemStatement code codeLanguage link type tags decks createdAt updatedAt';

const clampInt = (value, min, max, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
};

// Normalise a populated flashcard for the review runner, attaching the SM-2
// state (or nulls for a card that hasn't been reviewed yet).
const shapeQueueCard = (card, review) => ({
    ...card,
    language: card.codeLanguage,
    review: review
        ? {
            dueDate: review.dueDate,
            interval: review.interval,
            repetitions: review.repetitions,
            easeFactor: review.easeFactor,
            lapses: review.lapses,
            lastReviewedAt: review.lastReviewedAt,
        }
        : null,
    isNew: !review,
});

const matchesDeck = (card, deckId) =>
    !deckId || (card.decks || []).some((d) => String(d?._id ?? d) === String(deckId));

// @desc    Record a review grade for a card and reschedule it (SM-2)
// @route   POST /api/reviews/:cardId/grade
// @body    { correct: boolean }  or  { quality: 0..5 }
// @access  Private
export const gradeCard = async (req, res) => {
    try {
        const { cardId } = req.params;
        if (!mongoose.isValidObjectId(cardId)) {
            return res.status(400).json({ message: 'Invalid card id' });
        }

        const { correct, quality } = req.body || {};
        const grade = typeof quality === 'number' ? quality : qualityFromCorrect(Boolean(correct));

        // Only schedule cards the user can actually see (public, or their own).
        const card = await Flashcard.findOne({
            _id: cardId,
            $or: [{ isPublic: true }, { user: req.user._id }],
        }).select('_id');
        if (!card) {
            return res.status(404).json({ message: 'Flashcard not found' });
        }

        const existing = await CardReview.findOne({ user: req.user._id, flashcard: cardId });
        const priorState = existing || { easeFactor: DEFAULT_EASE, interval: 0, repetitions: 0 };
        const next = scheduleNext(priorState, grade);

        const review = await CardReview.findOneAndUpdate(
            { user: req.user._id, flashcard: cardId },
            {
                $set: {
                    easeFactor: next.easeFactor,
                    interval: next.interval,
                    repetitions: next.repetitions,
                    dueDate: next.dueDate,
                    lastReviewedAt: new Date(),
                    lastQuality: grade,
                },
                $inc: { reviewCount: 1, lapses: next.lapsed ? 1 : 0 },
                $setOnInsert: { user: req.user._id, flashcard: cardId },
            },
            { new: true, upsert: true },
        );

        return res.status(200).json({
            flashcardId: cardId,
            quality: grade,
            lapsed: next.lapsed,
            easeFactor: review.easeFactor,
            interval: review.interval,
            repetitions: review.repetitions,
            lapses: review.lapses,
            reviewCount: review.reviewCount,
            dueDate: review.dueDate,
        });
    } catch (error) {
        // Two graded reviews for the same new card can race on the unique index.
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'Concurrent review for this card; please retry' });
        }
        return res.status(500).json({ message: 'Server Error: Could not record review', error: error.message });
    }
};

// @desc    Build a review session: cards whose SM-2 schedule has them due, plus
//          recently-touched cards not yet in the rotation (treated as due-now).
// @route   GET /api/reviews/queue
// @query   deck, type, include=both|due|new, recencyDays=30, limit=20, preview=1
// @access  Private
//
// `counts` always reflects the full filtered universe; `cards` is the session
// slice (due first — they're overdue — then newest new cards) capped at `limit`.
// `preview=1` returns counts with an empty `cards`, for the filter screen.
export const getReviewQueue = async (req, res) => {
    try {
        const { deck, type } = req.query;
        const include = ['both', 'due', 'new'].includes(req.query.include) ? req.query.include : 'both';
        const recencyDays = clampInt(req.query.recencyDays, 1, 365, 30);
        const limit = clampInt(req.query.limit, 1, 100, 20);
        const preview = req.query.preview === '1' || req.query.preview === 'true';

        const deckId = deck && mongoose.isValidObjectId(deck) ? deck : null;
        const typeFilter = type && type !== 'All' ? type : null;
        const now = new Date();
        const recencyFloor = new Date(now.getTime() - recencyDays * 24 * 60 * 60 * 1000);

        // --- Scheduled and due: has a CardReview row with dueDate in the past.
        let dueCards = [];
        if (include !== 'new') {
            const dueRows = await CardReview.find({ user: req.user._id, dueDate: { $lte: now } })
                .sort({ dueDate: 1 })
                .limit(2000)
                .populate({
                    path: 'flashcard',
                    select: QUEUE_CARD_FIELDS,
                    populate: { path: 'decks', select: 'name _id' },
                })
                .lean();

            dueCards = dueRows
                .filter((row) => row.flashcard) // card deleted out from under the schedule
                .filter((row) => matchesDeck(row.flashcard, deckId))
                .filter((row) => !typeFilter || row.flashcard.type === typeFilter)
                .filter((row) => hasUserNotes(row.flashcard))
                .map((row) => shapeQueueCard(row.flashcard, row));
        }

        // --- New / recent: the user's noted cards, not yet reviewed, created or
        //     edited inside the recency window. Newest first.
        let newCards = [];
        if (include !== 'due') {
            const reviewedIds = await CardReview.find({ user: req.user._id }).distinct('flashcard');
            const cardFilter = {
                user: req.user._id,
                _id: { $nin: reviewedIds },
                $or: [{ createdAt: { $gte: recencyFloor } }, { updatedAt: { $gte: recencyFloor } }],
            };
            if (deckId) cardFilter.decks = deckId;
            if (typeFilter) cardFilter.type = typeFilter;

            const candidates = await Flashcard.find(cardFilter)
                .sort({ createdAt: -1 })
                .limit(500)
                .populate('decks', 'name _id')
                .lean();

            newCards = candidates.filter(hasUserNotes).map((card) => shapeQueueCard(card, null));
        }

        const counts = { due: dueCards.length, new: newCards.length };
        const cards = preview ? [] : [...dueCards, ...newCards].slice(0, limit);

        return res.status(200).json({ counts, cards });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error: Could not build review queue', error: error.message });
    }
};
