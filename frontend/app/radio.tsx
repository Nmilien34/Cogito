/**
 * FM Radio Voice AI Screen
 *
 * Main screen for the FM Radio device using Vapi for voice AI.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { VapiService, VapiMessage, ConversationStatus } from '../src/services/VapiService';
import { deviceAuthService } from '../src/services/DeviceAuthService';
import Constants from 'expo-constants';

// Get Vapi config from environment
const VAPI_PUBLIC_KEY = Constants.expoConfig?.extra?.vapiPublicKey || process.env.EXPO_PUBLIC_VAPI_PUBLIC_KEY || '';
const VAPI_ASSISTANT_ID = Constants.expoConfig?.extra?.vapiAssistantId || process.env.EXPO_PUBLIC_VAPI_ASSISTANT_ID || '';

export default function RadioScreen() {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [messages, setMessages] = useState<VapiMessage[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [vapiService, setVapiService] = useState<VapiService | null>(null);

  // Initialize device authentication on mount
  useEffect(() => {
    const initializeDevice = async () => {
      try {
        await deviceAuthService.initialize();
        const token = await deviceAuthService.authenticateDevice();

        setDeviceId(deviceAuthService.getDeviceId() || 'unknown');
        setIsAuthenticated(true);

        console.log('✅ Device initialized and authenticated');
      } catch (error) {
        console.error('❌ Device initialization failed:', error);
      }
    };

    initializeDevice();
  }, []);

  // Initialize Vapi service when authenticated
  useEffect(() => {
    if (isAuthenticated && !vapiService) {
      console.log('🎤 Initializing Vapi service...');
      console.log('Public Key:', VAPI_PUBLIC_KEY ? 'Set' : 'Missing');
      console.log('Assistant ID:', VAPI_ASSISTANT_ID ? 'Set' : 'Missing');

      if (!VAPI_PUBLIC_KEY || !VAPI_ASSISTANT_ID) {
        console.error('❌ Vapi credentials not configured!');
        console.error('Please set EXPO_PUBLIC_VAPI_PUBLIC_KEY and EXPO_PUBLIC_VAPI_ASSISTANT_ID in .env');
        return;
      }

      const service = new VapiService({
        publicKey: VAPI_PUBLIC_KEY,
        assistantId: VAPI_ASSISTANT_ID,
        onMessage: (message) => {
          console.log('📩 Message received:', message);
          setMessages(prev => [...prev, message]);
        },
        onStatusChange: (newStatus) => {
          console.log('📊 Status changed:', newStatus);
          setStatus(newStatus);
        },
        onError: (error) => {
          console.error('❌ Vapi error:', error);
        },
        onSpeechStart: () => {
          console.log('🎤 User started speaking');
          setIsSpeaking(true);
        },
        onSpeechEnd: () => {
          console.log('🎤 User stopped speaking');
          setIsSpeaking(false);
        }
      });

      setVapiService(service);

      return () => {
        service.destroy();
      };
    }
  }, [isAuthenticated]);

  // Start voice conversation
  const handleStart = useCallback(async () => {
    if (!vapiService) {
      console.error('❌ Vapi service not initialized');
      return;
    }

    try {
      await vapiService.startConversation();
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
    }
  }, [vapiService]);

  // Stop voice conversation
  const handleStop = useCallback(() => {
    if (!vapiService) {
      console.error('❌ Vapi service not initialized');
      return;
    }

    try {
      vapiService.stopConversation();
    } catch (error) {
      console.error('❌ Failed to stop conversation:', error);
    }
  }, [vapiService]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    if (!vapiService) {
      return;
    }

    const newMutedState = !isMuted;
    vapiService.setMuted(newMutedState);
    setIsMuted(newMutedState);
  }, [vapiService, isMuted]);

  // Clear message history
  const handleClear = useCallback(() => {
    if (vapiService) {
      vapiService.clearHistory();
    }
    setMessages([]);
  }, [vapiService]);

  // Status indicator color
  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#4ade80';
      case 'connecting': return '#fbbf24';
      case 'error': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  // Format message for display
  const formatMessage = (msg: VapiMessage) => {
    switch (msg.type) {
      case 'transcript':
        return msg.metadata?.role === 'user'
          ? `You: ${msg.content}`
          : `AI: ${msg.content}`;
      case 'function-call':
        return `🔧 ${msg.content}`;
      case 'function-result':
        return `📦 ${msg.content}`;
      default:
        return msg.content;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cogito Voice Radio</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>
            {status}
            {isSpeaking && ' • Speaking'}
            {isMuted && ' • Muted'}
          </Text>
        </View>
        <Text style={styles.deviceId}>Device: {deviceId.substring(0, 8)}</Text>
      </View>

      {/* Message Display */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet.</Text>
            <Text style={styles.emptySubtext}>Start a conversation to begin!</Text>
          </View>
        ) : (
          messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.message,
                msg.metadata?.role === 'user' ? styles.userMessage : styles.aiMessage
              ]}
            >
              <Text style={styles.messageType}>{msg.type.toUpperCase()}</Text>
              <Text style={styles.messageContent}>{formatMessage(msg)}</Text>
              <Text style={styles.messageTime}>
                {msg.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          {status === 'idle' || status === 'disconnected' ? (
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={handleStart}
              disabled={!isAuthenticated || !vapiService}
            >
              <Text style={styles.buttonText}>🎤 Start Voice</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.muteButton]}
                onPress={handleToggleMute}
              >
                <Text style={styles.buttonText}>
                  {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.stopButton]}
                onPress={handleStop}
              >
                <Text style={styles.buttonText}>⏹️ Stop</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClear}
        >
          <Text style={styles.buttonText}>🗑️ Clear History</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by Vapi • For Alzheimer's & Senior Care
        </Text>
        {(!VAPI_PUBLIC_KEY || !VAPI_ASSISTANT_ID) && (
          <Text style={styles.warningText}>
            ⚠️ Vapi not configured - check .env file
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#cbd5e1',
    textTransform: 'capitalize',
  },
  deviceId: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  message: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#1e40af',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  aiMessage: {
    backgroundColor: '#334155',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageType: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    color: '#f1f5f9',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#64748b',
  },
  controls: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  muteButton: {
    backgroundColor: '#f59e0b',
  },
  clearButton: {
    backgroundColor: '#64748b',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    padding: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
  },
  warningText: {
    fontSize: 10,
    color: '#ef4444',
    marginTop: 4,
  },
});
