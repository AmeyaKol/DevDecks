import express from 'express';
import { registerUser, loginUser, getUserProfile, updateProblemsCompleted, addToFavorites, removeFromFavorites } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/problems-completed', protect, updateProblemsCompleted);
router.post('/favorites/add', protect, addToFavorites);
router.post('/favorites/remove', protect, removeFromFavorites);

export default router; 