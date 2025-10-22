# ✅ Vapi Migration Complete!

## 🎉 Successfully Migrated from 11Labs to Vapi

Your entire codebase has been successfully migrated from 11Labs to Vapi. Here's what's been done and how to use it.

---

## 📋 What Changed

### Frontend Changes

**Removed:**
- ❌ `@11labs/client` package
- ❌ `@11labs/react` package
- ❌ Old `VoiceRadioService.ts` (11Labs-based)
- ❌ Hardcoded agent ID: `n3MbanaRoXM0G18j3JS5`

**Added:**
- ✅ `@vapi-ai/web` package
- ✅ New `VapiService.ts` - Modern Vapi integration
- ✅ Updated `radio.tsx` - Full Vapi support
- ✅ Mute/unmute functionality
- ✅ Better status tracking

### Backend Changes

**Added:**
- ✅ `CaregiverMessage` model - Store family messages
- ✅ `ConversationLog` model - Log conversations
- ✅ `vapiController.ts` - Vapi webhook handlers
- ✅ `vapiRoutes.ts` - Vapi API endpoints
- ✅ 4 new webhook endpoints for Vapi

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd ../backend
npm install
```

### Step 2: Configure Vapi

#### A. Create Vapi Account
1. Go to https://vapi.ai
2. Sign up / Login
3. Go to Dashboard

#### B. Create Assistant for Seniors

**In Vapi Dashboard → Assistants → Create New:**

```json
{
  "name": "Cogito Senior Care Assistant",
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-2"
  },
  "model": {
    "provider": "openai",
    "model": "gpt-4",
    "systemPrompt": "You are a compassionate AI assistant for seniors with Alzheimer's disease. Speak slowly, clearly, and patiently. Be warm and reassuring. Check for new messages from family members and read them. If the senior seems confused or distressed, log it for caregivers.",
    "functions": [
      {
        "name": "get_caregiver_messages",
        "description": "Get new messages from family members for this patient",
        "parameters": {
          "type": "object",
          "properties": {
            "deviceId": {
              "type": "string",
              "description": "The FM radio device ID"
            }
          },
          "required": ["deviceId"]
        },
        "url": "https://your-backend-url.com/api/vapi/get-messages"
      },
      {
        "name": "log_conversation",
        "description": "Log important conversation details for caregivers",
        "parameters": {
          "type": "object",
          "properties": {
            "deviceId": {
              "type": "string"
            },
            "summary": {
              "type": "string"
            },
            "concerns": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": ["deviceId", "summary"]
        },
        "url": "https://your-backend-url.com/api/vapi/log-conversation"
      }
    ]
  },
  "voice": {
    "provider": "11labs",
    "voiceId": "rachel"  // Warm, clear voice
  }
}
```

**Copy the Assistant ID!**

#### C. Create Assistant for Family Messages

**Create another assistant for family members to leave messages:**

```json
{
  "name": "Cogito Family Message Recorder",
  "model": {
    "provider": "openai",
    "model": "gpt-4",
    "systemPrompt": "You help family members leave voice messages for their loved ones with Alzheimer's. Be warm and supportive. Ask for: 1) Their name, 2) Patient's device ID or phone number, 3) Their message. Then confirm it was received.",
    "functions": [
      {
        "name": "save_message",
        "description": "Save a message from a family member",
        "parameters": {
          "type": "object",
          "properties": {
            "senderName": {
              "type": "string"
            },
            "patientIdentifier": {
              "type": "string",
              "description": "Device ID, phone, or patient identifier"
            },
            "messageText": {
              "type": "string"
            },
            "senderPhone": {
              "type": "string"
            }
          },
          "required": ["senderName", "patientIdentifier", "messageText"]
        },
        "url": "https://your-backend-url.com/api/vapi/save-message"
      }
    ]
  },
  "voice": {
    "provider": "11labs",
    "voiceId": "sarah"
  }
}
```

#### D. Get Phone Numbers (Optional)

**In Vapi Dashboard → Phone Numbers:**
1. Buy 2 phone numbers:
   - One for seniors (attach "Senior Care Assistant")
   - One for family (attach "Family Message Recorder")

2. Save the numbers:
   - Senior: `+1-XXX-XXX-XXXX`
   - Family: `+1-YYY-YYY-YYYY`

### Step 3: Configure Environment Variables

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

**Edit `backend/.env`:**
```env
PORT=3000
NODE_ENV=development

# MongoDB (install locally or use Atlas)
MONGODB_URI=mongodb://localhost:27017/cogito

# JWT
JWT_SECRET=your-random-secret-key-here
JWT_REFRESH_SECRET=your-random-refresh-key-here

# Vapi (from dashboard)
VAPI_API_KEY=your-vapi-api-key
VAPI_PHONE_NUMBER=+1-XXX-XXX-XXXX
VAPI_ASSISTANT_ID=your-senior-assistant-id

# Twilio (for direct SMS if needed)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# CORS
CORS_ORIGIN=http://localhost:8081
```

#### Frontend (.env)

```bash
cd frontend
cp .env.example .env
```

**Edit `frontend/.env`:**
```env
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:3000

# Vapi (from dashboard)
EXPO_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key
EXPO_PUBLIC_VAPI_ASSISTANT_ID=your-senior-assistant-id
```

### Step 4: Start MongoDB

```bash
# If using local MongoDB
mongod --dbpath=/path/to/data

# Or use MongoDB Atlas (cloud)
# Just update MONGODB_URI in backend/.env
```

### Step 5: Run the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

---

## 🎯 How It Works Now

### Senior's Flow

```
1. Senior's radio boots up
   ↓
2. Device auth happens automatically (UUID-based)
   ↓
3. Senior presses "Start Voice" button
   ↓
4. Vapi connects and greets senior
   ↓
5. AI checks for messages: "You have 2 new messages"
   ↓
6. AI reads: "Message from Sarah: Mom, remember to take your pills"
   ↓
7. Conversation continues naturally
   ↓
8. AI logs conversation for caregivers
```

### Family's Flow

```
1. Family member calls: +1-YYY-YYY-YYYY
   ↓
2. Vapi answers: "Hello! Leave a message for your loved one"
   ↓
3. Family: "This is Sarah, patient ID device-123, tell Mom to take her pills"
   ↓
4. Vapi saves message to your backend
   ↓
5. Confirms: "Thank you Sarah, message will be delivered"
   ↓
6. Next time senior talks, AI reads the message
```

---

## 📊 Backend API Endpoints

### Vapi Webhooks (called by Vapi)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/vapi/get-messages` | Vapi gets caregiver messages |
| `POST /api/vapi/save-message` | Family saves a message |
| `POST /api/vapi/log-conversation` | Log conversation details |
| `POST /api/vapi/mark-read` | Mark message as read |

### Testing Webhooks Locally

```bash
# Test get messages
curl -X POST http://localhost:3000/api/vapi/get-messages \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "test-device-123"}'

# Test save message
curl -X POST http://localhost:3000/api/vapi/save-message \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "Sarah",
    "patientIdentifier": "test-device-123",
    "messageText": "Remember to take your medicine",
    "senderPhone": "+1234567890"
  }'
```

---

## 🧪 Testing the Complete System

### Test 1: Frontend Voice AI

```bash
cd frontend
npm start
# Press 'i' for iOS or 'a' for Android
# Click "Start Voice" button
# Speak to the AI
# Verify: Messages appear, status changes
```

### Test 2: Backend Webhooks

```bash
# In Postman or curl, test each endpoint
# Verify: Data saves to MongoDB
```

### Test 3: End-to-End Flow

```bash
# 1. Save a test message via API
curl -X POST http://localhost:3000/api/vapi/save-message \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "Test Family",
    "patientIdentifier": "your-device-id",
    "messageText": "This is a test message"
  }'

# 2. Start conversation on radio
# 3. AI should say: "You have 1 new message from Test Family..."
```

---

## 🔧 Troubleshooting

### "Vapi not configured" warning

**Problem:** Missing Vapi credentials

**Solution:**
```bash
cd frontend
# Make sure .env exists with:
EXPO_PUBLIC_VAPI_PUBLIC_KEY=sk_xxx
EXPO_PUBLIC_VAPI_ASSISTANT_ID=xxx
```

### "Failed to start conversation"

**Problem:** Wrong assistant ID or public key

**Solution:**
1. Check Vapi dashboard
2. Copy correct Public Key (starts with `pk_`)
3. Copy correct Assistant ID
4. Update frontend/.env
5. Restart app

### Webhook not working

**Problem:** Vapi can't reach your localhost

**Solution:**
1. Deploy backend to a public URL (Heroku, Railway, etc.)
2. Or use ngrok for testing:
   ```bash
   ngrok http 3000
   # Use ngrok URL in Vapi function URLs
   ```

### No messages returned

**Problem:** No messages in database

**Solution:**
```bash
# Save a test message first
curl -X POST http://localhost:3000/api/vapi/save-message \
  -H "Content-Type: application/json" \
  -d '{"senderName":"Test","patientIdentifier":"device-123","messageText":"Test"}'
```

---

## 📚 Key Files Reference

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/services/VapiService.ts` | Vapi integration service |
| `frontend/app/radio.tsx` | Main radio screen |
| `frontend/.env` | Vapi credentials |
| `frontend/package.json` | Dependencies (now with @vapi-ai/web) |

### Backend

| File | Purpose |
|------|---------|
| `backend/src/controllers/vapiController.ts` | Webhook handlers |
| `backend/src/routes/vapiRoutes.ts` | API routes |
| `backend/src/models/CaregiverMessage.ts` | Message model |
| `backend/src/models/ConversationLog.ts` | Log model |
| `backend/.env` | Configuration |

---

## 🎯 Next Steps

1. **Deploy Backend**
   - Deploy to Railway, Render, or Heroku
   - Update Vapi function URLs with production URL

2. **Configure Vapi Assistants**
   - Fine-tune prompts for Alzheimer's care
   - Test voice quality and conversation flow

3. **Add Phone Numbers**
   - Get Vapi phone numbers
   - Test family messaging system

4. **Hardware Integration**
   - Integrate with FM radio hardware
   - Map physical buttons to app controls

5. **Testing with Real Users**
   - Test with seniors
   - Collect feedback
   - Iterate on prompts

---

## ✅ Migration Checklist

- [x] Removed 11Labs packages
- [x] Installed Vapi SDK
- [x] Created VapiService
- [x] Updated radio.tsx
- [x] Added backend models (CaregiverMessage, ConversationLog)
- [x] Created Vapi webhooks
- [x] Updated environment configs
- [x] Documented everything

**Status:** ✅ COMPLETE - Ready to test!

---

## 💡 Quick Commands

```bash
# Start everything
cd backend && npm run dev &
cd frontend && npm start

# Test backend
curl http://localhost:3000/health

# Test Vapi webhook
curl -X POST http://localhost:3000/api/vapi/get-messages \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test"}'

# Clean restart
cd frontend && rm -rf node_modules && npm install
cd backend && rm -rf node_modules && npm install
```

---

**Last Updated:** October 22, 2025
**Migration Status:** ✅ Complete
**Ready For:** Testing and Vapi configuration
