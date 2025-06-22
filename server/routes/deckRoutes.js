// server/routes/deckRoutes.js
import express from 'express';
import {
    createDeck,
    getDecks,
    getDeckById,
    updateDeck,
    deleteDeck,
    getDeckTypes,
} from '../controllers/deckController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createDeck).get(optionalAuth, getDecks);
router.route('/types').get(getDeckTypes);
router.route('/:id').get(optionalAuth, getDeckById).put(protect, updateDeck).delete(protect, deleteDeck);

export default router;