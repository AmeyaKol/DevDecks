// server/models/Deck.js
import mongoose from 'mongoose';

const deckSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Deck name is required'],
            trim: true,
            unique: true, // Ensure deck names are unique for a user if you add users later
        },
        description: {
            type: String,
            trim: true,
            default: '',
        }
        // We won't store flashcard IDs directly in the deck model.
        // Instead, the Flashcard model will store an array of deck IDs it belongs to.
        // This makes a many-to-many relationship easier if a flashcard can be in multiple decks.
    },
    {
        timestamps: true,
    }
);

const Deck = mongoose.model('Deck', deckSchema);
export default Deck;