import express from 'express';
import { importYoutubePlaylist, testApiKey, validateYoutubeVideo } from '../controllers/youtubeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.post('/playlist', protect, importYoutubePlaylist);
router.post('/video', protect, validateYoutubeVideo);

if (process.env.NODE_ENV === 'production') {
  router.get('/test-key', protect, adminOnly, testApiKey);
} else {
  router.get('/test-key', testApiKey);
}

export default router;