import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import deckRoutes from './routes/deckRoutes.js'; // Import deck routes
import userRoutes from './routes/userRoutes.js';

dotenv.config();
connectDB();

// Set default JWT secret if not provided
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'your-secret-key-change-in-production';
    console.warn('Warning: Using default JWT_SECRET. Set JWT_SECRET in .env file for production.');
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/flashcards', flashcardRoutes);
app.use('/api/decks', deckRoutes); // Use deck routes
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});