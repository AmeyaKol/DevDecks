import express from 'express';
import { registerUser, loginUser, getUserProfile, updateProblemsCompleted, addToFavorites, removeFromFavorites, updateRecentDecks } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validators.js';

const router = express.Router();

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/problems-completed', protect, updateProblemsCompleted);
router.post('/favorites/add', protect, addToFavorites);
router.post('/favorites/remove', protect, removeFromFavorites);
router.post('/recent-deck', protect, updateRecentDecks);

export default router; 