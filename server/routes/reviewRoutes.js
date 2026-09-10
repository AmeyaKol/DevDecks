import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateGrade } from '../middleware/validators.js';
import { gradeCard, getDueCards } from '../controllers/reviewController.js';

const router = express.Router();

// Every handler scopes its query by req.user._id.
router.use(protect);

router.get('/due', getDueCards);
router.post('/:cardId/grade', validateGrade, gradeCard);

export default router;
