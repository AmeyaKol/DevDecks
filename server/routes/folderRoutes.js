// server/routes/folderRoutes.js
import express from 'express';
import {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  addDeckToFolder,
  removeDeckFromFolder,
  getFoldersContainingDeck
} from '../controllers/folderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes that don't require folder ID
router.route('/')
  .get(getFolders)           // GET /api/folders - get all folders
  .post(protect, createFolder); // POST /api/folders - create folder (auth required)

// Route to get folders containing a specific deck
router.route('/deck/:deckId')
  .get(getFoldersContainingDeck); // GET /api/folders/deck/:deckId

// Routes that require folder ID
router.route('/:id')
  .get(getFolderById)        // GET /api/folders/:id - get folder by id
  .put(protect, updateFolder) // PUT /api/folders/:id - update folder (auth required)
  .delete(protect, deleteFolder); // DELETE /api/folders/:id - delete folder (auth required)

// Routes for managing decks within folders
router.route('/:id/decks')
  .post(protect, addDeckToFolder); // POST /api/folders/:id/decks - add deck to folder (auth required)

router.route('/:id/decks/:deckId')
  .delete(protect, removeDeckFromFolder); // DELETE /api/folders/:id/decks/:deckId - remove deck from folder (auth required)

export default router;




