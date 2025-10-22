/**
 * FM Radio Voice AI Screen
 *
 * This is the main (and only) screen for the FM Radio device.
 * It provides a minimal interface for voice AI interaction.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useConversation } from '@11labs/react';
import { VoiceRadioService, VoiceMessage, ConversationStatus } from '../src/services/VoiceRadioService';
import { deviceAuthService } from '../src/services/DeviceAuthService';

// Agent ID from 11Labs (this should match your voice AI agent)
const VOICE_AGENT_ID = 'n3MbanaRoXM0G18j3JS5';

export default function RadioScreen() {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize voice service
  const [voiceService] = useState(() =>
    new VoiceRadioService({
      agentId: VOICE_AGENT_ID,
      onMessage: (message) => {
        setMessages(prev => [...prev, message]);
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
      onError: (error) => {
        console.error('Voice error:', error);
      },
      onToolCall: (toolCall) => {
        console.log('Tool called:', toolCall);
      }
    })
  );

  // Initialize conversation hook from 11Labs
  const conversationHook = useConversation({
    onMessage: voiceService.handleMessage,
    onStateUpdate: voiceService.handleStateUpdate,
    onError: (error) => console.error('Conversation error:', error)
  });

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

  // Initialize voice service with conversation hook
  useEffect(() => {
    if (conversationHook) {
      voiceService.initializeConversationHook(conversationHook);
    }
  }, [conversationHook, voiceService]);

  // Start voice conversation
  const handleStart = useCallback(async () => {
    try {
      await voiceService.startConversation();
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [voiceService]);

  // Stop voice conversation
  const handleStop = useCallback(async () => {
    try {
      await voiceService.stopConversation();
    } catch (error) {
      console.error('Failed to stop conversation:', error);
    }
  }, [voiceService]);

  // Clear message history
  const handleClear = useCallback(() => {
    voiceService.clearHistory();
    setMessages([]);
  }, [voiceService]);

  // Status indicator color
  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#4ade80';
      case 'connecting': return '#fbbf24';
      case 'error': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cogito Voice Radio</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{status}</Text>
        </View>
        <Text style={styles.deviceId}>Device: {deviceId.substring(0, 8)}</Text>
      </View>

      {/* Message Display */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>No messages yet. Start a conversation!</Text>
        ) : (
          messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.message,
                msg.type === 'transcript' ? styles.userMessage : styles.aiMessage
              ]}
            >
              <Text style={styles.messageType}>{msg.type.toUpperCase()}</Text>
              <Text style={styles.messageContent}>{msg.content}</Text>
              <Text style={styles.messageTime}>
                {msg.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        {status === 'idle' || status === 'disconnected' ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStart}
            disabled={!isAuthenticated}
          >
            <Text style={styles.buttonText}>🎤 Start Voice</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStop}
          >
            <Text style={styles.buttonText}>⏹️ Stop Voice</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClear}
        >
          <Text style={styles.buttonText}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          FM Radio Voice AI • For Alzheimer's & Senior Care
        </Text>
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
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
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
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
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
});
