/**
 * Cogito Hardware Service
 * - Express HTTP API (port 3001)
 * - WebSocket server (port 8080)
 * - GPIO via pigpio (LEDs on 17,27; buttons on 22,23)
 * - Radio control via Python script (python/radio-control.py)
 */

const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const wss = new WebSocket.Server({ port: 8080 });

// Detect if we are on a real Pi
const IS_HARDWARE = fs.existsSync('/proc/device-tree/model');

// ------------------------------
// Python bridge (radio control)
// ------------------------------
const PY = fs.existsSync(path.join(__dirname, 'venv/bin/python'))
  ? path.join(__dirname, 'venv/bin/python')
  : 'python3';

function radioControl(actionOrFreq) {
  let args;
  if (['up', 'down', 'stop'].includes(actionOrFreq)) {
    args = [path.join(__dirname, 'python', 'radio-control.py'), actionOrFreq];
  } else if (actionOrFreq === 'restore') {
    args = [path.join(__dirname, 'python', 'radio-control.py'), 'up'];
  } else {
    args = [path.join(__dirname, 'python', 'radio-control.py'), 'set', String(actionOrFreq)];
  }

  const p = spawn(PY, args);
  p.stdout.on('data', d => console.log('Radio:', d.toString().trim()));
  p.stderr.on('data', d => console.error('Radio error:', d.toString().trim()));
}

// ------------------------------
// WebSocket client registry
// ------------------------------
const clients = { browser: null, display: null };

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams((req.url.split('?')[1] || ''));
  const clientType = params.get('client') || 'unknown';
  console.log(clientType + ' connected');

  clients[clientType] = ws;
  ws.send(JSON.stringify({ type: 'CONNECTED', hardware: IS_HARDWARE }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(String(msg));
      console.log('Message from ' + clientType + ':', data.type || 'unknown');
      // Add any cross-client forwarding here if needed
    } catch (e) {
      console.warn('Invalid WS message');
    }
  });

  ws.on('close', () => {
    console.log(clientType + ' disconnected');
    clients[clientType] = null;
  });
});

function sendToDisplay(payload) {
  const ws = clients.display;
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload));
}
function sendToBrowser(payload) {
  const ws = clients.browser;
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload));
}

// ------------------------------
// GPIO via pigpio (recommended)
// ------------------------------
let Gpio = null;
let playButton = null, nextButton = null, powerLed = null, reminderLed = null;

const GPIO_ENABLED = (() => {
  try {
    if (!IS_HARDWARE) return false;
    Gpio = require('pigpio').Gpio;
    return true;
  } catch (e) {
    console.log('pigpio not available:', e.message);
    return false;
  }
})();

if (GPIO_ENABLED) {
  try {
    // LEDs: 17 (power), 27 (reminder)
    powerLed = new Gpio(17, { mode: Gpio.OUTPUT });
    reminderLed = new Gpio(27, { mode: Gpio.OUTPUT });
    powerLed.digitalWrite(1); // power LED on

    // Buttons: 22 (play), 23 (next), with pull-ups. We will poll for falling edge.
    playButton = new Gpio(22, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP });
    nextButton = new Gpio(23, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP });

    console.log('GPIO (pigpio) initialized');
  } catch (e) {
    console.error('GPIO (pigpio) init error:', e.message);
  }
} else {
  console.log('Running without GPIO (mock mode or pigpio missing)');
}

// Simple polling for button press (active-low)
function pollButton(gpio, onPress, name) {
  if (!gpio) return;
  let last = 1;
  setInterval(() => {
    let v;
    try {
      v = gpio.digitalRead();
    } catch {
      return;
    }
    if (last === 1 && v === 0) {
      console.log((name || 'button') + ' pressed');
      try { onPress(); } catch {}
    }
    last = v;
  }, 40);
}

// Button behaviors
pollButton(nextButton, () => {
  radioControl('up');
  if (reminderLed) {
    const cur = reminderLed.digitalRead();
    reminderLed.digitalWrite(cur ^ 1);
  }
  sendToDisplay({ type: 'REMINDER', reminder: { text: 'Check your medication' } });
}, 'next');

pollButton(playButton, () => {
  // choose down for station step, or swap to duck/voice action later
  radioControl('down');
}, 'play');

// ------------------------------
// HTTP API
// ------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    hardware: IS_HARDWARE,
    gpio: GPIO_ENABLED,
    clients: { browser: !!clients.browser, display: !!clients.display }
  });
});

app.post('/radio/set/:mhz', (req, res) => {
  radioControl(req.params.mhz);
  res.json({ ok: true, tuned: req.params.mhz });
});

app.post('/radio/up', (req, res) => {
  radioControl('up');
  res.json({ ok: true });
});

app.post('/radio/down', (req, res) => {
  radioControl('down');
  res.json({ ok: true });
});

app.post('/radio/stop', (req, res) => {
  radioControl('stop');
  res.json({ ok: true });
});

// ------------------------------
// Start HTTP server
// ------------------------------
const PORT = 3001;
app.listen(PORT, () => {
  console.log('Hardware service running on port ' + PORT);
  console.log('WebSocket server on port 8080');
  console.log('Mode: ' + (IS_HARDWARE ? 'HARDWARE' : 'MOCK'));
});

// ------------------------------
// Cleanup
// ------------------------------
process.on('SIGINT', () => {
  console.log('Shutting down...');
  try { if (powerLed) powerLed.digitalWrite(0); } catch {}
  process.exit();
});
