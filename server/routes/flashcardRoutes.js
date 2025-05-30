// server/routes/flashcardRoutes.js
import express from 'express';
import {
  getFlashcards,
  createFlashcard,
  updateFlashcard, // Import updateFlashcard
  deleteFlashcard,
} from '../controllers/flashcardController.js';

const router = express.Router();

router.route('/').get(getFlashcards).post(createFlashcard);
router.route('/:id').put(updateFlashcard).delete(deleteFlashcard); // Add PUT route

export default router;