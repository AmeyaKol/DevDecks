import express from 'express';
import {
  listConversations,
  getConversation,
  createConversation,
  updateConversationMessages,
  deleteConversation,
} from '../controllers/conversationController.js';

const router = express.Router();

router.get('/', listConversations);
router.get('/:id', getConversation);
router.post('/', createConversation);
router.put('/:id/messages', updateConversationMessages);
router.delete('/:id', deleteConversation);

export default router;