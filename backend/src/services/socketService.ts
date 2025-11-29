import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { Conversation } from '../models/Conversation';
import { config } from '../config/env';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface VoiceSessionData {
  voiceModel?: string;
  streamingMode?: boolean;
}

interface AudioData {
  voiceConversationId: string;
  audio: string;
}

// In-memory store for active voice sessions
const activeSessions = new Map<string, {
  conversationId: string;
  userId: string;
  voiceModel?: string;
  streamingMode: boolean;
  startedAt: Date;
}>();

export class SocketService {
  private io: Server;

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigin,
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.initialize();
  }

  private initialize() {
    console.log('🔧 Initializing Socket.io service...');
    console.log('📡 CORS origins:', config.corsOrigin);
    console.log('🚀 Transports enabled: websocket, polling');

    // Authentication middleware (optional for now - allows unauthenticated connections)
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        console.log('🔍 New connection attempt from:', socket.handshake.address);
        console.log('🔍 Connection headers:', socket.handshake.headers);

        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          console.log('⚠️  No auth token provided - allowing unauthenticated connection for development');
          return next(); // Allow connection without auth for now
        }

        const decoded = verifyAccessToken(token);

        const user = await User.findById(decoded.userId);

        if (!user) {
          console.log('❌ User not found for token');
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.userEmail = user.email;
        console.log('✅ Authenticated user:', socket.userEmail);

        next();
      } catch (error) {
        console.error('❌ Auth error:', error);
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`✅ Client connected: ${socket.id} (User: ${socket.userEmail})`);

      // Handle voice session start
      socket.on('startVoiceSession', async (data: VoiceSessionData) => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
          }

          // Create a new voice conversation
          const conversation = await Conversation.create({
            userId: socket.userId,
            title: 'Voice Conversation',
            messages: [],
            voiceModel: data.voiceModel || 'default',
            isVoiceConversation: true,
            active: true
          });

          // Store session
          const sessionId = socket.id;
          activeSessions.set(sessionId, {
            conversationId: conversation._id.toString(),
            userId: socket.userId,
            voiceModel: data.voiceModel,
            streamingMode: data.streamingMode || false,
            startedAt: new Date()
          });

          socket.emit('VOICE_SESSION_STARTED', {
            voiceConversationId: conversation._id.toString(),
            sessionId
          });

          console.log(`🎤 Voice session started: ${conversation._id} (User: ${socket.userEmail})`);
        } catch (error) {
          console.error('Start voice session error:', error);
          socket.emit('error', { message: 'Failed to start voice session' });
        }
      });

      // Handle audio data
      socket.on('sendAudio', async (data: AudioData) => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
          }

          const session = activeSessions.get(socket.id);

          if (!session) {
            socket.emit('error', { message: 'No active voice session' });
            return;
          }

          // TODO: Process audio data with AI voice service (e.g., 11Labs)
          // For now, just acknowledge receipt
          console.log(`🎵 Audio received from user ${socket.userEmail} (${data.audio.length} bytes)`);

          // Mock response
          socket.emit('event', {
            type: 'audio_received',
            conversationId: session.conversationId,
            timestamp: new Date()
          });

          // TODO: Send AI response audio back
          // socket.emit('audioResponse', { audio: processedAudioData });
        } catch (error) {
          console.error('Send audio error:', error);
          socket.emit('error', { message: 'Failed to process audio' });
        }
      });

      // Handle voice session stop
      socket.on('stopVoiceSession', async (sessionId: string) => {
        try {
          const session = activeSessions.get(sessionId || socket.id);

          if (session) {
            // Update conversation as inactive if needed
            await Conversation.findByIdAndUpdate(session.conversationId, {
              active: false
            });

            activeSessions.delete(sessionId || socket.id);

            socket.emit('VOICE_SESSION_STOPPED', {
              conversationId: session.conversationId
            });

            console.log(`🛑 Voice session stopped: ${session.conversationId}`);
          }
        } catch (error) {
          console.error('Stop voice session error:', error);
          socket.emit('error', { message: 'Failed to stop voice session' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);

        // Clean up any active sessions
        const session = activeSessions.get(socket.id);
        if (session) {
          activeSessions.delete(socket.id);
          console.log(`🧹 Cleaned up session: ${session.conversationId}`);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });

    console.log('✅ Socket.io server initialized');
  }

  getIO(): Server {
    return this.io;
  }

  /**
   * Broadcast radio frequency change to all connected clients
   */
  broadcastRadioChange(frequency: number) {
    this.io.emit('radio:frequency-changed', {
      frequency,
      timestamp: new Date()
    });
    console.log(`📻 Broadcast: Radio frequency changed to ${frequency} MHz`);
  }

  /**
   * Broadcast radio state change (on/off) to all connected clients
   */
  broadcastRadioState(isOn: boolean) {
    this.io.emit('radio:state-changed', {
      isOn,
      timestamp: new Date()
    });
    console.log(`📻 Broadcast: Radio ${isOn ? 'ON' : 'OFF'}`);
  }
}

// Export singleton instance
let socketServiceInstance: SocketService | null = null;

export function getSocketService(): SocketService | null {
  return socketServiceInstance;
}

export function setSocketService(instance: SocketService) {
  socketServiceInstance = instance;
}
