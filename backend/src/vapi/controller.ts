import { Request, Response } from 'express';
import { CaregiverMessage } from '../models/CaregiverMessage';
import { ConversationLog } from '../models/ConversationLog';
import { VapiWebhookRequest, VapiToolCallResponse } from './types';

/**
 * Vapi function: Get caregiver messages for a device
 */
export const getCaregiverMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const vapiRequest = req.body as VapiWebhookRequest;
    const { deviceId } = vapiRequest.message?.toolCalls?.[0]?.function?.arguments || req.body;

    console.log('🔍 Vapi requesting messages for device:', deviceId);

    if (!deviceId) {
      const response: VapiToolCallResponse = {
        results: [{
          toolCallId: vapiRequest.message?.toolCalls?.[0]?.id || '',
          result: 'Device ID is required'
        }]
      };
      res.json(response);
      return;
    }

    // Fetch undelivered messages
    const messages = await CaregiverMessage.find({
      deviceId,
      deliveredToPatient: false
    }).sort({ createdAt: -1 }).limit(5);

    if (messages.length === 0) {
      const response: VapiToolCallResponse = {
        results: [{
          toolCallId: vapiRequest.message?.toolCalls?.[0]?.id || '',
          result: 'No new messages from family members.'
        }]
      };
      res.json(response);
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

    const response: VapiToolCallResponse = {
      results: [{
        toolCallId: vapiRequest.message?.toolCalls?.[0]?.id || '',
        result
      }]
    };
    res.json(response);
  } catch (error) {
    console.error('❌ Get messages error:', error);
    const response: VapiToolCallResponse = {
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id || '',
        result: 'Failed to retrieve messages'
      }]
    };
    res.status(500).json(response);
  }
};

/**
 * Vapi function: Save a message from family member
 */
export const saveMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const vapiRequest = req.body as VapiWebhookRequest;
    const params = vapiRequest.message?.toolCalls?.[0]?.function?.arguments || req.body;
    const { senderName, patientIdentifier, messageText, senderPhone } = params;

    console.log('💾 Saving message:', { senderName, patientIdentifier, messageText });

    if (!senderName || !patientIdentifier || !messageText) {
      const response: VapiToolCallResponse = {
        results: [{
          toolCallId: vapiRequest.message?.toolCalls?.[0]?.id || '',
          result: 'Missing required information. Please provide sender name, patient identifier, and message.'
        }]
      };
      res.json(response);
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

    const response: VapiToolCallResponse = {
      results: [{
        toolCallId: vapiRequest.message?.toolCalls?.[0]?.id || '',
        result: `Thank you ${senderName}. Your message has been saved and will be delivered to your loved one during their next conversation.`
      }]
    };
    res.json(response);
  } catch (error) {
    console.error('❌ Save message error:', error);
    const response: VapiToolCallResponse = {
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id || '',
        result: 'Failed to save message. Please try again.'
      }]
    };
    res.status(500).json(response);
  }
};

/**
 * Vapi function: Log conversation for caregivers
 */
export const logConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const vapiRequest = req.body as VapiWebhookRequest;
    const params = vapiRequest.message?.toolCalls?.[0]?.function?.arguments || req.body;
    const { deviceId, summary, concerns } = params;

    console.log('📝 Logging conversation:', { deviceId, summary, concerns });

    if (!deviceId || !summary) {
      const response: VapiToolCallResponse = {
        results: [{
          toolCallId: vapiRequest.message?.toolCalls?.[0]?.id || '',
          result: 'Device ID and summary are required'
        }]
      };
      res.json(response);
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

    const response: VapiToolCallResponse = {
      results: [{
        toolCallId: vapiRequest.message?.toolCalls?.[0]?.id || '',
        result: 'Conversation logged successfully'
      }]
    };
    res.json(response);
  } catch (error) {
    console.error('❌ Log conversation error:', error);
    const response: VapiToolCallResponse = {
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id || '',
        result: 'Failed to log conversation'
      }]
    };
    res.status(500).json(response);
  }
};

/**
 * Vapi function: Mark message as read
 */
export const markMessageRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const vapiRequest = req.body as VapiWebhookRequest;
    const params = vapiRequest.message?.toolCalls?.[0]?.function?.arguments || req.body;
    const { messageId } = params;

    if (!messageId) {
      const response: VapiToolCallResponse = {
        results: [{
          toolCallId: vapiRequest.message?.toolCalls?.[0]?.id || '',
          result: 'Message ID is required'
        }]
      };
      res.json(response);
      return;
    }

    await CaregiverMessage.findByIdAndUpdate(messageId, {
      read: true,
      readAt: new Date()
    });

    const response: VapiToolCallResponse = {
      results: [{
        toolCallId: vapiRequest.message?.toolCalls?.[0]?.id || '',
        result: 'Message marked as read'
      }]
    };
    res.json(response);
  } catch (error) {
    console.error('❌ Mark read error:', error);
    const response: VapiToolCallResponse = {
      results: [{
        toolCallId: req.body.message?.toolCalls?.[0]?.id || '',
        result: 'Failed to mark message as read'
      }]
    };
    res.status(500).json(response);
  }
};


