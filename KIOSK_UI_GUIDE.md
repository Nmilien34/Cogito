# Cogito Kiosk UI - Design Guide

## 🎨 New Design Overview

Beautiful, minimal 7-inch kiosk interface - **no scrolling, everything fits on one screen!**

---

## Screen Layout (1024x600 - 7" Display)

```
┌─────────────────────────────────────────────────────┐
│ Header: Cogito Logo + Time/Date        [Compact]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│                  Main Content Area                  │
│              (Slides: Main/Radio/Reminders)         │
│                                                     │
│        Everything visible - NO SCROLLING!           │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Footer: Mode Indicator (Radio/AI)      [Minimal]   │
└─────────────────────────────────────────────────────┘
```

---

## Main Slide (Home Screen)

```
┌─────────────────────────────────┐
│      Cogito     │   3:45 PM     │
│   Smart Radio   │  Wed, Nov 27  │
├─────────────────────────────────┤
│                                 │
│          📻 / 🎤                │
│     "FM Radio Mode"             │
│     98.5 MHz - WBLS            │
│                                 │
│    ┌─────────────────────┐     │
│    │  🎤 Talk to Cogito  │     │  ← Medium-sized button
│    └─────────────────────┘     │
│                                 │
│    ┌──────┐      ┌──────┐      │
│    │ 📻   │      │ 💊   │      │
│    │Radio │      │Remind│      │  ← Quick access cards
│    └──────┘      └──────┘      │
│                                 │
├─────────────────────────────────┤
│  ● Voice AI Mode                │
└─────────────────────────────────┘
```

---

## Radio Slide

```
┌─────────────────────────────────┐
│ ← Back                          │
│                                 │
│           📻                    │
│        FM Radio                 │
│                                 │
│      98.5 MHz                   │
│        WBLS                     │
│                                 │
│      ┌──────────┐               │
│      │ Volume   │               │
│      │   75%    │               │
│      └──────────┘               │
│                                 │
└─────────────────────────────────┘
```

---

## Reminders Slide

```
┌─────────────────────────────────┐
│ ← Back                          │
│                                 │
│ 📅 Upcoming Reminders           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💊 Donepezil                │ │
│ │ Take with dinner            │ │
│ │ Today at 5:30 PM            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💊 Simvastatin              │ │
│ │ Morning medication          │ │
│ │ Tomorrow at 10:00 AM        │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

## Color Palette

### Background
- **Main:** `#FAFAF8` (Warm off-white paper)
- **Cards:** `rgba(255, 255, 255, 0.6)` (Semi-transparent white)
- **Overlay:** Subtle backdrop blur for depth

### Accents
- **Primary Button (Voice):** `#10B981` (Emerald green)
- **Stop Button:** `#EF4444` (Red)
- **Gold Accent:** `#F5C644` (Warm gold)
- **Text:** `#1F2937` (Dark gray)

### Effects
- Soft shadows (`shadow-lg`)
- Rounded corners (`rounded-2xl`)
- Smooth transitions (`duration-300`)
- Subtle hover effects (`hover:scale-105`)

---

## Typography

### Headers
- **App Name:** 2xl, bold (Cogito)
- **Time:** 2xl, bold
- **Mode Status:** xl, semibold
- **Slide Titles:** 3xl, bold

### Body
- **Descriptions:** sm/base
- **Metadata:** xs, gray-500

---

## Touch Targets

All interactive elements designed for **elderly users**:

### Button Sizes
- **Main Action (Voice):** `px-12 py-6` (Large, easy to press)
- **Quick Cards:** `p-4` (Medium touch target)
- **Back Button:** `px-4 py-2` (Smaller, but still accessible)

### Spacing
- Generous gaps (`gap-8` between major elements)
- Clear visual separation
- No cramped layouts

---

## Slide Navigation

Simple swipe/tap pattern:
```
Main Screen
   ↓ Tap Radio card
Radio Slide
   ↓ Tap Back
Main Screen
   ↓ Tap Reminders card
Reminders Slide
```

**No complex navigation - just forward/back!**

---

## Animations

Subtle, smooth transitions:
- **Button press:** Scale animation
- **Slide change:** Instant (no fancy transitions to confuse users)
- **Status changes:** Fade/pulse effects
- **Loading states:** Spinning indicator

---

## Accessibility Features

✅ **High contrast** - Dark text on light background
✅ **Large text** - Easy to read from distance
✅ **Big touch targets** - Easy for elderly users
✅ **Clear icons** - Emoji/symbols for quick recognition
✅ **Simple language** - No jargon
✅ **Status indicators** - Visual feedback for mode changes

---

## Routes

### Main Routes
- `/` - **Kiosk Dashboard** (Full screen, no nav)
- `/dashboard` - Full dashboard with all features
- `/settings` - Settings page
- `/admin` - Care insights

### Kiosk Mode Features
- Auto-hides navigation
- Full screen takeover
- Optimized for 1024x600 (7" display)
- Everything visible - no scrolling!

---

## Files Modified

### New Files
- `frontend/src/pages/KioskDashboard.tsx` - Main kiosk UI

### Modified Files
- `frontend/src/App.tsx` - Added kiosk route & layout wrapper
- `frontend/tailwind.config.js` - Added `paper` color
- `frontend/src/index.css` - Already had paper background!

---

## Build & Test

```bash
cd frontend
npm run build
npm run dev
```

Open `http://localhost:5174` to see the new kiosk UI!

---

## Demo Day Setup

1. **Build frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Run with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

3. **Launch kiosk:**
   ```bash
   ./start-kiosk.sh
   ```

4. **Result:**
   - Firefox opens in fullscreen
   - Loads `http://localhost:5174`
   - Shows beautiful kiosk UI
   - No scrolling, everything visible
   - Perfect for 7" touchscreen!

---

## Customization

### Change Button Size
Edit `KioskDashboard.tsx` line ~88:
```tsx
className="px-12 py-6"  // Make smaller: px-8 py-4
```

### Change Colors
Edit `tailwind.config.js`:
```js
paper: "#FAFAF8",  // Change background
accent: "#F5C644", // Change button colors
```

### Add More Slides
Add new slide type in `KioskDashboard.tsx`:
```tsx
const [currentSlide, setCurrentSlide] = useState<'main' | 'radio' | 'reminders' | 'newslide'>('main');
```

---

## Beautiful! Clean! Accessible! 🎉
