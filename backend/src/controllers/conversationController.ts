import { Response } from 'express';
import { AuthRequest } from '../types';
import { Conversation } from '../models/Conversation';

// Start a streaming conversation
export const startStream = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { conversationId } = req.params;
    const { threadId } = req.params;
    const { message, model, style, selectedResources, resources, token: _token } = req.body;

    if (!message) {
      res.status(400).json({ message: 'Message is required' });
      return;
    }

    // Find or create conversation
    let conversation;

    if (conversationId && conversationId !== 'new') {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: req.user.id
      });

      if (!conversation) {
        res.status(404).json({ message: 'Conversation not found' });
        return;
      }
    } else {
      // Create new conversation
      conversation = await Conversation.create({
        userId: req.user.id,
        title: message.substring(0, 50),
        messages: [],
        model: model || 'default',
        style: style || 'default',
        isVoiceConversation: false,
        active: true
      });
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      metadata: {
        model,
        style,
        selectedResources,
        resources
      }
    });

    await conversation.save();

    // TODO: Implement actual AI streaming response
    // For now, return a mock response
    const aiResponse = `This is a mock AI response to: "${message}". AI streaming will be implemented with your preferred AI provider (OpenAI, Anthropic, etc.)`;

    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    await conversation.save();

    res.status(200).json({
      conversationId: conversation._id,
      threadId: threadId || conversation._id,
      response: aiResponse,
      conversation: conversation.toJSON()
    });
  } catch (error) {
    console.error('Start stream error:', error);
    res.status(500).json({ message: 'Failed to start conversation' });
  }
};

// Get conversation history
export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user.id
    });

    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }

    res.status(200).json(conversation.toJSON());
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Failed to get conversation' });
  }
};

// Get all conversations for user
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({
      userId: req.user.id,
      active: true
    })
      .sort({ updatedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Conversation.countDocuments({
      userId: req.user.id,
      active: true
    });

    res.status(200).json({
      conversations: conversations.map(c => c.toJSON()),
      page: Number(page),
      limit: Number(limit),
      total
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Failed to get conversations' });
  }
};

// Delete a conversation
export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user.id
    });

    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }

    conversation.active = false;
    await conversation.save();

    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Failed to delete conversation' });
  }
};
