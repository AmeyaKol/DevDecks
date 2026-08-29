import express from 'express';
import {
  listConversations,
  getConversation,
  createConversation,
  updateConversationMessages,
  deleteConversation,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Every handler scopes its query by `req.user._id`. Without this, `req.user` is
// undefined, Mongoose drops the undefined key, and the query widens to every
// user's conversations.
router.use(protect);

router.get('/', listConversations);
router.get('/:id', getConversation);
router.post('/', createConversation);
router.put('/:id/messages', updateConversationMessages);
router.delete('/:id', deleteConversation);

export default router;