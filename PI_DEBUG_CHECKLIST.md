# Pi Debugging Checklist - Backend Connection Issues

## Step 1: Verify Backend is Running on Pi

**On the Pi, check if backend is running:**
```bash
# Check if port 4000 (or 3000) is in use
sudo netstat -tulpn | grep -E ":(3000|4000)"

# Or check processes
ps aux | grep node
```

**Expected:** You should see a Node.js process running the backend.

**If not running, start it:**
```bash
cd ~/Desktop/Cogito/backend
npm run dev
```

**Check the output** - it should say:
```
🚀 Cogito Backend Server Running
🔌 Port: 4000  (or 3000)
```

---

## Step 2: Check What Port Backend is Using

**The backend might be using port 3000, not 4000!**

Check the backend's `.env` file:
```bash
cd ~/Desktop/Cogito/backend
cat .env | grep PORT
```

**If it says `PORT=3000`, you have two options:**

### Option A: Change backend to use port 4000
```bash
# In backend/.env
PORT=4000
```

### Option B: Change frontend to use port 3000
```bash
# In frontend/.env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## Step 3: Test Backend Connection

**On the Pi, test if backend is accessible:**
```bash
# Try port 4000
curl http://localhost:4000/health

# Or try port 3000
curl http://localhost:3000/health
```

**Expected:** You should get a JSON response like:
```json
{"status":"ok","timestamp":"..."}
```

**If you get "Connection refused":**
- Backend is not running
- Backend is on a different port
- Backend crashed

---

## Step 4: Check Frontend .env File

**On the Pi:**
```bash
cd ~/Desktop/Cogito/frontend
cat .env
```

**Make sure it has:**
```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

**OR if backend is on port 3000:**
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## Step 5: Restart Frontend After .env Changes

**Vite doesn't automatically reload .env changes!**

```bash
# Stop the frontend (Ctrl+C)
# Then restart it
cd ~/Desktop/Cogito/frontend
npm run dev
```

---

## Step 6: Check Browser Console

**Open Chromium on Pi and check the console:**

Look for errors like:
- `Failed to fetch`
- `Connection refused`
- `CORS policy`

**Check the Network tab:**
- Filter by "WS" (WebSocket)
- Look for failed connections to `localhost:4000` or `localhost:3000`

---

## Step 7: Check CORS Configuration

**The backend needs to allow requests from `http://localhost:5173`**

Check `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3001
```

**Or in `backend/src/config/env.ts`, the default is:**
```typescript
corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8081',
```

**Fix:** Update backend `.env`:
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3001,http://localhost:4000
```

**Then restart the backend!**

---

## Step 8: Check MongoDB Connection

**The backend needs MongoDB to start!**

**On the Pi, check if MongoDB is running:**
```bash
# Check if MongoDB is installed
which mongod

# Check if it's running
sudo systemctl status mongodb
# OR
ps aux | grep mongod
```

**If MongoDB is not running:**
```bash
# Start MongoDB
sudo systemctl start mongodb
# OR
mongod --dbpath ~/data/db
```

**If MongoDB is not installed:**
- You can use MongoDB Atlas (cloud) instead
- Or install MongoDB on the Pi

---

## Quick Test Commands

**Run these on the Pi to diagnose:**

```bash
# 1. Check if backend is running
curl http://localhost:4000/health || curl http://localhost:3000/health

# 2. Check what's listening on ports
sudo lsof -i :4000
sudo lsof -i :3000

# 3. Check frontend .env
cat ~/Desktop/Cogito/frontend/.env | grep VITE

# 4. Check backend .env
cat ~/Desktop/Cogito/backend/.env | grep -E "PORT|CORS"
```

---

## Common Issues

### Issue: "Connection refused"
- **Cause:** Backend not running or wrong port
- **Fix:** Start backend and verify port

### Issue: "CORS policy error"
- **Cause:** Backend CORS not configured for frontend URL
- **Fix:** Update `CORS_ORIGIN` in backend `.env`

### Issue: "Failed to fetch"
- **Cause:** Backend crashed, MongoDB not connected, or wrong URL
- **Fix:** Check backend logs, verify MongoDB, check `.env` URLs

### Issue: Frontend still shows old errors
- **Cause:** Frontend not restarted after `.env` changes
- **Fix:** Restart frontend (`npm run dev`)

---

## Still Not Working?

**Share these outputs:**

1. Backend startup logs (from `npm run dev`)
2. Frontend console errors (from browser)
3. Output of `curl http://localhost:4000/health` (or port 3000)
4. Contents of `frontend/.env`
5. Contents of `backend/.env` (hide secrets!)

