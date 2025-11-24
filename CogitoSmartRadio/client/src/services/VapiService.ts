/**
 * VapiService - Voice AI service using Vapi
 *
 * This service provides voice AI functionality using Vapi's platform,
 * designed for FM radio devices with full backend integration.
 */

import Vapi from '@vapi-ai/web';

export type ConversationStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface VapiMessage {
  type: 'transcript' | 'function-call' | 'function-result' | 'speech-update' | 'status-update';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface VapiServiceConfig {
  publicKey: string;
  assistantId: string;
  onMessage?: (message: VapiMessage) => void;
  onStatusChange?: (status: ConversationStatus) => void;
  onError?: (error: Error) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export class VapiService {
  private vapi: Vapi;
  private assistantId: string;
  private isActive: boolean = false;
  private currentStatus: ConversationStatus = 'idle';
  private messageHistory: VapiMessage[] = [];

  // Event callbacks
  private onMessageCallback?: (message: VapiMessage) => void;
  private onStatusChangeCallback?: (status: ConversationStatus) => void;
  private onErrorCallback?: (error: Error) => void;
  private onSpeechStartCallback?: () => void;
  private onSpeechEndCallback?: () => void;

  constructor(config: VapiServiceConfig) {
    this.vapi = new Vapi(config.publicKey);
    this.assistantId = config.assistantId;
    this.onMessageCallback = config.onMessage;
    this.onStatusChangeCallback = config.onStatusChange;
    this.onErrorCallback = config.onError;
    this.onSpeechStartCallback = config.onSpeechStart;
    this.onSpeechEndCallback = config.onSpeechEnd;

    this.setupEventListeners();
  }

  /**
   * Set up Vapi event listeners
   */
  private setupEventListeners() {
    // Call started
    this.vapi.on('call-start', () => {
      console.log('📞 Vapi call started');
      this.isActive = true;
      this.updateStatus('connected');
    });

    // Call ended
    this.vapi.on('call-end', () => {
      console.log('📞 Vapi call ended');
      this.isActive = false;
      this.updateStatus('disconnected');
    });

    // Speech started (user started speaking)
    this.vapi.on('speech-start', () => {
      console.log('🎤 User started speaking');
      if (this.onSpeechStartCallback) {
        this.onSpeechStartCallback();
      }
    });

    // Speech ended (user stopped speaking)
    this.vapi.on('speech-end', () => {
      console.log('🎤 User stopped speaking');
      if (this.onSpeechEndCallback) {
        this.onSpeechEndCallback();
      }
    });

    // Message received (transcript, AI response, etc.)
    this.vapi.on('message', (message: any) => {
      console.log('💬 Vapi message:', message);
      this.handleMessage(message);
    });

    // Volume level (for visualizations)
    this.vapi.on('volume-level', (_volume: number) => {
      // Can be used for audio visualizations
      // console.log('🔊 Volume:', _volume);
    });

    // Errors
    this.vapi.on('error', (error: any) => {
      console.error('❌ Vapi error:', error);
      this.handleError(new Error(error.message || 'Vapi error occurred'));
      this.updateStatus('error');
    });
  }

  /**
   * Get available audio input devices
   */
  public async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      // Request permission first (required for device enumeration)
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      console.log('🎤 Available audio input devices:', audioInputs);
      return audioInputs;
    } catch (error) {
      console.error('❌ Failed to enumerate devices:', error);
      return [];
    }
  }

  /**
   * Start a voice conversation
   * @param deviceId Optional: Specific audio device ID to use
   */
  public async startConversation(deviceId?: string): Promise<void> {
    if (this.isActive) {
      console.warn('⚠️  Conversation already active');
      return;
    }

    try {
      this.updateStatus('connecting');
      console.log('🚀 Starting Vapi conversation...');
      
      // If deviceId is provided, request that specific device first
      // This ensures the browser uses the correct microphone
      if (deviceId) {
        console.log('🎤 Requesting specific device:', deviceId);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { exact: deviceId }
            }
          });
          // Stop the stream - Vapi will request its own
          stream.getTracks().forEach(track => track.stop());
          console.log('✅ Device selected successfully');
        } catch (error) {
          console.warn('⚠️  Could not use specified device, falling back to default:', error);
        }
      }

      await this.vapi.start(this.assistantId);

      console.log('✅ Vapi conversation started');
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      this.updateStatus('error');
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Stop the current conversation
   */
  public stopConversation(): void {
    if (!this.isActive) {
      console.warn('⚠️  No active conversation to stop');
      return;
    }

    try {
      this.vapi.stop();
      console.log('🛑 Stopping Vapi conversation');
    } catch (error) {
      console.error('❌ Error stopping conversation:', error);
      this.handleError(error as Error);
    }
  }

  /**
   * Send a text message (for testing or manual input)
   */
  public send(message: string): void {
    if (!this.isActive) {
      console.warn('⚠️  Cannot send message: no active conversation');
      return;
    }

    try {
      this.vapi.send({
        type: 'add-message',
        message: {
          role: 'user',
          content: message
        }
      });
      console.log('📤 Sent message:', message);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      this.handleError(error as Error);
    }
  }

  /**
   * Handle incoming messages from Vapi
   */
  private handleMessage(message: any) {
    let vapiMessage: VapiMessage | null = null;

    // Handle different message types from Vapi
    switch (message.type) {
      case 'transcript':
        // User's speech transcription
        vapiMessage = {
          type: 'transcript',
          content: message.transcript || message.transcriptPartial || '',
          timestamp: new Date(),
          metadata: {
            role: message.role || 'user',
            isFinal: message.transcript ? true : false
          }
        };
        break;

      case 'function-call':
        // AI is calling a function
        vapiMessage = {
          type: 'function-call',
          content: `Function called: ${message.functionCall?.name}`,
          timestamp: new Date(),
          metadata: message.functionCall
        };
        console.log('🔧 Function call:', message.functionCall);
        break;

      case 'function-result':
        // Result from function execution
        vapiMessage = {
          type: 'function-result',
          content: `Function result: ${message.functionCall?.name}`,
          timestamp: new Date(),
          metadata: message
        };
        break;

      case 'speech-update':
        // AI speech update
        vapiMessage = {
          type: 'speech-update',
          content: message.status || '',
          timestamp: new Date(),
          metadata: message
        };
        break;

      case 'status-update':
        // Status update
        vapiMessage = {
          type: 'status-update',
          content: message.status || '',
          timestamp: new Date(),
          metadata: message
        };
        break;

      default:
        console.log('❓ Unknown message type:', message.type, message);
        return;
    }

    if (vapiMessage) {
      this.messageHistory.push(vapiMessage);

      if (this.onMessageCallback) {
        this.onMessageCallback(vapiMessage);
      }
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error) {
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
   * Check if conversation is active
   */
  public isConversationActive(): boolean {
    return this.isActive;
  }

  /**
   * Get current status
   */
  public getStatus(): ConversationStatus {
    return this.currentStatus;
  }

  /**
   * Get message history
   */
  public getHistory(): VapiMessage[] {
    return [...this.messageHistory];
  }

  /**
   * Clear message history
   */
  public clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * Get recent messages
   */
  public getRecentMessages(count: number = 10): VapiMessage[] {
    return this.messageHistory.slice(-count);
  }

  /**
   * Mute/unmute the microphone
   */
  public setMuted(muted: boolean): void {
    if (!this.isActive) {
      console.warn('⚠️  No active conversation');
      return;
    }

    try {
      this.vapi.setMuted(muted);
      console.log(`🔇 Microphone ${muted ? 'muted' : 'unmuted'}`);
    } catch (error) {
      console.error('❌ Error toggling mute:', error);
    }
  }

  /**
   * Check if currently muted
   */
  public isMuted(): boolean {
    try {
      return this.vapi.isMuted();
    } catch {
      return false;
    }
  }

  /**
   * Clean up and destroy the service
   */
  public destroy(): void {
    if (this.isActive) {
      this.stopConversation();
    }
    this.messageHistory = [];
  }
}
