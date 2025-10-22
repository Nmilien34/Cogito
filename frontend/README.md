# Cogito FM Radio - Voice AI Frontend

Frontend application for the Cogito Voice AI Radio, designed specifically for FM radio devices to assist Alzheimer's patients and seniors.

## Project Overview

This is a **simplified React Native application** designed to run on FM radio hardware with voice AI capabilities. The app has been stripped of all unnecessary mobile UI components and focuses solely on voice interaction functionality.

### Target Audience
- **Alzheimer's patients** and seniors in nursing homes
- **Caregivers** who want to communicate with patients through the AI interface
- Users who are **not tech-literate** but familiar with radio devices

### Key Design Principles
- **Headless-first**: Minimal UI, voice-driven interaction
- **Device-based auth**: No complex OAuth or user onboarding
- **Radio-optimized**: Designed for FM radio hardware, not smartphones
- **Accessibility**: Simple, clear, and easy to use

---

## Project Structure

```
frontend/
├── app/
│   ├── _layout.tsx         # Root layout (simplified)
│   ├── index.tsx           # Entry point (redirects to /radio)
│   └── radio.tsx           # Main FM radio screen
│
├── src/
│   ├── services/
│   │   ├── VoiceRadioService.ts      # Headless voice AI service
│   │   └── DeviceAuthService.ts      # Device-based authentication
│   ├── features/
│   │   └── voice/                     # Voice AI components (kept for reference)
│   ├── lib/
│   │   ├── api.ts                     # HTTP client
│   │   └── socket.ts                  # WebSocket client
│   └── types/
│       └── user.ts                    # Type definitions
│
├── package.json            # Minimal dependencies
└── README.md              # This file
```

---

## What Was Removed

### Deleted Components (No Longer Needed)

✂️ **Mobile UI Components**
- `app/(tabs)/` - Tab navigation (Home, Memory, Tools, Library)
- `app/auth.tsx` - Email/Google authentication screen
- `app/email-auth.tsx` - Email OTP verification
- `app/onboard.tsx` - Onboarding flow

✂️ **Authentication UI**
- `src/features/onboarding/PhoneVerification.tsx`
- `src/features/onboarding/PhoneInput.tsx`
- `src/features/onboarding/NameAndTermsForm.tsx`
- `src/hooks/useGoogleAuth.ts`
- `src/components/ui/Checkbox.tsx`

✂️ **Assets**
- Logo images (Boltzman branding)
- Splash screen image
- Sound effects (preconnect.mp3)

✂️ **Dependencies Removed**
- `@react-native-google-signin/google-signin` - Google OAuth
- `@react-navigation/bottom-tabs` - Tab navigation
- `expo-haptics` - Haptic feedback
- `expo-image` - Image loading
- `expo-av` - Audio playback
- `expo-auth-session` - OAuth flows
- `expo-web-browser` - Browser for auth
- `nativewind` / `tailwindcss` - Styling framework
- `react-native-gesture-handler` - Gestures
- `react-native-reanimated` - Animations
- `react-native-incall-manager` - Call audio

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

### 3. Update Voice Agent ID

In `app/radio.tsx`, update the agent ID:

```typescript
const VOICE_AGENT_ID = 'your-11labs-agent-id';
```

### 4. Run the App

```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator

---

## Core Services

### VoiceRadioService

Headless voice AI service that manages conversations without UI.

**Location:** `src/services/VoiceRadioService.ts`

**Features:**
- Message type handling: `transcript`, `text`, `tool_call`, `tool_response`
- Status tracking: `idle`, `connecting`, `connected`, `disconnected`, `error`
- Message history management
- Event-based callbacks

**Usage:**

```typescript
import { VoiceRadioService } from './services/VoiceRadioService';

const voiceService = new VoiceRadioService({
  agentId: 'your-agent-id',
  onMessage: (message) => console.log('Received:', message.content),
  onStatusChange: (status) => console.log('Status:', status),
  onError: (error) => console.error('Error:', error)
});
```

---

### DeviceAuthService

Simple authentication for FM radio devices.

**Location:** `src/services/DeviceAuthService.ts`

**Features:**
- Generates unique device ID (UUID)
- Stores authentication token locally
- No user interaction required
- Device "factory reset" capability

**Usage:**

```typescript
import { deviceAuthService } from './services/DeviceAuthService';

await deviceAuthService.initialize();
const token = await deviceAuthService.authenticateDevice('My Radio');
```

---

## Hardware Integration

For actual FM radio hardware integration:

1. **Audio I/O**: Connect microphone and speaker to device
2. **Physical Buttons**: Map radio buttons to voice controls
3. **Headless Mode**: Extract VoiceRadioService for background operation
4. **Power Optimization**: Reduce memory and CPU usage

---

## Dependencies (Minimal)

```json
{
  "@11labs/client": "^0.1.2",              // Voice AI
  "@11labs/react": "^0.1.2",               // Voice hooks
  "axios": "^1.8.3",                        // HTTP
  "socket.io-client": "^4.8.1",             // WebSocket
  "react-native": "0.76.9",                 // Core framework
  "expo": "~52.0.42"                        // Expo SDK
}
```

All non-essential dependencies have been removed.

---

## Troubleshooting

**"Cannot find module" errors**
- Run `npm install` to reinstall dependencies
- Clear cache: `npx expo start -c`

**11Labs authentication errors**
- Check API key in `.env`
- Verify agent ID is correct

**Backend connection errors**
- Ensure backend is running
- Check `EXPO_PUBLIC_API_URL` in `.env`

---

## License

MIT
