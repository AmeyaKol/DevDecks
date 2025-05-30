// server/routes/deckRoutes.js
import express from 'express';
import {
    createDeck,
    getDecks,
    getDeckById,
    updateDeck,
    deleteDeck,
} from '../controllers/deckController.js';

const router = express.Router();

router.route('/').post(createDeck).get(getDecks);
router.route('/:id').get(getDeckById).put(updateDeck).delete(deleteDeck);

export default router;