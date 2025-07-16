import express from 'express';

const router = express.Router();
import { importYoutubePlaylist } from '../controllers/youtubeController.js';

// POST /api/youtube/playlist
router.post('/playlist', importYoutubePlaylist);

export default router;