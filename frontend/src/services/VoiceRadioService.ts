/**
 * VoiceRadioService - Headless voice AI service for FM Radio device
 *
 * This service provides voice AI functionality without any UI components,
 * designed to run on an FM radio device with voice capabilities.
 */

import { useConversation } from '@11labs/react';

export type MessageType = 'transcript' | 'text' | 'tool_call' | 'tool_response';
export type ConversationStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface VoiceMessage {
  type: MessageType;
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ToolCall {
  toolName: string;
  args: any;
  callId: string;
}

export interface VoiceRadioConfig {
  agentId: string;
  onMessage?: (message: VoiceMessage) => void;
  onStatusChange?: (status: ConversationStatus) => void;
  onError?: (error: Error) => void;
  onToolCall?: (toolCall: ToolCall) => void;
}

export class VoiceRadioService {
  private agentId: string;
  private conversationHook: any = null;
  private isActive: boolean = false;

  // Event callbacks
  private onMessageCallback?: (message: VoiceMessage) => void;
  private onStatusChangeCallback?: (status: ConversationStatus) => void;
  private onErrorCallback?: (error: Error) => void;
  private onToolCallCallback?: (toolCall: ToolCall) => void;

  // State tracking
  private currentStatus: ConversationStatus = 'idle';
  private messageHistory: VoiceMessage[] = [];

  constructor(config: VoiceRadioConfig) {
    this.agentId = config.agentId;
    this.onMessageCallback = config.onMessage;
    this.onStatusChangeCallback = config.onStatusChange;
    this.onErrorCallback = config.onError;
    this.onToolCallCallback = config.onToolCall;
  }

  /**
   * Initialize the voice conversation hook
   * This should be called from within a React component
   */
  public initializeConversationHook(conversationHook: ReturnType<typeof useConversation>) {
    this.conversationHook = conversationHook;
  }

  /**
   * Start a voice conversation session
   */
  public async startConversation(): Promise<void> {
    if (this.isActive) {
      console.warn('Voice conversation already active');
      return;
    }

    if (!this.conversationHook?.startSession) {
      throw new Error('Conversation hook not initialized');
    }

    try {
      this.updateStatus('connecting');

      await this.conversationHook.startSession({
        agentId: this.agentId,
      });

      this.isActive = true;
      this.updateStatus('connected');

      console.log('✅ Voice conversation started');
    } catch (error) {
      this.updateStatus('error');
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Stop the current voice conversation
   */
  public async stopConversation(): Promise<void> {
    if (!this.isActive) {
      console.warn('No active voice conversation');
      return;
    }

    if (!this.conversationHook?.endSession) {
      throw new Error('Conversation hook not initialized');
    }

    try {
      await this.conversationHook.endSession();
      this.isActive = false;
      this.updateStatus('disconnected');
      this.clearHistory();

      console.log('✅ Voice conversation stopped');
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Handle incoming messages from the AI
   */
  public handleMessage = (message: any) => {
    let voiceMessage: VoiceMessage | null = null;

    switch (message.type) {
      case 'transcript':
        // User's spoken input (transcription)
        voiceMessage = {
          type: 'transcript',
          content: message.transcript || '',
          timestamp: new Date(),
          metadata: message
        };
        console.log('🎤 User said:', message.transcript);
        break;

      case 'text':
        // AI assistant's text response
        voiceMessage = {
          type: 'text',
          content: message.text || '',
          timestamp: new Date(),
          metadata: message
        };
        console.log('🤖 AI response:', message.text);
        break;

      case 'tool_call':
        // AI is calling a tool/function
        const toolCall: ToolCall = {
          toolName: message.toolName || '',
          args: message.args || {},
          callId: message.call_id || ''
        };

        voiceMessage = {
          type: 'tool_call',
          content: `Tool call: ${toolCall.toolName}`,
          timestamp: new Date(),
          metadata: toolCall
        };

        console.log('🔧 Tool called:', toolCall.toolName, toolCall.args);

        if (this.onToolCallCallback) {
          this.onToolCallCallback(toolCall);
        }
        break;

      case 'tool_response':
        // Response from a tool execution
        voiceMessage = {
          type: 'tool_response',
          content: message.response || '',
          timestamp: new Date(),
          metadata: message
        };
        console.log('📦 Tool response received');
        break;

      default:
        console.log('❓ Unknown message type:', message.type);
        return;
    }

    if (voiceMessage) {
      this.messageHistory.push(voiceMessage);

      if (this.onMessageCallback) {
        this.onMessageCallback(voiceMessage);
      }
    }
  };

  /**
   * Handle state updates from the conversation hook
   */
  public handleStateUpdate = (state: any) => {
    if ('status' in state) {
      this.updateStatus(state.status);
    }

    if ('isMuted' in state) {
      console.log('🔇 Muted:', state.isMuted);
    }
  };

  /**
   * Handle errors
   */
  private handleError(error: Error) {
    console.error('❌ Voice conversation error:', error);

    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  /**
   * Update conversation status
   */
  private updateStatus(status: ConversationStatus) {
    this.currentStatus = status;
    console.log('📡 Status:', status);

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  /**
   * Get current conversation status
   */
  public getStatus(): ConversationStatus {
    return this.currentStatus;
  }

  /**
   * Check if conversation is active
   */
  public isConversationActive(): boolean {
    return this.isActive;
  }

  /**
   * Get message history
   */
  public getHistory(): VoiceMessage[] {
    return [...this.messageHistory];
  }

  /**
   * Clear message history
   */
  public clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * Get the last N messages
   */
  public getRecentMessages(count: number = 10): VoiceMessage[] {
    return this.messageHistory.slice(-count);
  }
}
