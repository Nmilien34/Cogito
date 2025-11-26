
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

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// State management
let currentMode = 'radio';  // 'radio' or 'ai'
let lastSpeechTime = Date.now();
let vapiConnected = false;  // Track if Vapi call has connected

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
    vapiConnected = false;  // Reset connection flag
    console.log('🎤 AI MODE - Listening (waiting for Vapi connection...)');

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

// Notify that Vapi has connected (called by frontend when call-start fires)
app.post('/api/ai/connected', (req, res) => {
  if (currentMode === 'ai') {
    vapiConnected = true;
    lastSpeechTime = Date.now();  // Reset timer when connected
    console.log('✅ Vapi call connected - starting activity timer');
    io.emit('vapi-connected', { timestamp: Date.now() });
  }
  res.json({ received: true, vapiConnected });
});

// Check for recent activity (for timeout logic)
app.get('/api/ai/activity', (req, res) => {
  const timeSinceLastSpeech = Date.now() - lastSpeechTime;
  const isActive = timeSinceLastSpeech < 2000; // Active if speech within 2s
  
  res.json({
    speech_detected: isActive,
    seconds_since_speech: vapiConnected ? timeSinceLastSpeech / 1000 : 0,  // Don't count timeout until connected
    vapi_connected: vapiConnected,
    mode: currentMode
  });
});

// ========== FM RADIO CONTROL ENDPOINTS ==========

// Set specific frequency
app.post('/api/radio/frequency', (req, res) => {
  const { frequency } = req.body;

  if (!frequency || frequency < 87.5 || frequency > 108.0) {
    return res.status(400).json({ error: 'Invalid frequency. Must be between 87.5 and 108.0 MHz' });
  }

  console.log(`📻 Setting frequency to ${frequency} MHz`);

  exec(`python3 python/radio-control.py set ${frequency}`, (error, stdout, stderr) => {
    if (error) {
      console.error('Radio frequency error:', error);
      return res.status(500).json({ error: 'Failed to set frequency', details: stderr });
    }

    console.log(stdout);

    // Notify WebSocket clients
    io.emit('radio-state-update', { frequency });

    res.json({ frequency, message: 'Frequency set successfully' });
  });
});

// Tune up
app.post('/api/radio/tune/up', (req, res) => {
  console.log('📻 Tuning up');

  exec('python3 python/radio-control.py up', (error, stdout, stderr) => {
    if (error) {
      console.error('Radio tune up error:', error);
      return res.status(500).json({ error: 'Failed to tune up', details: stderr });
    }

    console.log('Tune up output:', stdout);

    // Parse frequency from output - look for pattern like "99.5 MHz"
    const match = stdout.match(/(\d+\.\d+)\s*MHz/);
    const frequency = match ? parseFloat(match[1]) : null;

    if (frequency) {
      console.log(`✅ Tuned up to ${frequency} MHz`);
      io.emit('radio-state-update', { frequency });
      res.json({ message: 'Tuned up', frequency });
    } else {
      console.warn('⚠️  Could not parse frequency from output');
      res.json({ message: 'Tuned up', frequency: null });
    }
  });
});

// Tune down
app.post('/api/radio/tune/down', (req, res) => {
  console.log('📻 Tuning down');

  exec('python3 python/radio-control.py down', (error, stdout, stderr) => {
    if (error) {
      console.error('Radio tune down error:', error);
      return res.status(500).json({ error: 'Failed to tune down', details: stderr });
    }

    console.log('Tune down output:', stdout);

    // Parse frequency from output - look for pattern like "99.5 MHz"
    const match = stdout.match(/(\d+\.\d+)\s*MHz/);
    const frequency = match ? parseFloat(match[1]) : null;

    if (frequency) {
      console.log(`✅ Tuned down to ${frequency} MHz`);
      io.emit('radio-state-update', { frequency });
      res.json({ message: 'Tuned down', frequency });
    } else {
      console.warn('⚠️  Could not parse frequency from output');
      res.json({ message: 'Tuned down', frequency: null });
    }
  });
});

// Set volume (placeholder - actual volume control depends on hardware)
app.post('/api/radio/volume', (req, res) => {
  const { volume } = req.body;

  if (volume === undefined || volume < 0 || volume > 100) {
    return res.status(400).json({ error: 'Invalid volume. Must be between 0 and 100' });
  }

  console.log(`📻 Setting volume to ${volume}%`);

  // Note: TEA5767 doesn't have built-in volume control
  // Volume is typically controlled via system audio or external amplifier
  // This endpoint is for frontend state management

  io.emit('radio-state-update', { volume });

  res.json({ volume, message: 'Volume set (software state only)' });
});

// Get radio status
app.get('/api/radio/status', (req, res) => {
  console.log('📻 Getting radio status');

  exec('python3 python/radio-control.py status', (error, stdout, stderr) => {
    if (error) {
      console.error('Radio status error:', error);
      // Return default state if hardware is unavailable
      const fallbackStatus = {
        frequency: 99.1,
        signalStrength: 0,
        isStereo: false,
        isPlaying: currentMode === 'radio',
        volume: 50,
        error: 'Could not read hardware status'
      };
      return res.json(fallbackStatus);
    }

    console.log('Radio status output:', stdout);

    // Parse status from output
    const freqMatch = stdout.match(/Frequency:\s*(\d+\.\d+)\s*MHz/);
    const signalMatch = stdout.match(/Signal Level:\s*(\d+)/);
    const stereoMatch = stdout.match(/Stereo:\s*(Yes|No)/);

    const frequency = freqMatch ? parseFloat(freqMatch[1]) : 99.1;
    const signalStrength = signalMatch ? parseInt(signalMatch[1]) : 0;
    const isStereo = stereoMatch ? stereoMatch[1] === 'Yes' : false;

    const status = {
      frequency,
      signalStrength,
      isStereo,
      isPlaying: currentMode === 'radio',
      volume: 50, // Software volume state
    };

    console.log('📊 Parsed status:', status);
    res.json(status);
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


