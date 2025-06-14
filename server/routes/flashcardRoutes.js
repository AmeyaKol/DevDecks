// server/routes/flashcardRoutes.js
import express from 'express';
import {
  getFlashcards,
  createFlashcard,
  updateFlashcard, // Import updateFlashcard
  deleteFlashcard,
} from '../controllers/flashcardController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(optionalAuth, getFlashcards).post(protect, createFlashcard);
router.route('/:id').put(protect, updateFlashcard).delete(protect, deleteFlashcard); // Add PUT route

export default router;