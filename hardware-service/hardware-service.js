
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

// State management
let currentMode = 'radio';  // 'radio' or 'ai'
let lastSpeechTime = Date.now();

console.log('Cogito Hardware Service Starting...');

// Set mode endpoint
app.post('/api/mode/set', (req, res) => {
  const { mode } = req.body;

  if (!mode || (mode !== 'radio' && mode !== 'ai')) {
    return res.status(400).json({ error: 'Invalid mode. Use "radio" or "ai"' });
  }

  if (mode === 'ai' && currentMode === 'radio') {
    // Enter AI mode
    currentMode = 'ai';
    lastSpeechTime = Date.now();
    console.log('🎤 AI MODE - Listening');

    // Stop radio
    exec('python3 python/radio-control.py stop', (error) => {
      if (error) console.error('Radio stop error:', error);
    });

    // Notify WebSocket clients about mode change
    const clientCount = io.sockets.sockets.size;
    console.log(`📡 Emitting to ${clientCount} connected client(s)`);
    
    io.emit('mode-changed', { mode: 'ai', timestamp: lastSpeechTime });
    console.log('📤 Emitted: mode-changed (ai)');

    // Tell frontend to START Vapi conversation
    io.emit('start-voice', { timestamp: lastSpeechTime });
    console.log('📤 Emitted: start-voice to frontend');
    
    if (clientCount === 0) {
      console.warn('⚠️  WARNING: No clients connected! Frontend may not be running.');
    }

    res.json({ mode: 'ai', message: 'AI mode activated' });

  } else if (mode === 'radio' && currentMode === 'ai') {
    // Return to radio mode
    currentMode = 'radio';
    console.log('📻 RADIO MODE - Resuming playback');

    // Tell frontend to STOP Vapi conversation
    const clientCount = io.sockets.sockets.size;
    console.log(`📡 Emitting to ${clientCount} connected client(s)`);
    
    io.emit('stop-voice', { timestamp: Date.now() });
    console.log('📤 Emitted: stop-voice to frontend');

    // Resume radio
    exec('python3 python/radio-control.py resume', (error) => {
      if (error) console.error('Radio resume error:', error);
    });

    // Notify WebSocket clients about mode change
    io.emit('mode-changed', { mode: 'radio' });

    res.json({ mode: 'radio', message: 'Radio mode activated' });

  } else {
    res.json({ mode: currentMode, message: 'Already in that mode' });
  }
});

// Get current mode
app.get('/api/mode/current', (req, res) => {
  const timeSinceLastSpeech = currentMode === 'ai' 
    ? (Date.now() - lastSpeechTime) / 1000 
    : null;
    
  res.json({ 
    mode: currentMode,
    secondsSinceLastSpeech: timeSinceLastSpeech
  });
});

// Report speech activity (called by Vapi or voice detection)
app.post('/api/ai/activity', (req, res) => {
  if (currentMode === 'ai') {
    lastSpeechTime = Date.now();
    console.log('Speech activity detected');
    io.emit('speech-activity', { timestamp: lastSpeechTime });
  }
  res.json({ received: true, mode: currentMode });
});

// Check for recent activity (for timeout logic)
app.get('/api/ai/activity', (req, res) => {
  const timeSinceLastSpeech = Date.now() - lastSpeechTime;
  const isActive = timeSinceLastSpeech < 2000; // Active if speech within 2s
  
  res.json({
    speech_detected: isActive,
    seconds_since_speech: timeSinceLastSpeech / 1000,
    mode: currentMode
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: currentMode });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  console.log('📡 Total clients:', io.sockets.sockets.size);
  
  // Send current mode to new client
  socket.emit('mode-changed', { mode: currentMode });
  console.log('📤 Sent initial mode to client:', currentMode);
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    console.log('📡 Remaining clients:', io.sockets.sockets.size);
  });
  
  // Log any events received from client
  socket.onAny((event, ...args) => {
    console.log('📨 Received from client:', event, args);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Hardware service running on port ${PORT}`);
  console.log(`Current mode: ${currentMode}`);
});


