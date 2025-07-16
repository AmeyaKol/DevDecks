import express from 'express';

const router = express.Router();
import { importYoutubePlaylist, testApiKey } from '../controllers/youtubeController.js';

// POST /api/youtube/playlist
router.post('/playlist', importYoutubePlaylist);

// GET /api/youtube/test-key
router.get('/test-key', testApiKey);

export default router;