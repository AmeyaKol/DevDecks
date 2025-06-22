// server/models/Deck.js
import mongoose from 'mongoose';

const deckSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Deck name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        // New "Type" property for deck categorization
        type: {
            type: String,
            required: [true, 'Please specify a type for the deck'],
            enum: ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'],
            default: 'DSA',
        },
        // User ownership and privacy
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        // We won't store flashcard IDs directly in the deck model.
        // Instead, the Flashcard model will store an array of deck IDs it belongs to.
        // This makes a many-to-many relationship easier if a flashcard can be in multiple decks.
    },
    {
        timestamps: true,
    }
);

// Ensure deck names are unique per user
deckSchema.index({ name: 1, user: 1 }, { unique: true });

const Deck = mongoose.model('Deck', deckSchema);
export default Deck;