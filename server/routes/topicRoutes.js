import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireFeature } from '../middleware/featureFlagMiddleware.js';
import { semanticKGSearch } from '../controllers/kgSearchController.js';

const router = express.Router();

router.use(protect);
router.use(requireFeature('knowledgeGraph'));

router.get('/semantic', semanticKGSearch);

export default router;
