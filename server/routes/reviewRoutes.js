import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateGrade } from '../middleware/validators.js';
import { gradeCard, getReviewQueue } from '../controllers/reviewController.js';

const router = express.Router();

// Every handler scopes its query by req.user._id.
router.use(protect);

router.get('/queue', getReviewQueue);
router.post('/:cardId/grade', validateGrade, gradeCard);

export default router;
