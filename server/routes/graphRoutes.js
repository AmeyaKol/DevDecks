import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getGraph, getGraphByDeck } from '../controllers/graphController.js';

const router = express.Router();

router.use(protect);

router.get('/', getGraph);
router.get('/deck/:deckId', getGraphByDeck);

export default router;
