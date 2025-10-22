# Cogito Voice AI Radio - Complete Codebase Overview

## 📋 Project Summary

**Project Name:** Cogito Voice AI Radio
**Purpose:** FM Radio-based voice AI assistant for Alzheimer's patients and seniors in nursing homes
**Target Users:** Seniors with Alzheimer's, caregivers, and family members
**Tech Stack:** React Native (frontend), Node.js + Express (backend), MongoDB, 11Labs Voice AI

---

## 🏗️ Project Structure

```
cogito/
├── backend/                    # Node.js Express API Server
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # MongoDB models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic services
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   └── index.ts           # Main entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                   # React Native + Expo App
│   ├── app/
│   │   ├── _layout.tsx        # Root layout
│   │   ├── index.tsx          # Entry point
│   │   └── radio.tsx          # Main FM radio screen
│   ├── src/
│   │   ├── services/          # Core services
│   │   ├── features/voice/    # Voice AI components
│   │   ├── lib/               # API clients
│   │   ├── context/           # React context
│   │   ├── theme/             # Theme config
│   │   └── types/             # Type definitions
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── README.md                   # Root documentation
├── CLEANUP_SUMMARY.md         # Frontend cleanup details
├── VOICE_AI_ARCHITECTURE.md   # Voice AI options
└── CURRENT_VOICE_SETUP.md     # Current 11Labs setup
```

---

## 🎯 Backend Architecture

### **Technology Stack**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (Access + Refresh tokens)
- **Real-time:** Socket.io for WebSocket connections
- **Email:** SendGrid or SMTP (configurable)
- **SMS:** Twilio for phone verification
- **OAuth:** Google OAuth 2.0

### **File Structure (Backend)**

```
backend/src/
├── config/
│   ├── database.ts          # MongoDB connection setup
│   └── env.ts               # Environment variable config
│
├── controllers/
│   ├── authController.ts    # Authentication logic (email, Google, phone)
│   └── conversationController.ts  # Conversation management
│
├── middleware/
│   └── auth.ts              # JWT authentication middleware
│
├── models/
│   ├── User.ts              # User model (email, phone, subscription, settings)
│   ├── OTP.ts               # OTP verification model (auto-expiring)
│   └── Conversation.ts      # Conversation history model
│
├── routes/
│   ├── authRoutes.ts        # Auth endpoints (/api/auth/*)
│   └── conversationRoutes.ts  # Conversation endpoints (/api/conversations/*)
│
├── services/
│   ├── emailService.ts      # Email sending (SendGrid/SMTP)
│   ├── smsService.ts        # SMS sending (Twilio)
│   └── socketService.ts     # Socket.io WebSocket server
│
├── types/
│   └── index.ts             # TypeScript type definitions
│
├── utils/
│   ├── jwt.ts               # JWT token generation/verification
│   └── otp.ts               # OTP generation utilities
│
└── index.ts                 # Main Express server
```

### **Backend API Endpoints**

#### **Authentication Endpoints**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/auth/email/send-code` | Send OTP to email | No |
| POST | `/api/auth/email/verify-code` | Verify email OTP | No |
| POST | `/api/auth/google/verify` | Verify Google OAuth token | No |
| POST | `/api/auth/phone/send-otp` | Send OTP to phone | Yes |
| POST | `/api/auth/phone/verify-otp` | Verify phone OTP | Yes |
| POST | `/api/auth/set-names-and-terms` | Set user info | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout user | Yes |

#### **Conversation Endpoints**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/conversations` | Get all conversations | Yes |
| GET | `/api/conversations/:id` | Get specific conversation | Yes |
| DELETE | `/api/conversations/:id` | Delete conversation | Yes |
| POST | `/api/conversations/:id/stream/start` | Start conversation stream | Yes |
| POST | `/api/conversations/:id/threads/:threadId/stream/start` | Start thread stream | Yes |

#### **WebSocket Events (Socket.io)**

**Client → Server:**
- `startVoiceSession` - Start voice conversation
- `sendAudio` - Send audio data
- `stopVoiceSession` - Stop voice session

**Server → Client:**
- `VOICE_SESSION_STARTED` - Session started
- `VOICE_SESSION_STOPPED` - Session stopped
- `event` - General events
- `error` - Error messages

### **Database Models**

#### **User Model**
```typescript
{
  id: string,
  email: string,
  password: string (hashed),
  firstName: string,
  lastName: string,
  avatar: string,
  phoneNumber: string,
  phoneVerified: boolean,
  authType: 'GOOGLE' | 'EMAIL',
  googleId: string,
  termsAccepted: boolean,
  subscription: {
    stripeCustomerId: string,
    plan: 'free' | 'pro' | 'admin',
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: boolean
  },
  referralCode: string,
  settings: {
    theme: 'light' | 'dark' | 'system',
    font: 'sans' | 'serif' | 'mono',
    fontSize: 'small' | 'medium' | 'large',
    language: 'en' | 'es' | 'fr' | ...
  },
  refreshToken: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### **OTP Model**
```typescript
{
  email: string,
  phoneNumber: string,
  otp: string (6-digit),
  expiresAt: Date (10 minutes),
  attempts: number (max 5),
  createdAt: Date
}
```

#### **Conversation Model**
```typescript
{
  userId: ObjectId,
  title: string,
  messages: [
    {
      role: 'user' | 'assistant' | 'system',
      content: string,
      timestamp: Date,
      metadata: object
    }
  ],
  model: string,
  style: string,
  voiceModel: string,
  isVoiceConversation: boolean,
  active: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **Backend Configuration**

#### **Environment Variables (.env)**
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/cogito

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (SendGrid or SMTP)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key
EMAIL_FROM=noreply@cogito.ai

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# 11Labs
ELEVENLABS_API_KEY=your-api-key

# CORS
CORS_ORIGIN=http://localhost:8081
```

---

## 📱 Frontend Architecture

### **Technology Stack**
- **Framework:** React Native 0.76.9
- **Build Tool:** Expo 52
- **Language:** TypeScript 5.3.3
- **Routing:** Expo Router (file-based)
- **HTTP Client:** Axios 1.8.3
- **WebSocket:** Socket.io Client 4.8.1
- **Voice AI:** 11Labs Client + React hooks
- **Storage:** AsyncStorage (React Native)

### **File Structure (Frontend)**

```
frontend/
├── app/                       # Expo Router screens
│   ├── _layout.tsx           # Root layout (simplified)
│   ├── index.tsx             # Entry point (redirects to /radio)
│   └── radio.tsx             # Main FM radio screen
│
├── src/
│   ├── services/             # Core business logic services
│   │   ├── VoiceRadioService.ts    # Headless voice AI service
│   │   └── DeviceAuthService.ts    # Device authentication
│   │
│   ├── features/
│   │   └── voice/            # Voice AI components (legacy)
│   │       ├── ConvAI.tsx    # 11Labs conversation component
│   │       ├── VoiceSheet.tsx # Voice modal wrapper
│   │       └── types/        # Type definitions for voice
│   │
│   ├── lib/
│   │   ├── api.ts            # Axios HTTP client with interceptors
│   │   └── socket.ts         # Socket.io WebSocket client
│   │
│   ├── context/
│   │   └── AuthContext.tsx   # Authentication context (legacy)
│   │
│   ├── theme/
│   │   └── colors.ts         # Color theme definitions
│   │
│   └── types/
│       └── user.ts           # User type definitions
│
├── android/                   # Android native code
├── ios/                       # iOS native code
├── package.json              # Dependencies (13 packages)
├── tsconfig.json             # TypeScript configuration
├── babel.config.js           # Babel configuration
├── app.config.js             # Expo app configuration
├── app.json                  # Expo metadata
└── .env.example              # Environment template
```

### **Frontend Dependencies**

**Core Dependencies (13 total):**
```json
{
  "@11labs/client": "^0.1.2",              // 11Labs voice AI client
  "@11labs/react": "^0.1.2",               // React hooks for 11Labs
  "@expo/vector-icons": "^14.0.2",         // Icon library
  "@react-native-async-storage/async-storage": "1.23.1",  // Local storage
  "axios": "^1.8.3",                       // HTTP client
  "expo": "~52.0.42",                      // Expo SDK
  "expo-constants": "~17.0.8",             // App constants
  "expo-dev-client": "~5.0.19",            // Development client
  "expo-router": "~4.0.20",                // File-based routing
  "expo-status-bar": "~2.0.1",             // Status bar control
  "react": "18.3.1",                       // React core
  "react-native": "0.76.9",                // React Native
  "react-native-safe-area-context": "4.12.0",  // Safe area handling
  "react-native-screens": "~4.4.0",        // Native screens
  "socket.io-client": "^4.8.1"             // WebSocket client
}
```

### **Voice AI Setup (11Labs)**

#### **Current Integration**
- **SDK:** `@11labs/react` - Direct WebSocket to 11Labs servers
- **Agent ID:** `n3MbanaRoXM0G18j3JS5` (hardcoded)
- **Connection:** Real-time WebSocket streaming
- **Audio:** Direct microphone → 11Labs → speaker

#### **Voice Conversation Flow**
```
1. User presses "Start Voice" button
   ↓
2. VoiceRadioService.startConversation()
   ↓
3. 11Labs useConversation hook:
   - Requests microphone permission
   - Starts WebSocket to 11Labs servers
   - Sends agent ID: n3MbanaRoXM0G18j3JS5
   ↓
4. User speaks → Microphone captures audio
   ↓
5. Audio streams to 11Labs servers
   ↓
6. 11Labs processes:
   - Speech-to-Text (transcription)
   - AI processing (conversation logic)
   - Text-to-Speech (voice synthesis)
   ↓
7. Audio response streams back
   ↓
8. Device speaker plays AI voice
   ↓
9. App receives messages:
   - transcript: "Hello, how are you?"
   - text: "I'm doing well, thank you!"
   - tool_call: { toolName: "get_weather", args: {...} }
```

#### **Message Types Received**

**1. Transcript (User Speech)**
```typescript
{
  type: "transcript",
  transcript: "Hello, how are you?"
}
```

**2. Text (AI Response)**
```typescript
{
  type: "text",
  text: "I'm doing well, thank you for asking!"
}
```

**3. Tool Call (Function Execution)**
```typescript
{
  type: "tool_call",
  toolName: "get_weather",
  args: { location: "New York" },
  call_id: "abc123"
}
```

**4. Tool Response (Function Result)**
```typescript
{
  type: "tool_response",
  toolName: "get_weather",
  response: { temp: 72, condition: "sunny" }
}
```

### **Core Services**

#### **1. VoiceRadioService.ts**
Headless voice AI service that wraps 11Labs hooks.

**Purpose:** Manage voice conversations without UI dependencies

**Features:**
- Message handling (transcript, text, tool calls)
- Status tracking (idle, connecting, connected, error)
- Message history management
- Event-based callbacks

**Usage:**
```typescript
const voiceService = new VoiceRadioService({
  agentId: 'n3MbanaRoXM0G18j3JS5',
  onMessage: (message) => { /* handle message */ },
  onStatusChange: (status) => { /* handle status */ },
  onError: (error) => { /* handle error */ },
  onToolCall: (toolCall) => { /* handle tool */ }
});

await voiceService.startConversation();
```

#### **2. DeviceAuthService.ts**
Simple device-based authentication without user interaction.

**Purpose:** Authenticate FM radio devices automatically

**Features:**
- Generates unique device ID (UUID)
- Stores authentication token locally
- No user login required
- Device factory reset capability

**Usage:**
```typescript
import { deviceAuthService } from './services/DeviceAuthService';

await deviceAuthService.initialize();
const token = await deviceAuthService.authenticateDevice('My Radio');
const deviceId = deviceAuthService.getDeviceId();
```

### **Main Screen: radio.tsx**

**Purpose:** Main (and only) UI screen for FM radio device

**Features:**
- Start/Stop voice conversation
- Display message history
- Show connection status
- Display device ID
- Minimal, accessible UI

**UI Components:**
- Header with title and status indicator
- Scrollable message display
- Control buttons (Start, Stop, Clear)
- Footer with device info

**Status Colors:**
- 🟢 Green: Connected
- 🟡 Yellow: Connecting
- 🔴 Red: Error
- ⚪ Gray: Idle/Disconnected

---

## 🔧 Configuration Files

### **Backend Configuration**

**package.json:**
- 17 TypeScript files
- Express.js + Socket.io
- MongoDB + Mongoose
- Authentication libraries (JWT, OAuth, Twilio)

**tsconfig.json:**
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Source maps enabled

### **Frontend Configuration**

**package.json:**
- 13 core dependencies
- React Native 0.76.9
- Expo 52
- 11Labs voice SDK

**tsconfig.json:**
- Target: ESNext
- Module: ESNext
- JSX: react-native
- Strict mode enabled

**babel.config.js:**
- Preset: babel-preset-expo
- Simplified (removed NativeWind, Reanimated)

---

## 🎨 Removed Components (Cleanup)

### **Deleted Files (17+ files)**
- ❌ `app/(tabs)/` - Tab navigation (4 screens)
- ❌ `app/auth.tsx` - Authentication screen
- ❌ `app/email-auth.tsx` - Email verification
- ❌ `app/onboard.tsx` - Onboarding flow
- ❌ `src/features/onboarding/` - Phone verification components
- ❌ `src/hooks/useGoogleAuth.ts` - Google OAuth hook
- ❌ `src/components/ui/` - UI components
- ❌ `nativewind-env.d.ts` - NativeWind types
- ❌ `global.css` - Global styles
- ❌ `tailwind.config.js` - Tailwind config
- ❌ `metro.config.js` - Metro config

### **Removed Dependencies (14 packages)**
- Google Sign-in
- Bottom tabs navigation
- Haptics, Image, Audio/Video
- OAuth session, Web browser
- NativeWind, Tailwind CSS
- Gesture handler, Reanimated
- In-call manager

### **Why Removed?**
The app was originally a full mobile app with complex UI. For FM radio:
- No need for visual tabs or navigation
- No manual user authentication (device-based)
- No mobile-specific UI libraries
- Focus on voice interaction only

---

## 📊 Current State Summary

### **Backend Status: ✅ Complete**
- 17 TypeScript files
- 8 authentication endpoints
- 5 conversation endpoints
- Socket.io WebSocket server
- MongoDB models ready
- JWT authentication working
- Ready to deploy

### **Frontend Status: ✅ Simplified**
- Cleaned up mobile UI
- Single radio screen
- 11Labs voice AI integrated
- Device authentication ready
- 13 minimal dependencies
- Ready for FM radio hardware

### **Integration Status: ⚠️ Needs Work**
- Backend and frontend are separate
- No backend endpoints called yet (except legacy)
- 11Labs is direct (bypasses backend)
- No caregiver messaging system
- No phone number integration

---

## 🎯 Design Purpose

### **Target Use Case:**
FM radio device for Alzheimer's patients in nursing homes

### **Key Features Needed:**
1. ✅ Voice AI conversation (11Labs)
2. ❌ Caregiver messaging via phone
3. ❌ Backend conversation logging
4. ❌ Memory aids and reminders
5. ❌ Emergency alerts to caregivers

### **Current Capabilities:**
- ✅ Voice conversation works (11Labs direct)
- ✅ Device authentication works
- ✅ Message history tracked locally
- ❌ No backend integration yet
- ❌ No phone number for family
- ❌ No caregiver features

---

## 🚀 Next Steps to Production

### **Phase 1: Current 11Labs Setup**
1. Configure 11Labs agent on dashboard
2. Test voice quality with seniors
3. Integrate with FM radio hardware
4. Deploy MVP

**Limitations:**
- No backend features
- No caregiver messaging
- Hard to add custom logic

### **Phase 2: Add Backend Features**
1. Connect frontend to backend API
2. Add conversation logging
3. Implement caregiver dashboard
4. Add reminder system

**Challenges:**
- 11Labs is direct (hard to intercept)
- Need webhook system for tools
- Limited backend control

### **Phase 3: Consider Migration**
1. Evaluate 11Labs vs Vapi vs Custom
2. Migrate if needed for features
3. Add phone number for family
4. Full backend integration

---

## 📝 Documentation Files

- `README.md` - Root project overview
- `backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend setup guide
- `CLEANUP_SUMMARY.md` - Frontend cleanup details
- `VOICE_AI_ARCHITECTURE.md` - Voice AI options analysis
- `CURRENT_VOICE_SETUP.md` - 11Labs setup explanation
- `CODEBASE_OVERVIEW.md` - This file

---

## 🔑 Key Takeaways

### **What You Have:**
- ✅ Complete backend API (not connected yet)
- ✅ Simplified frontend with 11Labs voice
- ✅ Device authentication system
- ✅ Clean, focused codebase

### **What's Missing:**
- ❌ Backend-frontend integration
- ❌ Caregiver messaging system
- ❌ Phone number for family
- ❌ Conversation logging to backend
- ❌ Custom AI logic on backend

### **Recommendation:**
Current setup works for basic voice AI testing. For production with caregiver features, consider migrating to Vapi for:
- Phone number integration
- Backend webhook control
- Easier testing
- More features

---

**Last Updated:** October 22, 2025
**Status:** Backend complete, Frontend simplified, Integration pending
**Ready For:** MVP testing with 11Labs, Hardware integration planning
