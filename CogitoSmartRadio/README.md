## Cogito Smart Radio Web App

Voice-first medication reminders, accessible radio controls, and caregiver analytics for Ruth’s profile. This monorepo contains a React (Vite + TypeScript) client and a Node/Express + Prisma server backed by SQLite (dev) or PostgreSQL (prod).

### Highlights
- Ruth-focused “Smart Radio” UI with large, high-contrast controls, accessibility time tracker, and voice-command reminder creation.
- Web Audio API ducking for the live radio stream plus playlist playback via YouTube embeds (with automatic videoId lookup when `YOUTUBE_API_KEY` is present) and fallback links.
- Reminder persistence, WebSocket pushes, Confirm/Snooze actions with acknowledgement latency logging, and service-worker notifications.
- Voice commands powered by the Web Speech API + chrono-node parsing natural phrases like “Remind me to take Donepezil at 9 AM every day.”
- Dev-only simulator to instantly trigger reminders for QA.
- Jest unit tests (voice parser + reminder ack helpers) and Cypress e2e coverage of voice creation & ducking UX.

---

## Repository layout
```
CogitoSmartRadio/
├─ client/                # React + Vite app
│  ├─ src/components      # Radio player, reminders, playlist, voice UI, admin charts
│  ├─ src/context         # Audio (Web Audio API) + reminder/socket providers
│  ├─ src/utils           # Voice parser + acknowledgement helpers (with Jest tests)
│  ├─ public/service-worker.js
│  ├─ cypress/            # E2E specs, fixtures, support
│  └─ vite/tailwind config
├─ server/                # Express API + Socket.IO + Prisma ORM
│  ├─ prisma/schema.prisma
│  ├─ prisma/seed.ts      # Ruth profile, medications, reminders, playlist
│  ├─ src/routes          # auth, profile, reminders, playlists, dev tools
│  ├─ src/services        # scheduler -> emits reminder_trigger events
│  └─ src/socket.ts       # reminder_trigger / reminder_ack wiring
└─ README.md (this file)
```

---

## Prerequisites
- Node.js 18+ (needed for Vite dev server & Prisma; tested on Node 20).
- npm 9+.
- SQLite (bundled) for local dev; configure `DATABASE_URL` for PostgreSQL in staging/prod.
- Modern browser supporting Web Audio + Web Speech APIs (Chrome recommended for voice input).

---

## Environment variables
Copy `server/env.sample` to `server/.env` and supply:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite path (`file:./dev.db`) or PostgreSQL connection string |
| `JWT_SECRET` | Used to sign API tokens |
| `RESIDENT_PASSWORD`, `CAREGIVER_PASSWORD` | Seed user passwords |
| `YOUTUBE_API_KEY` (optional) | Enables automatic YouTube videoId lookup for playlist items |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` (optional) | Placeholder for Spotify Web Playback integration (TODO) |

Client `.env` (create `client/.env` if overriding defaults):

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:4000/api` | Server REST endpoint |
| `VITE_SOCKET_URL` | `http://localhost:4000` | Socket.IO origin |
| `VITE_RADIO_STREAM_URL` | Public FIP stream | Override with facility-approved stream |
| `VITE_PROFILE_ID` | `ruth-profile` | Selects profile to load |

Places requiring third-party keys are annotated in code (e.g., `server/src/routes/playlists.ts` YouTube search helper, client playlist UI). The app gracefully falls back to opening a YouTube search results tab when keys aren’t configured.

**Obtaining keys**
- *YouTube Data API v3*: In Google Cloud Console create a project → enable YouTube Data API v3 → create an API key (HTTP referrer restricted) → set `YOUTUBE_API_KEY`.
- *Spotify Web Playback SDK* (TODO): Create a Spotify developer app → capture Client ID/Secret → configure redirect URIs → set `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` once playback is enabled.

---

## Setup & local development
1. **Install dependencies**
   ```bash
   cd CogitoSmartRadio/server
   npm install

   cd ../client
   npm install
   ```

2. **Seed database (SQLite by default)**
   ```bash
   cd CogitoSmartRadio/server
   npx prisma db push   # creates tables if needed
   npm run seed         # inserts Ruth, caregiver, meds, reminders, playlist
   ```

3. **Run backend + scheduler**
   ```bash
   cd CogitoSmartRadio/server
   npm run dev          # starts Express on http://localhost:4000
   ```

4. **Run frontend**
   ```bash
   cd CogitoSmartRadio/client
   npm run dev          # Vite on http://localhost:5173
   ```

5. **Login credentials (seed)**
   - Resident (Ruth): `ruth@cogito.local` / value of `RESIDENT_PASSWORD`
   - Caregiver: `caregiver@cogito.local` / value of `CAREGIVER_PASSWORD`

The client stores JWT tokens in `localStorage` (`csr_token`). Service workers register automatically to enable push-style notifications when reminders fire.

---

## Feature notes
- **Voice commands**: `src/hooks/useSpeechRecognition.ts` wraps Web Speech API; `parseVoiceCommand` uses chrono-node to detect times (“Add a reminder for 2 PM”, “Remind me to take Donepezil at 9 AM every day”). The parsed schedule is POSTed to `/api/reminders`.
- **Audio ducking**: `AudioProvider` builds a Web Audio `GainNode`. Reminder triggers call `duck()` to ramp down to ~20% and `restore()` on acknowledgement.
- **Reminder triggers**: Server scheduler (cron every minute) emits `reminder_trigger` via Socket.IO plus logs in `reminder_logs`. Client `ReminderProvider` listens, ducks audio, shows modal, records acknowledgement latency, and POSTs `/api/reminders/:id/ack` with `ack_time_ms` + `triggeredAt`.
- **Notifications**: Service worker (`public/service-worker.js`) shows persistent notifications, and the modal announces content via SpeechSynthesis for screen readers.
- **Dev simulator**: `DevSimulator` component (dev-only) calls `/api/reminders/:id/trigger` so QA can test ducking without waiting for schedules.
- **Playlist playback**: `PlaylistPanel` renders YouTube embeds when a `videoId` is available. When `YOUTUBE_API_KEY` is configured, the backend auto-populates missing videoIds (see `server/src/routes/playlists.ts`). Without it, users can open YouTube search results via “Play on Web”.

---

## Testing
| Scope | Command | Notes |
| --- | --- | --- |
| Unit (voice parser + reminder helpers) | `cd client && npm test` | Uses Jest + ts-jest |
| Watch mode | `npm run test:watch` |  |
| Cypress E2E | `cd client && npm run cy:open` (interactive) or `npm run cy:run` | Mocks API responses + Socket.IO to simulate voice creation and reminder ducking |
| Server integration | Covered via Cypress flows | Scheduler + sockets exercised through API stubs |

---

## Deployment
- **Frontend (Vercel)**: `npm run build` outputs to `client/dist`. Configure environment variables (`VITE_API_URL`, `VITE_SOCKET_URL`, etc.). Ensure service worker path `/service-worker.js` is copied.
- **Backend (Render/Heroku/Fly.io)**:
  1. Provision PostgreSQL (update `DATABASE_URL`).
  2. `npm install`, `npm run build`, `npm run prisma:migrate`, `npm run seed`.
  3. Expose port via `PORT`.
  4. Set `YOUTUBE_API_KEY`, `JWT_SECRET`, etc. Scheduler runs inside the same dyno (cron job).
- **Docker (optional)**: Add a Compose file if you need orchestrated deployments; current repo focuses on Vercel + Render but can be containerized (Node 20 + pnpm or npm).

---

## Security & HIPAA considerations
Medication/reminder data is PHI. This project includes guardrails but is **not** a full HIPAA compliance solution. Before going live:

1. **Transport security**: Terminate TLS/HTTPS on all traffic, including Socket.IO and media streams.
2. **Access control**: Integrate caregiver/admin auth flows with robust password policies, MFA, and proper session storage (JWT rotation, short-lived tokens).
3. **Encryption at rest**: Use PostgreSQL with TDE or application-layer encryption (e.g., envelope-encrypt `medications.instructions` before storing). Prisma middlewares are good injection points.
4. **Secrets management**: Store environment variables in a secrets manager (AWS Secrets Manager, Doppler, etc.).
5. **Audit logging**: Extend `reminder_logs` with IP/device metadata, and pipe logs to a HIPAA-compliant log store (Datadog Healthcare, Splunk HEC).
6. **Notifications**: Ensure browser/device policies allow PHI notifications or minimize message details.
7. **Hosting**: Choose HIPAA-eligible services (e.g., Render HIPAA, AWS HITRUST). Sign BAAs where required and consult compliance/legal teams.
8. **Data retention**: Implement retention policies + export tooling for PHI.

_(TODO)_ Spotify playback requires Premium credentials and user consent; integrate the Spotify Web Playback SDK only after obtaining client secrets and storing them securely.

---

## API quick reference
- `POST /api/auth/login` → `{ token, user }`
- `GET /api/profile/:id` / `PUT /api/profile/:id` (caregiver only)
- `GET /api/reminders?profileId=...`
- `POST /api/reminders` → create reminder from UI/voice
- `PUT /api/reminders/:id`
- `POST /api/reminders/:id/trigger` → dev/QA trigger
- `POST /api/reminders/:id/ack` → `{ action: 'confirm'|'snooze', snoozeMinutes?, ack_time_ms, triggeredAt }`
- `GET /api/playlists/:profileId` → returns playlist with enriched `videoId`s when available
- `POST /api/playlists/play` → logs playback history
- WebSocket events: `reminder_trigger` (server→client), `reminder_ack` (client→server; optional secondary channel for multi-device logging)

---

## Next steps & recommendations
- Hook up Spotify playback (behind a feature flag) once credentials are available.
- Add caregiver UI to edit medications/reminders inline and encrypt sensitive note fields.
- Add escalation logic (SMS/email/webhook) when reminders go unacknowledged.
- Expand Cypress suite to cover Confirm/Snooze flows end-to-end with mocked API responses.
- Add Docker Compose for turnkey local orchestration (Postgres + server + client + Cypress).

For any deployment storing PHI, coordinate with compliance to enable HIPAA-ready infrastructure and logging before going live.

