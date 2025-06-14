// server/models/Flashcard.js
import mongoose from 'mongoose';

const flashcardSchema = mongoose.Schema(
    {
        question: {
            type: String,
            required: [true, 'Please add a question'],
        },
        hint: {
            type: String,
            default: '',
        },
        explanation: { // Will store Markdown
            type: String,
            required: [true, 'Please add an explanation'],
        },
        code: { // Will store Python code as a string
            type: String,
            default: '',
        },
        link: { // New field for external link
            type: String,
            default: '',
        },
        // New "Type" property
        type: {
            type: String,
            required: [true, 'Please specify a type for the flashcard'],
            enum: ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other'], // Feel free to expand
            default: 'DSA', // Or 'Other', depending on your common case
        },
        // New "Tags" property
        tags: [{
            type: String,
            trim: true, // Remove whitespace from tags
        }],
        // New "Decks" property (array of Deck ObjectIds)
        decks: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Deck', // Reference to the Deck model
        }],
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
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

export default Flashcard;