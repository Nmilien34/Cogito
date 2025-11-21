# Cogito WebApp

A web application designed to assist Alzheimer's patients with medication reminders and daily routines. This WebApp serves as a visual interface that works alongside the physical Cogito product.

## Features

- **Medication Reminders**: Schedule and receive reminders for medications
- **Voice Notifications**: Text-to-speech reminders for better accessibility
- **Visual Interface**: Large, clear interface designed for ease of use
- **Persistent Storage**: All schedules and history saved locally
- **Customizable Schedules**: Add multiple medication schedules with specific times and days
- **Snooze Functionality**: Snooze reminders for a few minutes if needed

## Project Structure

```
CogitoWebApp/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Stylesheet
├── js/
│   ├── app.js          # Main application controller
│   ├── medication.js   # Medication scheduling logic
│   └── storage.js      # Local storage management
├── server.py           # Python HTTP server script
├── start-server.bat    # Windows batch file to start server
├── start-server.ps1    # PowerShell script to start server
└── README.md           # This file
```

## Getting Started

### Option 1: Using a Local Server (Recommended)

**Using Python:**
```bash
cd CogitoWebApp
python server.py
```
Then open http://localhost:8000 in your browser

**Using Node.js:**
```bash
cd CogitoWebApp
npx http-server -p 8000 -o
```

**Using PowerShell (Windows):**
```powershell
cd CogitoWebApp
.\start-server.ps1
```

**Using Batch File (Windows):**
Double-click `start-server.bat` in the CogitoWebApp folder

### Option 2: Direct File Access

Simply open `index.html` directly in your web browser (double-click the file)

### Using the App

1. Click "Let's Get Started" on the welcome screen
2. Use "Settings" to add medication schedules
3. The app will automatically check for scheduled reminders

## Usage

### Adding Medication Schedules

1. Click "Settings" on the main screen
2. Click "+ Add Schedule"
3. Fill in:
   - Medication name
   - Time
   - Days of the week
4. Click "Save"

### Testing Reminders

- Click "Test Reminder" on the main screen to see a sample reminder

### Confirming Medication

- When a reminder appears, click "✓ I Took My Medicine" to confirm
- Or click "Remind Me in 5 Minutes" to snooze

## Technical Details

- **Storage**: Uses browser localStorage for persistence
- **Speech**: Uses Web Speech API for voice reminders
- **Scheduling**: Checks for reminders every minute
- **Responsive**: Works on desktop and tablet devices

## Future Integration Points

This WebApp is designed to integrate with:
- Physical Cogito device (via API/WebSocket)
- Backend server for cloud sync
- Vapi integration for voice interactions
- Family/caregiver dashboard

## Browser Compatibility

- Modern browsers with localStorage support
- Chrome/Edge recommended for best speech synthesis support

