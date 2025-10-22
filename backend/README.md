# Cogito Backend API

Backend server for the Cogito Voice AI Radio application.

## Tech Stack

- **Node.js** + **TypeScript**
- **Express.js** - REST API framework
- **Socket.io** - Real-time WebSocket communication
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **Twilio** - SMS/Phone verification
- **SendGrid/SMTP** - Email service
- **Google OAuth 2.0** - Social authentication

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # MongoDB connection
│   │   └── env.ts       # Environment variables
│   ├── controllers/     # Request handlers
│   │   ├── authController.ts
│   │   └── conversationController.ts
│   ├── middleware/      # Express middleware
│   │   └── auth.ts      # JWT authentication
│   ├── models/          # Mongoose models
│   │   ├── User.ts
│   │   ├── OTP.ts
│   │   └── Conversation.ts
│   ├── routes/          # API routes
│   │   ├── authRoutes.ts
│   │   └── conversationRoutes.ts
│   ├── services/        # Business logic
│   │   ├── emailService.ts
│   │   ├── smsService.ts
│   │   └── socketService.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── jwt.ts
│   │   └── otp.ts
│   └── index.ts         # Main entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up MongoDB

You can either:

- **Install MongoDB locally**: [Download MongoDB](https://www.mongodb.com/try/download/community)
- **Use MongoDB Atlas** (cloud): [Create free cluster](https://www.mongodb.com/cloud/atlas/register)

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure your settings:

```env
# Required
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cogito
JWT_SECRET=your-random-secret-key-here
JWT_REFRESH_SECRET=your-random-refresh-key-here

# Optional but recommended
GOOGLE_CLIENT_ID=your-google-client-id
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Run the Server

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

The server will start at `http://localhost:3000`

## API Endpoints

### Authentication

#### Email Authentication
- `POST /api/auth/email/send-code` - Send OTP to email
  ```json
  { "email": "user@example.com" }
  ```

- `POST /api/auth/email/verify-code` - Verify email OTP
  ```json
  { "email": "user@example.com", "otp": "123456" }
  ```

#### Google OAuth
- `POST /api/auth/google/verify` - Verify Google token
  ```json
  { "token": "google-id-token", "clientType": "expo" }
  ```

#### Phone Verification (requires auth)
- `POST /api/auth/phone/send-otp` - Send OTP to phone
  ```json
  { "phoneNumber": "+1234567890" }
  ```

- `POST /api/auth/phone/verify-otp` - Verify phone OTP
  ```json
  { "phoneNumber": "+1234567890", "otp": "123456" }
  ```

#### User Onboarding
- `POST /api/auth/set-names-and-terms` - Set user info
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "termsAccepted": true
  }
  ```

#### Token Management
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Conversations

All conversation endpoints require authentication (`Authorization: Bearer <token>`).

- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get specific conversation
- `DELETE /api/conversations/:id` - Delete conversation
- `POST /api/conversations/:id/stream/start` - Start conversation stream
- `POST /api/conversations/:id/threads/:threadId/stream/start` - Start thread stream

### WebSocket Events

Connect with Socket.io:
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});
```

**Emit Events:**
- `startVoiceSession` - Start voice conversation
  ```javascript
  socket.emit('startVoiceSession', {
    voiceModel: 'default',
    streamingMode: true
  });
  ```

- `sendAudio` - Send audio data
  ```javascript
  socket.emit('sendAudio', {
    voiceConversationId: 'conversation-id',
    audio: 'base64-audio-data'
  });
  ```

- `stopVoiceSession` - Stop voice session
  ```javascript
  socket.emit('stopVoiceSession', 'session-id');
  ```

**Listen to Events:**
- `VOICE_SESSION_STARTED` - Session started successfully
- `VOICE_SESSION_STOPPED` - Session stopped
- `event` - General events
- `error` - Error messages

## Database Models

### User
- email, password (hashed)
- firstName, lastName, avatar
- phoneNumber, phoneVerified
- authType (GOOGLE | EMAIL)
- googleId
- termsAccepted
- subscription (plan, stripeCustomerId, etc.)
- settings (theme, font, language)
- refreshToken

### OTP
- email / phoneNumber
- otp (6-digit code)
- expiresAt (10 minutes)
- attempts (max 5)

### Conversation
- userId (ref to User)
- title
- messages (array of { role, content, timestamp })
- model, style, voiceModel
- isVoiceConversation
- active

## Development

### Generate JWT Secrets

```bash
# In Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Testing Endpoints

Use the included health check:
```bash
curl http://localhost:3000/health
```

### MongoDB GUI Tools

- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [Studio 3T](https://studio3t.com/)

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Enable HTTPS
4. Set up proper CORS origins
5. Use environment-specific MongoDB URI
6. Set up monitoring and logging
7. Use a process manager (PM2)

```bash
npm install -g pm2
pm2 start dist/index.js --name cogito-backend
```

## TODO / Future Enhancements

- [ ] Implement actual AI streaming (OpenAI, Anthropic, etc.)
- [ ] Integrate 11Labs for voice AI processing
- [ ] Add rate limiting
- [ ] Add request validation middleware
- [ ] Add comprehensive error handling
- [ ] Add unit and integration tests
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add Redis for session management
- [ ] Add background job processing (Bull/BullMQ)
- [ ] Add file upload support (S3/Cloud Storage)
- [ ] Add analytics and metrics

## License

MIT
