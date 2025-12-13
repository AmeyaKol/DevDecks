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
        problemStatement: {
            type: String,
        },
        code: { // Will store Python code as a string
            type: String,
            default: '',
        },
        // Add language field
        language: {
            type: String,
            enum: ['python', 'cpp', 'java', 'javascript'],
            default: 'python',
        },
        link: { // New field for external link
            type: String,
            default: '',
        },
        // New "Type" property
        type: {
            type: String,
            required: [true, 'Please specify a type for the flashcard'],
            enum: ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'], // Added GRE types
            default: 'DSA', // Or 'Other', depending on your common case
        },
        // New metadata field for storing type-specific data
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
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
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

// Indexes for query optimization
// Index for fetching flashcards by user, sorted by creation date
flashcardSchema.index({ user: 1, createdAt: -1 });

// Index for fetching public flashcards, sorted by creation date
flashcardSchema.index({ isPublic: 1, createdAt: -1 });

// Index for filtering by type and user
flashcardSchema.index({ type: 1, user: 1 });

// Index for filtering by type and public status
flashcardSchema.index({ type: 1, isPublic: 1 });

// Index for deck lookups (many-to-many relationship)
flashcardSchema.index({ decks: 1 });

// Index for tag searches
flashcardSchema.index({ tags: 1 });

// Compound index for common query pattern: visibility + type + createdAt
flashcardSchema.index({ isPublic: 1, type: 1, createdAt: -1 });

// Text index for search functionality
flashcardSchema.index({ 
    question: 'text', 
    explanation: 'text', 
    problemStatement: 'text' 
}, {
    weights: {
        question: 10,
        problemStatement: 5,
        explanation: 1
    },
    name: 'flashcard_text_search'
});

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

export default Flashcard;