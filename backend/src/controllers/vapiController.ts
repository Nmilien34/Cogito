import { Request, Response } from 'express';
import { CaregiverMessage } from '../models/CaregiverMessage';
import { ConversationLog } from '../models/ConversationLog';
import { User } from '../models/User';

/**
 * Vapi function: Get caregiver messages for a device
 */
export const getCaregiverMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.body.message?.toolCalls?.[0]?.function?.arguments || req.body;

    console.log('🔍 Vapi requesting messages for device:', deviceId);

    if (!deviceId) {
      res.json({
        results: [{
          toolCallId: req.body.message?.toolCalls?.[0]?.id,
          result: 'Device ID is required'
        }]
      });
      return;
    }

    // Fetch undelivered messages
    const messages = await CaregiverMessage.find({
      deviceId,
      deliveredToPatient: false
    }).sort({ createdAt: -1 }).limit(5);

    if (messages.length === 0) {
      res.json({
        results: [{
          toolCallId: req.body.message?.toolCalls?.[0]?.id,
          result: 'No new messages from family members.'
        }]
      });
      return;
    }

    // Format messages for AI to read
    const messageText = messages.map((m, index) =>
      `Message ${index + 1} from ${m.senderName}: ${m.messageText}`
    ).join('. ');

    const result = `You have ${messages.length} new message${messages.length > 1 ? 's' : ''}. ${messageText}`;

    // Mark as delivered
    await CaregiverMessage.updateMany(
      { _id: { $in: messages.map(m => m._id) } },
      {
        deliveredToPatient: true,
        deliveredAt: new Date()
      }
    );

    res.json({
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id,
        result
      }]
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id,
        result: 'Failed to retrieve messages'
      }]
    });
  }
};

/**
 * Vapi function: Save a message from family member
 */
export const saveMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.body.message?.toolCalls?.[0]?.function?.arguments || req.body;
    const { senderName, patientIdentifier, messageText, senderPhone } = params;

    console.log('💾 Saving message:', { senderName, patientIdentifier, messageText });

    if (!senderName || !patientIdentifier || !messageText) {
      res.json({
        results: [{
          toolCallId: req.body.message?.toolCalls?.[0]?.id,
          result: 'Missing required information. Please provide sender name, patient identifier, and message.'
        }]
      });
      return;
    }

    // Find device by patient identifier (could be device ID, phone, or email)
    // For now, assume it's the device ID
    const deviceId = patientIdentifier;

    // Save message
    await CaregiverMessage.create({
      deviceId,
      senderName,
      senderPhone,
      messageText,
      deliveredToPatient: false,
      read: false,
      priority: 'normal'
    });

    res.json({
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id,
        result: `Thank you ${senderName}. Your message has been saved and will be delivered to your loved one during their next conversation.`
      }]
    });
  } catch (error) {
    console.error('❌ Save message error:', error);
    res.status(500).json({
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id,
        result: 'Failed to save message. Please try again.'
      }]
    });
  }
};

/**
 * Vapi function: Log conversation for caregivers
 */
export const logConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.body.message?.toolCalls?.[0]?.function?.arguments || req.body;
    const { deviceId, summary, concerns } = params;

    console.log('📝 Logging conversation:', { deviceId, summary, concerns });

    if (!deviceId || !summary) {
      res.json({
        results: [{
          toolCallId: req.body.message?.toolCalls?.[0]?.id,
          result: 'Device ID and summary are required'
        }]
      });
      return;
    }

    // Save conversation log
    await ConversationLog.create({
      deviceId,
      summary,
      concerns: concerns || [],
      timestamp: new Date()
    });

    // If there are concerns, we could notify caregivers via SMS/email here
    if (concerns && concerns.length > 0) {
      console.log('⚠️ Concerns detected:', concerns);
      // TODO: Implement caregiver notifications
    }

    res.json({
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id,
        result: 'Conversation logged successfully'
      }]
    });
  } catch (error) {
    console.error('❌ Log conversation error:', error);
    res.status(500).json({
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id,
        result: 'Failed to log conversation'
      }]
    });
  }
};

/**
 * Vapi function: Mark message as read
 */
export const markMessageRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.body.message?.toolCalls?.[0]?.function?.arguments || req.body;
    const { messageId } = params;

    if (!messageId) {
      res.json({
        results: [{
          toolCallId: req.body.message?.toolCalls?.[0]?.id,
          result: 'Message ID is required'
        }]
      });
      return;
    }

    await CaregiverMessage.findByIdAndUpdate(messageId, {
      read: true,
      readAt: new Date()
    });

    res.json({
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id,
        result: 'Message marked as read'
      }]
    });
  } catch (error) {
    console.error('❌ Mark read error:', error);
    res.status(500).json({
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id,
        result: 'Failed to mark message as read'
      }]
    });
  }
};
