#!/usr/bin/env python
"""
Setup Guide - Complete walkthrough for emotion display
"""

print("""
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║      🎤 REAL-TIME EMOTION DETECTION - COMPLETE SETUP GUIDE           ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

THREE WAYS TO VIEW EMOTIONS:

┌────────────────────────────────────────────────────────────────────────┐
│ 1️⃣  TERMINAL DISPLAY (EASIEST & RECOMMENDED)                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Beautiful real-time display directly in your terminal!               │
│                                                                        │
│  ✅ Pros:                                                             │
│     • No browser needed                                               │
│     • Clear, beautiful visualization                                  │
│     • Fast and responsive                                             │
│     • Works on any machine                                            │
│                                                                        │
│  Command:                                                             │
│  $ python terminal_display.py                                         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 2️⃣  WEB DASHBOARD (MODERN & INTERACTIVE)                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Beautiful web interface with real-time WebSocket updates!            │
│                                                                        │
│  ✅ Pros:                                                             │
│     • Modern web UI with animations                                   │
│     • Can view from multiple windows                                  │
│     • Beautiful gradients and styling                                 │
│     • Professional dashboard look                                     │
│                                                                        │
│  Command:                                                             │
│  $ python dashboard.py                                                │
│                                                                        │
│  Then open: http://localhost:8001                                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 3️⃣  SIMPLE PYTHON SCRIPT (LIGHTWEIGHT)                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Lightweight Python script without display overhead                   │
│                                                                        │
│  ✅ Pros:                                                             │
│     • Very lightweight                                                │
│     • Direct API calls                                                │
│     • Minimal dependencies                                            │
│                                                                        │
│  Command:                                                             │
│  $ python realtime_emotion_sd.py                                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘


COMPLETE SETUP INSTRUCTIONS:

STEP 1: Start the Backend API (Terminal 1)
════════════════════════════════════════════════════════════════════════

  $ cd emotion-backend
  $ uvicorn app.server:app --host 0.0.0.0 --port 8000

  You should see:
  ✓ INFO:     Uvicorn running on http://0.0.0.0:8000


STEP 2: Start Emotion Display (Terminal 2)
════════════════════════════════════════════════════════════════════════

  RECOMMENDED - Terminal Display:
  ─────────────────────────────────
  $ cd emotion-backend
  $ python terminal_display.py

  OR - Web Dashboard:
  ──────────────────
  $ cd emotion-backend
  $ python dashboard.py
  Then open: http://localhost:8001 in your browser

  OR - Simple Script:
  ──────────────────
  $ cd emotion-backend
  $ python realtime_emotion_sd.py


STEP 3: Speak into Your Microphone
════════════════════════════════════════════════════════════════════════

  • The system automatically captures audio every 2 seconds
  • Emotions are displayed in real-time
  • Stop with Ctrl+C


FEATURES:
════════════════════════════════════════════════════════════════════════

✓ Real-time microphone input
✓ Automatic emotion detection (every 2 seconds)
✓ Visual emotion display with emoji
✓ Confidence scores and probability breakdown
✓ No file recording needed - everything in memory
✓ Multiple emotion detection (angry, happy, sad, neutral, fear, disgust, surprise)
✓ AI responses based on detected emotion
✓ Beautiful terminal or web visualization


EMOTION CODES & EMOJIS:
════════════════════════════════════════════════════════════════════════

  ANG → ANGRY 😠
  HAP → HAPPY 😊
  SAD → SAD 😢
  NEU → NEUTRAL 😐
  FEAR → FEAR 😨
  DIS → DISGUST 🤢
  SUR → SURPRISE 😲


TROUBLESHOOTING:
════════════════════════════════════════════════════════════════════════

❌ Backend API not running:
   → Make sure port 8000 is not in use
   → Start it with: uvicorn app.server:app --host 0.0.0.0 --port 8000

❌ Microphone not found:
   → Check available devices shown in the script output
   → Make sure microphone is connected and enabled

❌ Errors connecting to API:
   → Verify backend is running
   → Check: curl http://localhost:8000/health

❌ No audio captured:
   → Try a different microphone device (see device list in output)
   → Check Windows microphone permissions


FILES CREATED:
════════════════════════════════════════════════════════════════════════

terminal_display.py     - Terminal-based real-time display (RECOMMENDED)
dashboard.py            - Web-based dashboard with WebSocket
realtime_emotion_sd.py  - Simple Python script using SoundDevice
realtime_emotion.py     - Alternative using PyAudio
launch_realtime.py      - Interactive launcher script
quickstart.py           - Verification and setup checker


API ENDPOINTS:
════════════════════════════════════════════════════════════════════════

GET  http://localhost:8000/health
     → Returns: {"status": "ok", "model": "...", "device": "cpu/gpu"}

POST http://localhost:8000/predict
     → Send WAV file, get emotion detection result


NEXT STEPS:
════════════════════════════════════════════════════════════════════════

1. Open two terminals
2. Terminal 1: Start backend with uvicorn
3. Terminal 2: Start display with python terminal_display.py
4. Speak into your microphone and watch emotions appear!


For questions or issues, check the README files in the emotion-backend directory.

═══════════════════════════════════════════════════════════════════════════════

                    🎉 You're all set! Ready to detect emotions!

═══════════════════════════════════════════════════════════════════════════════
""")
