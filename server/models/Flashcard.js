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
        }
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

export default Flashcard;