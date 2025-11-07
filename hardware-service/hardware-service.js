/**
 * Hardware Service - Node.js Coordinator
 * 
 * Coordinates communication between:
 * - Python GUI (display)
 * - Chromium Browser (headless, audio)
 * - GPIO buttons
 * - FM Radio control
 */

const express = require('express');
const WebSocket = require('ws');
const { Gpio } = require('onoff');

const app = express();
const wss = new WebSocket.Server({ port: 8080 });

// Track connected clients
const clients = {
  browser: null,   // Headless Chromium
  display: null    // Python GUI
};

// GPIO button (voice button)
const VOICE_BUTTON_PIN = 17;
let voiceButton = null;

// FM Radio control
const radio = {
  currentVolume: 100,
  savedVolume: 100,
  
  duck() {
    this.savedVolume = this.currentVolume;
    this.currentVolume = 20;
    console.log('📻 Radio ducked to 20%');
    // TODO: Send I2C command to FM radio module
    // i2c.write(radioAddress, [VOLUME_CMD, 20]);
  },
  
  mute() {
    this.currentVolume = 0;
    console.log('📻 Radio muted');
    // TODO: Send I2C command to FM radio module
    // i2c.write(radioAddress, [VOLUME_CMD, 0]);
  },
  
  restore() {
    this.currentVolume = this.savedVolume || 100;
    console.log(`📻 Radio restored to ${this.currentVolume}%`);
    // TODO: Send I2C command to FM radio module
    // i2c.write(radioAddress, [VOLUME_CMD, this.currentVolume]);
  }
};

// WebSocket server
wss.on('connection', (ws, req) => {
  // Identify client type from query param
  const url = new URL(req.url, `ws://${req.headers.host}`);
  const clientType = url.searchParams.get('client') || 'unknown';
  
  console.log(`✅ ${clientType} connected`);
  clients[clientType] = ws;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(clientType, data);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`❌ ${clientType} disconnected`);
    clients[clientType] = null;
  });
  
  ws.on('error', (error) => {
    console.error(`❌ ${clientType} error:`, error);
  });
});

/**
 * Handle messages from clients
 */
function handleClientMessage(source, data) {
  console.log(`📨 Message from ${source}:`, data.type);
  
  switch(data.type) {
    case 'VOICE_STARTED':
      // Browser told us voice started
      sendToDisplay({ type: 'VOICE_STARTED', timestamp: Date.now() });
      radio.duck();
      break;
      
    case 'VOICE_STOPPED':
      // Browser told us voice ended
      sendToDisplay({ type: 'VOICE_STOPPED', timestamp: Date.now() });
      radio.restore();
      break;
      
    case 'USER_SPEAKING':
      // User is speaking
      sendToDisplay({ type: 'USER_SPEAKING' });
      radio.mute();
      break;
      
    case 'USER_STOPPED_SPEAKING':
      // User stopped speaking
      sendToDisplay({ type: 'USER_STOPPED_SPEAKING' });
      radio.duck(); // Keep ducked while waiting for AI
      break;
      
    case 'AI_SPEAKING':
      // AI is responding
      sendToDisplay({ type: 'AI_SPEAKING' });
      radio.duck(); // Keep ducked during AI response
      break;
      
    case 'NEW_MESSAGE':
      // Caregiver message arrived
      sendToDisplay({
        type: 'NEW_MESSAGE',
        message: data.message
      });
      break;
      
    case 'REMINDER':
      // Reminder triggered
      sendToDisplay({
        type: 'REMINDER',
        reminder: data.reminder
      });
      break;
      
    case 'ERROR':
      // Error occurred
      sendToDisplay({
        type: 'ERROR',
        error: data.error
      });
      break;
      
    default:
      console.log(`Unknown message type: ${data.type}`);
  }
}

/**
 * Send message to Python GUI display
 */
function sendToDisplay(data) {
  if (clients.display && clients.display.readyState === WebSocket.OPEN) {
    clients.display.send(JSON.stringify(data));
    console.log(`📤 Sent to display: ${data.type}`);
  } else {
    console.warn('⚠️ Display not connected');
  }
}

/**
 * Send message to browser
 */
function sendToBrowser(data) {
  if (clients.browser && clients.browser.readyState === WebSocket.OPEN) {
    clients.browser.send(JSON.stringify(data));
    console.log(`📤 Sent to browser: ${data.type}`);
  } else {
    console.warn('⚠️ Browser not connected');
  }
}

/**
 * Initialize GPIO buttons
 */
function initializeGPIO() {
  try {
    voiceButton = new Gpio(VOICE_BUTTON_PIN, 'in', 'falling', { debounceTimeout: 10 });
    
    voiceButton.watch((err, value) => {
      if (err) {
        console.error('GPIO error:', err);
        return;
      }
      
      console.log('🔘 Voice button pressed!');
      
      // Tell browser to start Vapi
      sendToBrowser({ type: 'START_VOICE' });
      
      // Tell display we're starting
      sendToDisplay({ 
        type: 'VOICE_STARTING',
        timestamp: Date.now() 
      });
      
      // Duck the radio immediately
      radio.duck();
    });
    
    console.log('✅ GPIO initialized (pin 17)');
  } catch (error) {
    console.error('❌ GPIO initialization failed:', error);
    console.log('⚠️ Running without GPIO (for testing)');
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: {
      browser: clients.browser ? 'connected' : 'disconnected',
      display: clients.display ? 'connected' : 'disconnected'
    },
    radio: {
      volume: radio.currentVolume
    }
  });
});

/**
 * Start server
 */
const PORT = 3001;
app.listen(PORT, () => {
  console.log('🚀 Hardware Service started');
  console.log(`📡 WebSocket server: ws://localhost:8080`);
  console.log(`🌐 HTTP server: http://localhost:${PORT}`);
  console.log('');
  
  // Initialize GPIO
  initializeGPIO();
  
  console.log('✅ Ready to coordinate hardware!');
  console.log('');
  console.log('Waiting for clients:');
  console.log('  - Python GUI: ws://localhost:8080?client=display');
  console.log('  - Browser: ws://localhost:8080?client=browser');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  
  if (voiceButton) {
    voiceButton.unexport();
  }
  
  wss.close(() => {
    process.exit(0);
  });
});

