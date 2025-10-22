import { Router } from 'express';
import {
  getCaregiverMessages,
  saveMessage,
  logConversation,
  markMessageRead
} from '../controllers/vapiController';

const router = Router();

/**
 * Vapi Webhook Endpoints
 * These are called by Vapi when the AI assistant invokes functions
 */

// Get messages from caregivers
router.post('/get-messages', getCaregiverMessages);

// Save a message from family member (when they call)
router.post('/save-message', saveMessage);

// Log conversation for caregiver review
router.post('/log-conversation', logConversation);

// Mark a message as read
router.post('/mark-read', markMessageRead);

export default router;
