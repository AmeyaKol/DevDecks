import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { semanticKGSearch } from '../controllers/kgSearchController.js';

const router = express.Router();

router.use(protect);

router.get('/semantic', semanticKGSearch);

export default router;
