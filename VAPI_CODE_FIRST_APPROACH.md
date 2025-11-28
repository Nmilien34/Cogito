# Vapi Code-First Approach 🚀

## Philosophy: Configuration as Code

**Everything in code. Minimal dashboard work.**

The Vapi dashboard is only used for:
1. ✅ Creating the assistant (one-time) → Get Assistant ID
2. ✅ Getting your Public Key
3. ❌ That's it!

Everything else (prompt, temperature, model, voice, behavior) is managed in **YOUR code**.

---

## How It Works

### Traditional Approach (Dashboard-Heavy) ❌
```
Configure everything in Vapi Dashboard
  ↓
Use assistant ID in code
  ↓
Hard to version control
Hard to test different configurations
Hard to customize per-user
```

### Code-First Approach (Our Way) ✅
```
Minimal dashboard setup
  ↓
Everything configured in code
  ↓
Easy version control
Easy A/B testing
Easy per-user customization
```

---

## File Structure

```
frontend/src/
├── config/
│   └── vapiConfig.ts          ← ALL assistant configuration here!
└── services/
    └── VapiService.ts         ← Uses config to start conversations
```

---

## Configuration File: `vapiConfig.ts`

This file contains **everything**:

### Main Configuration Function

```typescript
export const generateAssistantConfig = (currentTime: string) => {
  return {
    // Model settings
    model: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',  // Change to gpt-4 here
      temperature: 0.7,         // Change creativity here
      maxTokens: 500,          // Change response length here

      messages: [{
        role: 'system',
        content: `Your full system prompt here...` // Change prompt here
      }]
    },

    // Voice settings
    voice: {
      provider: '11labs',
      voiceId: 'your-voice-id'  // Change voice here
    },

    // Behavior settings
    firstMessage: "Hello!",            // Change greeting here
    silenceTimeoutSeconds: 30,         // Change timeout here
    recordingEnabled: false,           // Change recording here
  };
};
```

### What You Can Control

**Model Settings:**
- `model` - Which GPT model to use (gpt-3.5-turbo, gpt-4, etc.)
- `temperature` - 0.0 (precise) to 1.0 (creative)
- `maxTokens` - Max response length
- `messages` - System prompt (the AI's instructions)

**Voice Settings:**
- `provider` - Voice provider (11labs, deepgram, playht, etc.)
- `voiceId` - Specific voice to use

**Behavior:**
- `firstMessage` - What AI says when call starts
- `silenceTimeoutSeconds` - How long to wait before ending call
- `recordingEnabled` - Whether to record conversations
- `endCallOnSilence` - Auto-end after silence

**Variables:**
- `variableValues` - Dynamic values like current_time, user_name, etc.

---

## Multiple Configurations

We've created several pre-built configs:

### 1. Contextual (Default)
```typescript
getContextualConfig(currentTime)
```
- Greeting changes based on time of day
- "Good morning!" / "Good afternoon!" / "Good evening!"

### 2. Quick Conversations
```typescript
getQuickAssistantConfig(currentTime)
```
- Shorter responses
- Lower temperature (more focused)
- Faster timeout

### 3. Detailed Conversations
```typescript
getDetailedAssistantConfig(currentTime)
```
- Longer responses
- Higher temperature (more creative)
- Longer timeout

### 4. Emergency Mode
```typescript
getEmergencyAssistantConfig(currentTime)
```
- Emergency-specific prompt
- Never auto-ends
- Clear, calm instructions

---

## How to Customize

### Change the System Prompt

Edit `frontend/src/config/vapiConfig.ts`:

```typescript
messages: [{
  role: 'system',
  content: `CURRENT TIME: ${currentTime}

You are [YOUR CUSTOM PERSONALITY HERE].

Your rules:
- Rule 1
- Rule 2
- Rule 3

When asked about time, use CURRENT TIME above.`
}]
```

### Change Temperature

```typescript
model: {
  temperature: 0.5,  // More focused (0.0 - 1.0)
}
```

### Change Model

```typescript
model: {
  model: 'gpt-4',  // or 'gpt-3.5-turbo', 'gpt-4-turbo', etc.
}
```

### Change Voice

```typescript
voice: {
  provider: '11labs',
  voiceId: 'pNInz6obpgDQGcFmaJgB'  // Rachel voice example
}
```

### Change Greeting

```typescript
firstMessage: "Hey there! What's up?"
```

### Change Timeout

```typescript
silenceTimeoutSeconds: 60,  // Wait 60 seconds before ending
```

---

## Dynamic Configuration Based on Context

You can change configuration based on:
- Time of day
- User identity
- Previous conversation history
- Device state
- Anything!

**Example: Different prompts for different times**

```typescript
export const getSmartConfig = (currentTime: string) => {
  const hour = new Date().getHours();
  const config = generateAssistantConfig(currentTime);

  if (hour >= 22 || hour < 6) {
    // Night time - quieter, calmer
    config.model!.temperature = 0.5;
    config.firstMessage = "Hello. Speaking quietly since it's late.";
  } else if (hour >= 6 && hour < 12) {
    // Morning - energetic
    config.model!.temperature = 0.8;
    config.firstMessage = "Good morning! How can I help?";
  }

  return config;
};
```

**Example: Different configs per user**

```typescript
export const getUserConfig = (userId: string, currentTime: string) => {
  const userPreferences = getUserPreferences(userId);

  return {
    model: {
      temperature: userPreferences.chattiness, // 0.5 or 0.8
      maxTokens: userPreferences.verbosity,    // 200 or 500
      // ...
    },
    firstMessage: `Hi ${userPreferences.name}!`
  };
};
```

---

## Testing Different Configurations

### A/B Testing

```typescript
// Randomly choose config for testing
const configs = [
  getQuickAssistantConfig,
  getDetailedAssistantConfig
];

const randomConfig = configs[Math.floor(Math.random() * configs.length)];
const assistantConfig = randomConfig(timeContext);
```

### Feature Flags

```typescript
const assistantConfig = ENABLE_DETAILED_MODE
  ? getDetailedAssistantConfig(timeContext)
  : getQuickAssistantConfig(timeContext);
```

---

## Vapi Dashboard Setup (One-Time Only)

### Step 1: Create Assistant
1. Go to Vapi Dashboard
2. Create new assistant
3. **Copy the Assistant ID**
4. Paste in `frontend/.env`:
   ```
   VITE_VAPI_ASSISTANT_ID=your-assistant-id-here
   ```

### Step 2: Get Public Key
1. Go to Vapi Dashboard → Settings
2. **Copy your Public Key**
3. Paste in `frontend/.env`:
   ```
   VITE_VAPI_PUBLIC_KEY=your-public-key-here
   ```

### Step 3: Done!
**That's it!** Everything else is in code.

The dashboard configuration doesn't matter because we override everything programmatically.

---

## Benefits

✅ **Version Control**: All configs in git
✅ **Easy Testing**: Change configs without touching dashboard
✅ **Per-User Customization**: Different configs for different users
✅ **A/B Testing**: Test multiple prompts easily
✅ **Environment-Specific**: Dev/staging/prod can have different configs
✅ **Code Review**: Team can review prompt changes
✅ **Rollback**: Git revert if something breaks
✅ **Documentation**: Comments explain why configs exist

---

## Advanced: Backend-Controlled Configuration

Want the backend to control configurations? Easy!

### Backend API Endpoint

```typescript
// backend/src/routes/vapiRoutes.ts
router.get('/assistant-config', (req, res) => {
  const { userId, deviceId } = req.query;

  // Get user preferences from database
  const user = getUserById(userId);

  const config = {
    model: {
      temperature: user.preferences.temperature,
      messages: [{
        role: 'system',
        content: generatePersonalizedPrompt(user)
      }]
    },
    firstMessage: `Hi ${user.name}!`
  };

  res.json(config);
});
```

### Frontend Fetches Config

```typescript
// In VapiService.ts startConversation()
const response = await fetch(`${BACKEND_URL}/api/vapi/assistant-config?userId=${userId}`);
const assistantConfig = await response.json();

const startResult = this.vapi.start(this.assistantId, assistantConfig);
```

Now your backend controls everything!

---

## Summary

**Vapi Dashboard:**
- Assistant ID ✅
- Public Key ✅
- *That's it!*

**Your Code:**
- System prompt ✅
- Temperature ✅
- Model ✅
- Voice ✅
- Behavior ✅
- Everything else ✅

**Location:**
- `frontend/src/config/vapiConfig.ts` - Main config file
- `frontend/src/services/VapiService.ts` - Uses the config

**To Change Anything:**
1. Edit `vapiConfig.ts`
2. Rebuild frontend
3. Test!

No dashboard needed! 🎉
