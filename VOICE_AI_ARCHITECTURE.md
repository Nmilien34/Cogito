# Voice AI Architecture for FM Radio Device

## 🎯 Your Question: How to Build & Optimize the Voice AI?

You're used to using **Vapi** with phone numbers for voice AI systems. For this FM radio device, you have different options. Let me break down the best approach.

---

## 📊 Current Setup Analysis

### What You Have Now
- **11Labs Conversational AI** - Voice-to-voice AI agent
  - Agent ID: `n3MbanaRoXM0G18j3JS5`
  - Uses `@11labs/react` for real-time voice conversations
  - Direct WebSocket connection from client to 11Labs

### How It Works (Currently)
```
FM Radio Device → 11Labs SDK → 11Labs Server → Voice AI Response
```

**Pros:**
- ✅ Low latency (direct connection)
- ✅ High-quality voice synthesis
- ✅ Built-in conversation management

**Cons:**
- ❌ Limited customization of AI logic
- ❌ Can't add middleware/business logic easily
- ❌ No control over conversation flow on backend
- ❌ Harder to integrate with your backend services

---

## 🏗️ Recommended Architecture Options

### **Option 1: Vapi-Style Phone System (Your Familiar Approach)**

Since you're comfortable with Vapi, you can replicate this for the FM radio:

```
FM Radio Device → Phone Call → Vapi/Twilio → AI Assistant → Response
```

**How It Works:**
1. FM radio has a SIM card or uses VoIP
2. Device "calls" a phone number when voice button is pressed
3. Vapi/Twilio handles the call and routes to your AI assistant
4. AI responds through the phone line
5. Audio plays through radio speaker

**Implementation:**

```typescript
// On FM Radio Button Press
async function startVoiceConversation() {
  // Initiate a call to your Vapi phone number
  const callManager = new PhoneCallManager();
  await callManager.dial('+1-XXX-VAPI-NUMBER');

  // Audio is now routed through phone call
  // Vapi handles everything else
}
```

**Pros:**
- ✅ You're already familiar with Vapi
- ✅ Easy to set up and test
- ✅ Robust phone infrastructure
- ✅ Can use existing Vapi assistants
- ✅ No complex SDK integration

**Cons:**
- ❌ Requires SIM card or VoIP on radio
- ❌ Ongoing call costs
- ❌ Latency from phone network
- ❌ Dependent on cellular coverage

**Cost:** ~$0.05-0.15 per minute of conversation

---

### **Option 2: Backend-Managed Voice AI (Best for Full Control)**

Build your own voice AI pipeline with full control:

```
FM Radio → Your Backend → AI Provider (OpenAI/Anthropic) → TTS → Radio
          ↓
      WebSocket/Socket.io
```

**Architecture:**

```typescript
// 1. FM Radio captures audio
const audioStream = microphoneInput();

// 2. Send to your backend via WebSocket
socket.emit('audioChunk', audioStream);

// 3. Backend processes:
//    - Speech-to-Text (Deepgram, AssemblyAI, Whisper)
//    - AI Processing (OpenAI GPT-4, Anthropic Claude)
//    - Text-to-Speech (11Labs, ElevenLabs, PlayHT)
//    - Stream back to radio

// 4. Radio plays response
speaker.play(responseAudio);
```

**Implementation Structure:**

```javascript
// Backend: backend/src/services/voiceAIService.ts
class VoiceAIPipeline {
  async processVoiceInput(audioBuffer) {
    // 1. Speech to Text
    const transcript = await this.stt(audioBuffer);

    // 2. AI Processing
    const aiResponse = await this.getAIResponse(transcript);

    // 3. Text to Speech
    const audioResponse = await this.tts(aiResponse);

    // 4. Stream back to device
    return audioResponse;
  }

  async stt(audio) {
    // Use Deepgram, Whisper, or AssemblyAI
    const response = await deepgram.transcribe(audio);
    return response.transcript;
  }

  async getAIResponse(text) {
    // Use OpenAI, Anthropic, or your custom AI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for seniors with Alzheimer\'s...' },
        { role: 'user', content: text }
      ]
    });
    return response.choices[0].message.content;
  }

  async tts(text) {
    // Use 11Labs, PlayHT, or similar
    const audio = await elevenLabs.textToSpeech({
      text,
      voice_id: 'voice-id-for-seniors',
      model_id: 'eleven_monolingual_v1'
    });
    return audio;
  }
}
```

**Pros:**
- ✅ Full control over AI logic
- ✅ Can add custom business logic (caregiver messages, reminders, etc.)
- ✅ No per-minute call costs
- ✅ Can optimize for Alzheimer's patients specifically
- ✅ Easy to add features (memory, context, tools)

**Cons:**
- ❌ More complex to build
- ❌ Need to manage STT, AI, and TTS separately
- ❌ Requires WebSocket infrastructure

**Cost:** ~$0.001-0.01 per conversation (much cheaper long-term)

---

### **Option 3: Hybrid Approach (11Labs + Backend)**

Keep 11Labs for voice, but route through your backend:

```
FM Radio → Backend → 11Labs Conversational AI → Backend → Radio
```

**How It Works:**

```typescript
// Backend acts as proxy and adds logic
class VoiceAIProxy {
  async handleConversation(deviceId) {
    // 1. Start 11Labs conversation
    const conversation = await elevenLabs.startConversation({
      agentId: 'your-agent-id'
    });

    // 2. Add middleware logic
    conversation.on('message', async (msg) => {
      // Check if caregiver sent a message
      const caregiverMsg = await this.checkCaregiverMessages(deviceId);
      if (caregiverMsg) {
        // Inject caregiver message into conversation
        conversation.inject(caregiverMsg);
      }

      // Log for analytics
      await this.logConversation(deviceId, msg);
    });

    return conversation;
  }
}
```

**Pros:**
- ✅ Best of both worlds
- ✅ 11Labs quality + your custom logic
- ✅ Can intercept and modify conversations
- ✅ Easy to add features

**Cons:**
- ❌ Still dependent on 11Labs
- ❌ More complex than direct 11Labs

---

## 🎯 **My Recommendation for Your Use Case**

### **Best Choice: Option 2 (Backend-Managed) OR Option 1 (Vapi-Style)**

**If you want to move fast and test quickly:**
→ **Use Option 1 (Vapi-Style Phone System)**
- You already know Vapi
- Quick to implement
- Easy to test
- Can switch later

**If you want the best long-term solution:**
→ **Use Option 2 (Backend-Managed Pipeline)**
- Full control for Alzheimer's-specific optimizations
- Much cheaper at scale
- Can add caregiver features easily
- Better for hardware integration

---

## 🛠️ Implementation Recommendation

### **Phase 1: Start with Vapi (Quick Win)**

```typescript
// FM Radio Code
class FMRadioVoiceController {
  async startVoice() {
    // Simple: Just dial your Vapi number
    await this.phoneDialer.call(process.env.VAPI_PHONE_NUMBER);
  }

  async stopVoice() {
    await this.phoneDialer.hangup();
  }
}
```

**Vapi Setup:**
1. Create Vapi account
2. Get a phone number
3. Configure your assistant (prompt, voice, etc.)
4. Test by calling from your phone
5. Integrate with FM radio

**Benefits:**
- Can test TODAY
- Iterate on prompts quickly
- Focus on hardware integration first
- Migrate to custom backend later

---

### **Phase 2: Migrate to Custom Backend (Scale)**

Once you've validated with Vapi, build your custom pipeline:

```typescript
// backend/src/services/voiceAI/pipeline.ts
export class VoiceAIPipeline {
  private deepgram: DeepgramClient;
  private openai: OpenAI;
  private elevenLabs: ElevenLabsClient;

  async processConversation(audioStream: AudioStream): AsyncGenerator<AudioChunk> {
    // 1. Real-time STT
    const transcriptStream = await this.deepgram.transcribeStream(audioStream);

    // 2. Stream to AI
    for await (const transcript of transcriptStream) {
      // 3. Get AI response
      const aiResponse = await this.getAIResponse(transcript);

      // 4. Convert to speech and stream back
      const audioChunk = await this.elevenLabs.streamTTS(aiResponse);

      yield audioChunk; // Stream to radio
    }
  }

  async getAIResponse(text: string): Promise<string> {
    // Custom logic for Alzheimer's care
    const context = await this.getUserContext();
    const caregiverMessages = await this.getCaregiverMessages();

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a compassionate AI assistant for seniors with Alzheimer's disease.

          Context:
          - Patient name: ${context.patientName}
          - Memory aids: ${context.memoryAids}
          - Caregiver messages: ${caregiverMessages}

          Guidelines:
          - Speak slowly and clearly
          - Be patient and repeat if needed
          - Provide reassurance
          - Help with daily reminders
          `
        },
        { role: 'user', content: text }
      ],
      stream: true
    });

    return response;
  }
}
```

---

## 📋 Detailed Implementation Plan

### **For Vapi Approach (Quick Start)**

```bash
# 1. Sign up for Vapi
https://vapi.ai

# 2. Create an assistant
{
  "name": "Cogito Senior Care Assistant",
  "voice": "elderly-friendly-voice",
  "model": {
    "provider": "openai",
    "model": "gpt-4",
    "systemPrompt": "You are a helpful assistant for seniors..."
  },
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-2"
  }
}

# 3. Get phone number
+1-XXX-XXX-XXXX (from Vapi dashboard)

# 4. Test
Call the number from your phone

# 5. Integrate with FM radio
Add phone dialing capability to radio hardware
```

**FM Radio Integration:**
```typescript
// Use Twilio Programmable Voice or similar
import { Device } from '@twilio/voice-sdk';

const device = new Device(twilioToken);

// When voice button pressed
device.connect({
  params: {
    To: process.env.VAPI_PHONE_NUMBER
  }
});

// Audio automatically routes through device speaker
```

---

### **For Custom Backend Approach**

**Required Services:**

| Service | Provider Options | Cost | Purpose |
|---------|-----------------|------|---------|
| STT | Deepgram, Whisper, AssemblyAI | $0.0043/min | Speech to text |
| AI | OpenAI GPT-4, Anthropic Claude | $0.03/1K tokens | Conversation logic |
| TTS | 11Labs, PlayHT, Azure | $0.30/1K chars | Text to speech |
| WebSocket | Your backend | Free | Real-time audio |

**Total cost per conversation:** ~$0.01-0.05 (vs $0.10-0.15 with Vapi)

**Implementation:**

```typescript
// backend/src/services/voiceAI/index.ts
import { Deepgram } from '@deepgram/sdk';
import OpenAI from 'openai';
import { ElevenLabsClient } from 'elevenlabs';

export class VoiceAIService {
  private deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private elevenLabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

  async handleVoiceSession(socket: Socket, deviceId: string) {
    const conversation = new ConversationManager(deviceId);

    socket.on('audioChunk', async (audioData) => {
      // 1. Transcribe
      const transcript = await this.deepgram.transcribe(audioData);

      // 2. Get AI response
      const aiText = await conversation.processMessage(transcript.text);

      // 3. Convert to speech
      const audioResponse = await this.elevenLabs.textToSpeech({
        text: aiText,
        voice_id: 'calm-elderly-voice'
      });

      // 4. Stream back
      socket.emit('audioResponse', audioResponse);
    });
  }
}
```

---

## 🎯 **RECOMMENDATION FOR YOU**

Based on your experience with Vapi and your goals:

### **Week 1-2: Start with Vapi**
- Set up Vapi assistant
- Get phone number
- Configure for senior care
- Test with real users

### **Week 3-4: Plan Custom Backend**
- Research STT/TTS providers
- Design conversation flow
- Build prototype pipeline

### **Month 2: Migrate to Custom**
- Build full backend pipeline
- Add caregiver messaging features
- Optimize for Alzheimer's care
- A/B test against Vapi

### **Month 3: Hardware Integration**
- Integrate with FM radio hardware
- Optimize for embedded device
- Add physical button controls
- Deploy to nursing homes

---

## 🔧 Tools & Services Comparison

| Feature | Vapi | Custom Backend | 11Labs Direct |
|---------|------|----------------|---------------|
| Setup Time | 1 hour | 1 week | 1 day |
| Cost per min | $0.10-0.15 | $0.01-0.05 | $0.05-0.08 |
| Customization | Medium | High | Low |
| Your Control | Low | Full | Low |
| Maintenance | Easy | Hard | Medium |
| **Best For** | Quick MVP | Production | Middle ground |

---

## 📞 **Answer to Your Question**

**"How should I interact with the AI without a phone number?"**

You have 3 options:

1. **Still use a phone number** (Vapi approach) - Radio dials out
2. **WebSocket/Internet** (Custom backend) - Radio connects via WiFi
3. **Hybrid** (11Labs + backend proxy) - Best of both

**My advice:** Start with Vapi since you know it, then migrate to custom backend once you've validated the concept with real users.

Want me to help you set up either approach?
