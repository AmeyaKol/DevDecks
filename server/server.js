import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import deckRoutes from './routes/deckRoutes.js'; // Import deck routes

dotenv.config();
connectDB();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/flashcards', flashcardRoutes);
app.use('/api/decks', deckRoutes); // Use deck routes

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});