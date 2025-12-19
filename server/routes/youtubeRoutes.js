import express from 'express';

const router = express.Router();
import { importYoutubePlaylist, testApiKey, validateYoutubeVideo } from '../controllers/youtubeController.js';

// POST /api/youtube/playlist
router.post('/playlist', importYoutubePlaylist);

// POST /api/youtube/video - Validate single video URL for split card feature
router.post('/video', validateYoutubeVideo);

// GET /api/youtube/test-key
router.get('/test-key', testApiKey);

export default router;