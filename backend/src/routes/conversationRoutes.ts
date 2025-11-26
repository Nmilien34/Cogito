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
router.use(authenticate as any);

// Conversation management
router.get('/', getConversations as any);
router.get('/:conversationId', getConversation as any);
router.delete('/:conversationId', deleteConversation as any);

// Streaming endpoints
router.post('/:conversationId/stream/start', startStream as any);
router.post('/:conversationId/threads/:threadId/stream/start', startStream as any);

export default router;
