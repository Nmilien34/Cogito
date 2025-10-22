import { Router } from 'express';
import {
  startStream,
  getConversation,
  getConversations,
  deleteConversation
} from '../controllers/conversationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Conversation management
router.get('/', getConversations);
router.get('/:conversationId', getConversation);
router.delete('/:conversationId', deleteConversation);

// Streaming endpoints
router.post('/:conversationId/stream/start', startStream);
router.post('/:conversationId/threads/:threadId/stream/start', startStream);

export default router;
