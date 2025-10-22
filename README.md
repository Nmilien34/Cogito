# Cogito - Voice AI Radio

A voice-first AI radio powered by advanced AI technology. This project consists of a React Native mobile application (frontend) and a Node.js/Express API server (backend).

## Project Structure

```
cogito/
├── frontend/          # React Native + Expo mobile app
│   ├── app/           # Expo Router screens
│   ├── src/           # Application source code
│   ├── android/       # Android native code
│   ├── ios/           # iOS native code
│   └── package.json
│
├── backend/           # Node.js + Express API server
│   ├── src/           # Backend source code
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   └── package.json
│
└── README.md          # This file
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or Atlas cloud)
- **iOS**: Xcode and macOS (for iOS development)
- **Android**: Android Studio
- **Expo CLI**: `npm install -g expo-cli`

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

The backend will run at `http://localhost:3000`

See [backend/README.md](./backend/README.md) for detailed backend documentation.

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL and API keys
   ```

4. Start the app:
   ```bash
   npx expo start
   ```

   Then press:
   - `i` for iOS simulator
   - `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## Features

### Current Features
- ✅ Email authentication with OTP
- ✅ Google OAuth integration
- ✅ Phone number verification
- ✅ User onboarding flow
- ✅ JWT-based authentication
- ✅ Real-time voice streaming (WebSocket)
- ✅ Conversation management
- ✅ User profile and settings

### Planned Features (Voice AI Radio)
- 🎙️ Voice-controlled AI radio stations
- 🎵 AI-generated music and content
- 🗣️ Natural voice conversations with AI
- 📻 Personalized radio experiences
- 🎧 Multi-language support
- ⭐ Favorites and playlists

## Tech Stack

### Frontend
- React Native 0.76
- Expo 52
- TypeScript
- Socket.io Client
- 11Labs Voice SDK
- Google Sign-In
- TailwindCSS (NativeWind)

### Backend
- Node.js + TypeScript
- Express.js
- MongoDB + Mongoose
- Socket.io
- JWT Authentication
- Twilio (SMS)
- SendGrid/SMTP (Email)
- Google OAuth 2.0

## API Documentation

### Base URL
Development: `http://localhost:3000`

### Authentication Endpoints
- `POST /api/auth/email/send-code`
- `POST /api/auth/email/verify-code`
- `POST /api/auth/google/verify`
- `POST /api/auth/phone/send-otp`
- `POST /api/auth/phone/verify-otp`
- `POST /api/auth/set-names-and-terms`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Conversation Endpoints
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `POST /api/conversations/:id/stream/start`
- `DELETE /api/conversations/:id`

### WebSocket Events
- `startVoiceSession`
- `sendAudio`
- `stopVoiceSession`

See [backend/README.md](./backend/README.md) for complete API documentation.

## Development Workflow

1. **Start Backend**:
   ```bash
   cd backend && npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend && npx expo start
   ```

3. **Make Changes**: Edit code in either frontend or backend

4. **Test**: Test on iOS simulator, Android emulator, or physical device

## Environment Variables

### Backend (.env)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cogito
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
TWILIO_ACCOUNT_SID=your-twilio-sid
SENDGRID_API_KEY=your-sendgrid-key
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Backend Issues
- **MongoDB connection failed**: Make sure MongoDB is running
- **Email/SMS not working**: Check your SendGrid/Twilio credentials
- **Port already in use**: Change PORT in .env

### Frontend Issues
- **Metro bundler error**: Clear cache with `npx expo start -c`
- **iOS build fails**: Run `cd ios && pod install`
- **Android build fails**: Clean build with `cd android && ./gradlew clean`

## License

MIT

## Contact

For questions or support, please open an issue on GitHub.

---

**Senior Project - Voice AI Radio**
Built with ❤️ using React Native and Node.js
