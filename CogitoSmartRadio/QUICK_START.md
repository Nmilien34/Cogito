# Quick Start Guide - Running the Cogito Smart Radio App

## Step-by-Step Instructions

### 1. Install Dependencies (First Time Only)

Open **two separate terminal windows** (or PowerShell windows):

**Terminal 1 - Backend:**
```powershell
cd CogitoSmartRadio\server
npm install
```

**Terminal 2 - Frontend:**
```powershell
cd CogitoSmartRadio\client
npm install
```

### 2. Setup Environment Variables (First Time Only)

**Backend:**
```powershell
cd CogitoSmartRadio\server
copy env.sample .env
```

Then edit `server\.env` and set:
```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=your-secret-key-here
RESIDENT_PASSWORD=ChangeMeResident123
CAREGIVER_PASSWORD=ChangeMeCaregiver123
```

### 3. Setup Database (First Time Only)

```powershell
cd CogitoSmartRadio\server
npx prisma db push
npm run seed
```

This creates the database and adds Ruth's profile, medications, and reminders.

### 4. Start the Backend Server

**Terminal 1:**
```powershell
cd CogitoSmartRadio\server
npm run dev
```

You should see: `Server listening on port 4000`

### 5. Start the Frontend (React App)

**Terminal 2:**
```powershell
cd CogitoSmartRadio\client
npm run dev
```

You should see something like:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 6. Open in Browser

Open your web browser and go to:
```
http://localhost:5173
```

**Note:** The frontend runs on port **5173** (not 8080). The backend API runs on port **4000**.

---

## Quick Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend (React) | 5173 | http://localhost:5173 |
| Backend API | 4000 | http://localhost:4000/api |
| WebSocket | 4000 | http://localhost:4000 |

---

## Troubleshooting

**"Cannot find module" errors:**
- Make sure you ran `npm install` in both `server` and `client` folders

**"Port already in use" errors:**
- Close other applications using ports 4000 or 5173
- Or change the ports in the config files

**Database errors:**
- Make sure you ran `npx prisma db push` and `npm run seed`

**Can't connect to backend:**
- Make sure the backend server is running in Terminal 1
- Check that port 4000 is not blocked by firewall

---

## Default Login (for future auth features)

- **Resident:** ruth@cogito.local / (password from .env)
- **Caregiver:** caregiver@cogito.local / (password from .env)

---

## What You'll See

1. **Ruth View** - Main dashboard with radio player, reminders, voice commands
2. **Settings** - Edit medications and reminders (NEW!)
3. **Care Insights** - Analytics and metrics

The app will automatically load Ruth's profile with pre-seeded medications and reminders.

