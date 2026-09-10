import mongoose from 'mongoose';

/**
 * Per-learner SM-2 schedule for a flashcard.
 *
 * This can't live on the Flashcard document: cards default to `isPublic: true`
 * and are reviewed by many users, so ease/interval/dueDate are per (user, card).
 */
const cardReviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        flashcard: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Flashcard',
            required: true,
        },
        easeFactor: { type: Number, default: 2.5 },
        interval: { type: Number, default: 0 },      // days until next due
        repetitions: { type: Number, default: 0 },   // consecutive successful recalls
        lapses: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
        dueDate: { type: Date, default: Date.now },
        lastReviewedAt: { type: Date, default: null },
        lastQuality: { type: Number, default: null },
    },
    { timestamps: true }
);

// One schedule per (user, card); also the lookup key on every grade.
cardReviewSchema.index({ user: 1, flashcard: 1 }, { unique: true });
// The due-queue query: a user's cards ordered by when they come due.
cardReviewSchema.index({ user: 1, dueDate: 1 });

export default mongoose.model('CardReview', cardReviewSchema);
