# Vapi Quick Start for FM Radio Voice AI

## 🚀 Quick Setup (30 minutes)

Since you're familiar with Vapi, here's how to integrate it with your FM radio project:

---

## Step 1: Create Vapi Assistant (5 mins)

### 1.1 Sign up / Login
```
https://vapi.ai
```

### 1.2 Create New Assistant

**Name:** Cogito Senior Care Assistant

**System Prompt:**
```
You are a compassionate and patient AI assistant designed specifically for seniors with Alzheimer's disease and memory issues. Your primary role is to provide comfort, assistance, and companionship through voice conversations.

GUIDELINES:
1. Speak slowly and clearly
2. Use simple, short sentences
3. Be extremely patient - users may repeat themselves or lose track
4. Provide gentle reassurance and validation
5. Never make users feel bad about forgetting
6. Repeat information cheerfully if asked
7. Use a warm, friendly, grandmotherly/grandfatherly tone

CAPABILITIES:
- Provide daily reminders (medications, meals, appointments)
- Engage in casual conversation to combat loneliness
- Relay messages from caregivers and family members
- Help with basic information (time, date, weather)
- Provide memory aids (names of people, recent events)
- Play music or tell stories upon request

SAFETY:
- If the user seems distressed or in danger, suggest they speak to a caregiver
- Never provide medical advice
- Be extra patient with confusion or repetition

Remember: Your goal is to provide comfort and companionship, not just information.
```

**Voice:** Choose a calm, elderly-friendly voice:
- Recommended: `Rachel` or `Bella` (warm, clear, friendly)
- Settings: Speed 0.9x (slightly slower for clarity)

**Model:** GPT-4 (for better understanding and empathy)

**Transcriber:** Deepgram Nova-2 (best for elderly speech patterns)

---

## Step 2: Get Phone Number (2 mins)

### 2.1 In Vapi Dashboard
1. Go to "Phone Numbers"
2. Click "Buy Number"
3. Select a local number (easier for caregivers to remember)
4. Assign to your "Cogito Senior Care Assistant"

**Your Number:** `+1-XXX-XXX-XXXX` (save this!)

---

## Step 3: Test the Assistant (5 mins)

### 3.1 Call from Your Phone
```
Call: +1-XXX-XXX-XXXX
```

**Test Script:**
- "Hello, what's your name?"
- "What time is it?"
- "I forgot where I am"
- "Did my daughter call me?"
- "Tell me a story"

Verify:
- ✅ Voice is clear and friendly
- ✅ Responds appropriately to confusion
- ✅ Handles repetition gracefully
- ✅ Provides reassurance

---

## Step 4: Configure Advanced Features (10 mins)

### 4.1 Add Functions/Tools

In Vapi assistant settings, add these functions:

#### Get Caregiver Messages
```json
{
  "name": "get_caregiver_messages",
  "description": "Retrieve messages from caregivers and family members for the patient",
  "parameters": {
    "type": "object",
    "properties": {
      "device_id": {
        "type": "string",
        "description": "The FM radio device ID"
      }
    }
  },
  "endpoint": "https://your-backend.com/api/caregiver/messages"
}
```

#### Set Reminder
```json
{
  "name": "set_reminder",
  "description": "Set a reminder for the patient",
  "parameters": {
    "type": "object",
    "properties": {
      "reminder_text": {
        "type": "string",
        "description": "What to remind about"
      },
      "time": {
        "type": "string",
        "description": "When to remind (e.g., '2pm', 'in 30 minutes')"
      }
    },
    "required": ["reminder_text", "time"]
  },
  "endpoint": "https://your-backend.com/api/reminders/set"
}
```

#### Log Conversation
```json
{
  "name": "log_conversation",
  "description": "Log important information from the conversation for caregivers",
  "parameters": {
    "type": "object",
    "properties": {
      "device_id": {
        "type": "string"
      },
      "summary": {
        "type": "string",
        "description": "Summary of the conversation"
      },
      "concerns": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Any concerns to flag for caregivers"
      }
    }
  },
  "endpoint": "https://your-backend.com/api/conversations/log"
}
```

---

## Step 5: Create Backend Endpoints (Optional)

If you want to integrate with your backend for caregiver features:

### 5.1 Add to your backend

```typescript
// backend/src/routes/caregiverRoutes.ts
import { Router } from 'express';

const router = Router();

// Endpoint for Vapi to fetch caregiver messages
router.get('/api/caregiver/messages', async (req, res) => {
  const { device_id } = req.query;

  // Fetch messages from database
  const messages = await CaregiverMessage.find({
    deviceId: device_id,
    read: false
  }).sort({ createdAt: -1 });

  res.json({
    messages: messages.map(m => ({
      from: m.caregiverName,
      text: m.messageText,
      timestamp: m.createdAt
    }))
  });
});

// Endpoint for Vapi to set reminders
router.post('/api/reminders/set', async (req, res) => {
  const { device_id, reminder_text, time } = req.body;

  const reminder = await Reminder.create({
    deviceId: device_id,
    text: reminder_text,
    scheduledFor: parseTime(time)
  });

  res.json({
    success: true,
    reminder_id: reminder.id,
    message: `Reminder set for ${time}: ${reminder_text}`
  });
});

// Endpoint for Vapi to log conversations
router.post('/api/conversations/log', async (req, res) => {
  const { device_id, summary, concerns } = req.body;

  await ConversationLog.create({
    deviceId: device_id,
    summary,
    concerns,
    timestamp: new Date()
  });

  // Notify caregivers if there are concerns
  if (concerns && concerns.length > 0) {
    await notifyCaregiversOfConcerns(device_id, concerns);
  }

  res.json({ success: true });
});

export default router;
```

---

## Step 6: Integrate with FM Radio

### Option A: Phone Call Integration (Simplest)

If your FM radio has cellular/SIM card capability:

```typescript
// FM Radio Controller
import { TwilioDevice } from '@twilio/voice-sdk';

class FMRadioVoiceController {
  private vapiPhoneNumber = '+1-XXX-XXX-XXXX'; // Your Vapi number

  async startVoiceConversation() {
    // When user presses voice button, dial Vapi number
    await this.phoneDialer.dial(this.vapiPhoneNumber);

    console.log('Connected to Vapi assistant');

    // Audio automatically routes through radio speaker/mic
  }

  async stopVoiceConversation() {
    await this.phoneDialer.hangup();
  }
}
```

### Option B: VoIP Integration

If radio has WiFi but no SIM:

```typescript
// Use WebRTC for VoIP calls
import { Device } from '@twilio/voice-sdk';

class VoIPController {
  private device: Device;

  async initialize() {
    // Get Twilio token from your backend
    const token = await fetch('https://your-backend.com/api/twilio/token')
      .then(r => r.json());

    this.device = new Device(token);
    await this.device.register();
  }

  async callVapi() {
    const call = await this.device.connect({
      params: {
        To: process.env.VAPI_PHONE_NUMBER
      }
    });

    // Audio routes through radio speaker
  }
}
```

### Option C: Vapi Web SDK (No Phone Required!)

Vapi also has a Web SDK for direct integration:

```typescript
import Vapi from '@vapi-ai/web';

class VapiWebController {
  private vapi: Vapi;

  constructor() {
    this.vapi = new Vapi(process.env.VAPI_PUBLIC_KEY);
  }

  async startConversation() {
    // Start conversation directly (no phone call needed!)
    await this.vapi.start({
      assistantId: 'your-assistant-id',
      // Audio automatically captured from microphone
    });

    this.vapi.on('message', (message) => {
      console.log('AI said:', message.text);
    });

    this.vapi.on('speech-start', () => {
      console.log('User started speaking');
    });
  }

  async stopConversation() {
    this.vapi.stop();
  }
}
```

**This is the easiest for FM Radio!** No phone calls needed, just internet.

---

## Step 7: Update Your Frontend

### 7.1 Install Vapi SDK

```bash
cd frontend
npm install @vapi-ai/web
```

### 7.2 Update radio.tsx

```typescript
// frontend/app/radio.tsx
import Vapi from '@vapi-ai/web';
import { useEffect, useState } from 'react';

const VAPI_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPI_KEY;
const VAPI_ASSISTANT_ID = process.env.EXPO_PUBLIC_VAPI_ASSISTANT_ID;

export default function RadioScreen() {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const vapiInstance = new Vapi(VAPI_PUBLIC_KEY);

    vapiInstance.on('message', (message) => {
      setMessages(prev => [...prev, message.text]);
    });

    vapiInstance.on('call-start', () => {
      setIsActive(true);
    });

    vapiInstance.on('call-end', () => {
      setIsActive(false);
    });

    setVapi(vapiInstance);

    return () => {
      vapiInstance.stop();
    };
  }, []);

  const handleStart = async () => {
    await vapi?.start({
      assistantId: VAPI_ASSISTANT_ID,
    });
  };

  const handleStop = () => {
    vapi?.stop();
  };

  return (
    <View>
      <Text>Cogito Voice Radio</Text>
      <Text>Status: {isActive ? 'Active' : 'Idle'}</Text>

      <Button
        title={isActive ? 'Stop' : 'Start'}
        onPress={isActive ? handleStop : handleStart}
      />

      <ScrollView>
        {messages.map((msg, i) => (
          <Text key={i}>{msg}</Text>
        ))}
      </ScrollView>
    </View>
  );
}
```

### 7.3 Update .env

```env
EXPO_PUBLIC_VAPI_KEY=your-vapi-public-key
EXPO_PUBLIC_VAPI_ASSISTANT_ID=your-assistant-id
```

---

## 🎯 Summary: 3 Ways to Use Vapi

| Method | Complexity | Best For | Cost |
|--------|-----------|----------|------|
| **Phone Call** | Low | Testing quickly | $0.10/min |
| **VoIP** | Medium | Production without SIM | $0.05/min |
| **Web SDK** | Low | WiFi-enabled radio | $0.05/min |

**Recommendation:** Use **Vapi Web SDK** (Option C) - it's the easiest and cheapest!

---

## 📊 Cost Breakdown

**Vapi Pricing:**
- Inbound/Outbound calls: ~$0.10/min
- Web SDK: ~$0.05/min
- STT (Deepgram): Included
- TTS: Included
- AI (GPT-4): Included in plan

**Monthly Cost Estimate:**
- 100 patients
- 5 conversations per day
- 3 minutes per conversation
- 30 days

**Total:** 100 × 5 × 3 × 30 × $0.05 = **$2,250/month**

(For comparison, custom backend would be ~$500/month)

---

## 🔧 Testing Checklist

- [ ] Vapi assistant created
- [ ] Phone number assigned
- [ ] Test call from your phone works
- [ ] System prompt tested with elderly speech patterns
- [ ] Functions configured (if using backend)
- [ ] Web SDK integrated (if using WiFi)
- [ ] FM radio can connect to Vapi
- [ ] Audio quality is good
- [ ] Response time is acceptable (<2 seconds)

---

## 🚀 Next Steps

1. **This Week:** Set up Vapi assistant and test
2. **Next Week:** Integrate with FM radio hardware
3. **Week 3:** Test with real seniors
4. **Week 4:** Collect feedback and iterate

**Then decide:** Keep Vapi or migrate to custom backend based on:
- Cost at scale
- Feature needs
- Performance
- Control requirements

Want me to help with any specific integration step?
