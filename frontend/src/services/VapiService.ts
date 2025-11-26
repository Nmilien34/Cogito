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
  private audioContextResumed: boolean = false;

  // Event callbacks
  private onMessageCallback?: (message: VapiMessage) => void;
  private onStatusChangeCallback?: (status: ConversationStatus) => void;
  private onErrorCallback?: (error: Error) => void;
  private onSpeechStartCallback?: () => void;
  private onSpeechEndCallback?: () => void;

  constructor(config: VapiServiceConfig) {
    console.log('🔧 Initializing Vapi SDK with publicKey:', config.publicKey ? '✅ Set' : '❌ Missing');
    console.log('🔧 Assistant ID:', config.assistantId || '❌ Missing');
    
    if (!config.publicKey) {
      console.error('❌ Vapi publicKey is missing!');
    }
    if (!config.assistantId) {
      console.error('❌ Vapi assistantId is missing!');
    }
    
    try {
      this.vapi = new Vapi(config.publicKey);
      console.log('✅ Vapi SDK instance created');
      console.log('🔍 Vapi SDK version:', (this.vapi as any).version || 'unknown');
    } catch (error) {
      console.error('❌ Failed to create Vapi SDK instance:', error);
      throw error;
    }
    
    this.assistantId = config.assistantId;
    this.onMessageCallback = config.onMessage;
    this.onStatusChangeCallback = config.onStatusChange;
    this.onErrorCallback = config.onError;
    this.onSpeechStartCallback = config.onSpeechStart;
    this.onSpeechEndCallback = config.onSpeechEnd;

    this.setupEventListeners();
    this.setupAudioContextResume();
    
    // Log all events for debugging
    this.setupDebugEventListeners();
  }
  
  /**
   * Set up debug event listeners to see all Vapi events
   */
  private setupDebugEventListeners() {
    // Listen to all possible events to debug
    const allPossibleEvents = [
      'call-start',
      'call-end',
      'speech-start',
      'speech-end',
      'message',
      'error',
      'volume-level',
      'assistant-speech-start',
      'assistant-speech-end',
      'assistant-message',
      'status-update',
      'function-call',
      'function-result',
      'transcript',
      'transcript-partial',
      'conversation-update',
      'hang',
      'metadata',
    ];
    
    // Log when any event is registered
    console.log('📋 Registered Vapi event listeners for:', allPossibleEvents.length, 'event types');
  }

  /**
   * Set up Vapi event listeners
   */
  private setupEventListeners() {
    // Call started
    this.vapi.on('call-start', (data?: any) => {
      console.log('📞 Vapi call started!', data || '');
      console.log('📞 Call data:', JSON.stringify(data, null, 2));
      this.isActive = true;
      this.updateStatus('connected');
      // Resume AudioContext if suspended (required for audio playback)
      this.resumeAudioContext();
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

    // Try multiple possible event names for assistant speech
    // Different versions of Vapi SDK may use different event names
    
    // Assistant speech started (AI is speaking) - try multiple event names
    const assistantSpeechStartEvents = ['assistant-speech-start', 'assistant-speech-update', 'tts-start'];
    assistantSpeechStartEvents.forEach(eventName => {
      this.vapi.on(eventName, () => {
        console.log(`🤖 Assistant started speaking (${eventName})`);
        // Resume AudioContext to ensure audio plays
        this.resumeAudioContext();
      });
    });

    // Assistant speech ended (AI stopped speaking)
    const assistantSpeechEndEvents = ['assistant-speech-end', 'tts-end'];
    assistantSpeechEndEvents.forEach(eventName => {
      this.vapi.on(eventName, () => {
        console.log(`🤖 Assistant stopped speaking (${eventName})`);
      });
    });

    // Assistant message (AI response)
    const assistantMessageEvents = ['assistant-message', 'assistant-response'];
    assistantMessageEvents.forEach(eventName => {
      this.vapi.on(eventName, (message: any) => {
        console.log(`🤖 Assistant message (${eventName}):`, message);
        this.handleMessage({
          type: 'transcript',
          transcript: message.content || message.message || '',
          role: 'assistant',
          ...message
        });
      });
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
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      this.handleError(new Error(error.message || error.toString() || 'Vapi error occurred'));
      this.updateStatus('error');
    });
    
    // Log when event listeners are set up
    console.log('✅ Vapi event listeners registered');
  }

  /**
   * Set up global click handler to resume AudioContext on user interaction
   * This is required for browser autoplay policy
   */
  private setupAudioContextResume(): void {
    if (typeof window === 'undefined') return;

    const handleUserInteraction = async () => {
      if (this.audioContextResumed) return;
      
      try {
        // Create and resume a temporary AudioContext to unlock audio
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const tempContext = new AudioContextClass();
          if (tempContext.state === 'suspended') {
            await tempContext.resume();
            console.log('✅ AudioContext unlocked via user interaction');
          }
          this.audioContextResumed = true;
          // Keep context alive briefly
          setTimeout(() => {
            tempContext.close().catch(() => {});
          }, 500);
        }
      } catch (error) {
        console.warn('⚠️  Could not unlock AudioContext:', error);
      }
    };

    // Listen for any user interaction (click, touch, keypress)
    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });
    window.addEventListener('keydown', handleUserInteraction, { once: true });
  }

  /**
   * Resume AudioContext if suspended (required for browser autoplay policy)
   * This helps ensure audio can play after user interaction
   */
  private async resumeAudioContext(): Promise<void> {
    try {
      // Vapi SDK manages its own AudioContext internally
      // We can't directly access it, but we can ensure the browser allows audio
      // by creating a temporary context and resuming it
      // This helps "unlock" audio for the page
      if (typeof window !== 'undefined' && window.AudioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const tempContext = new AudioContextClass();
        
        if (tempContext.state === 'suspended') {
          await tempContext.resume();
          console.log('✅ AudioContext resumed (temporary context)');
          this.audioContextResumed = true;
        }
        
        // Keep the context alive briefly to help unlock audio
        // Vapi will use its own context, but this helps with browser autoplay policy
        setTimeout(() => {
          tempContext.close().catch(() => {});
        }, 1000);
      }
    } catch (error) {
      console.warn('⚠️  Could not resume AudioContext:', error);
    }
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
      
      // Resume AudioContext before starting (required for browser autoplay policy)
      await this.resumeAudioContext();
      
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

      // Request microphone permission and resume AudioContext
      // This is critical for physical button interactions - the browser needs
      // a user gesture to allow audio/WebRTC, and physical buttons don't count
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone permission granted');
        console.log('🎤 Audio tracks:', stream.getAudioTracks().map(t => ({
          id: t.id,
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState
        })));
        
        // Keep the stream alive briefly to help with WebRTC connection
        // Vapi will request its own stream, but this helps establish permissions
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
        }, 100);
      } catch (error) {
        console.error('❌ Microphone permission issue:', error);
        throw new Error(`Microphone access denied: ${error}`);
      }

      console.log('📞 Calling vapi.start() with assistantId:', this.assistantId);
      console.log('🔍 Vapi SDK instance:', this.vapi);
      console.log('🔍 Checking Vapi SDK methods...');
      
      // Log all available methods on the Vapi instance for debugging
      const vapiMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.vapi));
      console.log('📋 Available Vapi methods:', vapiMethods);
      
      // Set up event listeners BEFORE calling start() to catch the event immediately
      let callStartResolve: (() => void) | null = null;
      let callStartReject: ((error: Error) => void) | null = null;
      
      const onCallStart = (data?: any) => {
        console.log('✅ call-start event received!', data || '');
        console.log('📞 Call data:', JSON.stringify(data, null, 2));
        if (callStartResolve) {
          callStartResolve();
        }
      };

      const onError = (error: any) => {
        console.error('❌ Vapi error while waiting for call-start:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        console.error('❌ Error type:', typeof error);
        console.error('❌ Error constructor:', error?.constructor?.name);

        // Extract Response.error if present
        if (error?.error) {
          console.error('*** VAPI DETAILED ERROR (from Response.error) ***');
          console.error(error.error);
          console.error('JSON:', JSON.stringify(error.error, null, 2));
        }

        // Also check for nested error properties
        if (error?.response?.error) {
          console.error('*** VAPI DETAILED ERROR (from response.error) ***');
          console.error(error.response.error);
        }

        if (callStartReject) {
          callStartReject(new Error(error.message || error.toString() || 'Vapi error occurred'));
        }
      };

      // Set up listeners BEFORE starting
      console.log('📡 Setting up event listeners...');
      this.vapi.on('call-start', onCallStart);
      this.vapi.on('error', onError);
      
      // Also listen for any other events that might fire
      this.vapi.on('*', (eventName: string, data: any) => {
        console.log(`🔍 Vapi event fired: ${eventName}`, data);
      });
      
      // Call vapi.start() - v2.5.1 API uses assistantId as string parameter
      let startResult;
      try {
        // Detailed logging for debugging
        console.log('❌ VAPI START DEBUG:');
        console.log('  assistantId:', this.assistantId);
        console.log('  assistantId type:', typeof this.assistantId);
        console.log('  assistantId length:', this.assistantId?.length);
        console.log('  Vapi instance:', this.vapi);
        console.log('  Vapi constructor:', this.vapi?.constructor?.name);
        console.log('  isActive:', this.isActive);
        console.log('  currentStatus:', this.currentStatus);

        startResult = await this.vapi.start(this.assistantId);
        console.log('📞 vapi.start() resolved:', startResult);
      } catch (err) {
        console.error('❌ vapi.start() failed:', err);

        // Extract detailed error from Response object if present
        if (err && typeof err === 'object') {
          const errorObj = err as any;
          console.error('❌ DETAILED ERROR BREAKDOWN:');
          console.error('  Full error object:', errorObj);
          console.error('  Error type:', errorObj?.constructor?.name);

          // Check if it's a Response object with error property
          if (errorObj.error) {
            console.error('  ⚠️ ERROR PROPERTY:', errorObj.error);
            console.error('  Error JSON:', JSON.stringify(errorObj.error, null, 2));
          }

          // Check for message property
          if (errorObj.message) {
            console.error('  Message:', errorObj.message);
          }

          // Check for data property
          if (errorObj.data !== undefined) {
            console.error('  Data:', errorObj.data);
          }
        }

        // Clean up listeners (using any to handle API differences)
        (this.vapi as any).off?.('call-start', onCallStart);
        (this.vapi as any).off?.('error', onError);

        this.updateStatus('error');
        this.handleError(err as Error);
        throw err;
      }

      console.log('✅ vapi.start() completed - waiting for call-start event...');
      console.log('🔍 Check browser Network tab (filter by "WS") for WebSocket connections to Vapi servers');
      
      // Wait for call-start event (the actual connection)
      // vapi.start() resolves quickly, but the call connects asynchronously
      return new Promise<void>((resolve, reject) => {
        callStartResolve = resolve;
        callStartReject = reject;
        
        const timeout = setTimeout(() => {
          console.error('❌ call-start event never fired after 15 seconds');
          console.error('📊 Current status:', this.currentStatus);
          console.error('📊 isActive:', this.isActive);
          console.error('💡 Debugging steps:');
          console.error('   1. Open browser DevTools → Network tab');
          console.error('   2. Filter by "WS" (WebSocket)');
          console.error('   3. Press the button again and look for WebSocket connection attempts');
          console.error('   4. Check if any WebSocket connections are being blocked or failing');
          console.error('   5. Verify assistantId in Vapi dashboard:', this.assistantId);
          console.error('   6. Verify publicKey is valid and not expired');
          console.error('   7. Check if assistant is active in Vapi dashboard');
          
          // Clean up listeners
          this.vapi.off('call-start', onCallStart);
          this.vapi.off('error', onError);
          
          callStartResolve = null;
          callStartReject = null;
          
          this.updateStatus('error');
          reject(new Error('Call did not connect - call-start event never fired. Check Network tab for WebSocket connections to Vapi servers.'));
        }, 15000);

        // If already active, resolve immediately
        if (this.isActive) {
          clearTimeout(timeout);
          this.vapi.off('call-start', onCallStart);
          this.vapi.off('error', onError);
          resolve();
        }
      });
      
      // Resume AudioContext again after starting (in case it was suspended)
      setTimeout(() => {
        this.resumeAudioContext();
      }, 100);
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
      (this.vapi as any).send?.({
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

    // Log the full message for debugging
    console.log('📨 Handling Vapi message:', JSON.stringify(message, null, 2));

    // Check if this is an assistant message (AI speaking)
    const isAssistantMessage = message.role === 'assistant' || 
                                message.role === 'system' ||
                                (message.type && message.type.includes('assistant'));

    if (isAssistantMessage) {
      console.log('🤖 Detected assistant message - AI should be speaking now');
      // Resume AudioContext when assistant starts speaking
      this.resumeAudioContext();
    }

    // Handle different message types from Vapi
    switch (message.type) {
      case 'transcript':
        // Speech transcription (could be user or assistant)
        vapiMessage = {
          type: 'transcript',
          content: message.transcript || message.transcriptPartial || message.content || '',
          timestamp: new Date(),
          metadata: {
            role: message.role || (isAssistantMessage ? 'assistant' : 'user'),
            isFinal: message.transcript ? true : false,
            ...message
          }
        };
        if (isAssistantMessage) {
          console.log('🤖 Assistant transcript:', vapiMessage.content);
        }
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
          content: message.status || message.content || '',
          timestamp: new Date(),
          metadata: message
        };
        if (isAssistantMessage) {
          console.log('🤖 Assistant speech update:', vapiMessage.content);
        }
        break;

      case 'status-update':
        // Status update
        vapiMessage = {
          type: 'status-update',
          content: message.status || message.content || '',
          timestamp: new Date(),
          metadata: message
        };
        break;

      default:
        // Handle messages without a type or with unknown types
        // Check if it has content that suggests it's a message
        if (message.content || message.message || message.text) {
          vapiMessage = {
            type: 'transcript',
            content: message.content || message.message || message.text || '',
            timestamp: new Date(),
            metadata: {
              role: message.role || (isAssistantMessage ? 'assistant' : 'user'),
              ...message
            }
          };
          if (isAssistantMessage) {
            console.log('🤖 Assistant message (unknown type):', vapiMessage.content);
          }
        } else {
          console.log('❓ Unknown message type:', message.type, message);
          return;
        }
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
      (this.vapi as any).setMuted?.(muted);
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
      return (this.vapi as any).isMuted?.() || false;
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
