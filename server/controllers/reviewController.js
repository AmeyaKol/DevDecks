import mongoose from 'mongoose';
import CardReview from '../models/CardReview.js';
import Flashcard from '../models/Flashcard.js';
import { scheduleNext, qualityFromCorrect, DEFAULT_EASE } from '../services/srsService.js';

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

// @desc    Cards whose SM-2 schedule has them due now, soonest first
// @route   GET /api/reviews/due?limit=50
// @access  Private
export const getDueCards = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
        const now = new Date();

        const due = await CardReview.find({ user: req.user._id, dueDate: { $lte: now } })
            .sort({ dueDate: 1 })
            .limit(limit)
            .populate({
                path: 'flashcard',
                select: 'question explanation hint problemStatement code codeLanguage link type decks',
                populate: { path: 'decks', select: 'name _id' },
            })
            .lean();

        const cards = due
            .filter((row) => row.flashcard) // card deleted out from under the schedule
            .map((row) => ({
                ...row.flashcard,
                language: row.flashcard.codeLanguage,
                review: {
                    dueDate: row.dueDate,
                    interval: row.interval,
                    repetitions: row.repetitions,
                    easeFactor: row.easeFactor,
                    lapses: row.lapses,
                    lastReviewedAt: row.lastReviewedAt,
                },
            }));

        return res.status(200).json({ count: cards.length, cards });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error: Could not fetch due cards', error: error.message });
    }
};
