// server/routes/flashcardRoutes.js
import express from 'express';
import {
  getFlashcards,
  createFlashcard,
  updateFlashcard, // Import updateFlashcard
  deleteFlashcard,
  getFlashcardsCreatedOnDate,
} from '../controllers/flashcardController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { validateFlashcardCreate, validateFlashcardUpdate } from '../middleware/validators.js';

const router = express.Router();

router.route('/').get(optionalAuth, getFlashcards).post(protect, validateFlashcardCreate, createFlashcard);
router.route('/created-on-date').get(protect, getFlashcardsCreatedOnDate); // Add EOD route
router.route('/:id').put(protect, validateFlashcardUpdate, updateFlashcard).delete(protect, deleteFlashcard); // Add PUT route

export default router;