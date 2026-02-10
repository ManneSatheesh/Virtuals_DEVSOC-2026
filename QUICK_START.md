# Quick Start Guide - AI Interaction Feature

## ✅ Setup Complete!

Python and Node.js dependencies are now installed. You're ready to run the application!

## Important Note: Use `py` instead of `python`

On your Windows system, Python is accessed via the `py` command (Python Launcher), not `python`.

## Running the Application

### Option 1: Quick Start (Recommended)

Open **3 separate PowerShell terminals**:

#### Terminal 1: Python Agent
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
.\start_agent.bat
```
Wait for: `INFO:livekit.agents:registered worker ...`

#### Terminal 2: API Server
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
.\start_server.bat
```
Wait for: `🚀 Phone Call Backend API running on http://localhost:3002`

#### Terminal 3: Frontend
```powershell
cd "c:\vs code\Assistant\frontend"
npm run dev
```

### Option 2: Manual Start

If you prefer manual control:

#### Terminal 1: Python Agent
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
.\venv\Scripts\Activate.ps1
py agent.py start
```

#### Terminal 2: API Server
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
npm start
```

#### Terminal 3: Frontend
```powershell
cd "c:\vs code\Assistant\frontend"
npm run dev
```

## Before You Start

### 1. Configure Environment Variables

You need to create a `.env` file in `phone-call-backend/` with your credentials:

```powershell
cd "c:\vs code\Assistant\phone-call-backend"
cp .env.example .env
notepad .env
```

Copy the credentials from your existing LiveKit-Vobiz setup:
```
C:\Users\manne\Downloads\DevSOC\LiveKit-Vobiz-Outbound\.env
```

Required variables:
```env
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
GOOGLE_API_KEY=...
DEEPGRAM_API_KEY=...
VOBIZ_SIP_DOMAIN=...
VOBIZ_USERNAME=...
VOBIZ_PASSWORD=...
VOBIZ_OUTBOUND_NUMBER=+91...
OUTBOUND_TRUNK_ID=ST_...
```

### 2. Add Frontend Environment Variable

Edit `frontend/.env` or `frontend/.env.local`:
```env
VITE_PHONE_API_URL=http://localhost:3002
```

## Access the Application

Once all 3 services are running:

1. Open browser: `http://localhost:5173/ai-interaction`
2. You'll see two tabs: **Dev Mode** and **Phone Call**

### Using Dev Mode
1. Click "Dev Mode" tab
2. Click the microphone button
3. Allow browser microphone access
4. Start speaking!

### Using Phone Call Mode
1. Click "Phone Call" tab
2. Select country code (default: +91)
3. Enter your phone number
4. Click "Call Me"
5. Answer your phone when it rings!

## Troubleshooting

### Python Issues
- ✅ **SOLVED**: Use `py` instead of `python`
- If `py` doesn't work, check: `py --version`

### PowerShell Script Execution
If you get "script execution disabled" error:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Missing .env File
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
cp .env.example .env
# Then edit .env with your credentials
```

### Port Already in Use
- Port 3001: Token server (for Dev Mode)
- Port 3002: Phone API server
- Port 5173: Frontend dev server

If any port is busy, stop the conflicting process.

## Testing

### Test Dev Mode
1. Go to `/ai-interaction`
2. Click "Dev Mode"
3. Click microphone
4. Say "Hello"
5. AI should respond

### Test Phone Call Mode
1. Go to `/ai-interaction`
2. Click "Phone Call"
3. Enter your number: e.g., `9876543210` (with country code +91)
4. Click "Call Me"
5. Your phone should ring
6. Answer and talk to the AI!

## What's Running?

When all 3 terminals are active:

```
Terminal 1: Python Agent (agent.py)
  ↓
  Listens for LiveKit dispatch jobs
  Handles outbound phone calls via Vobiz SIP

Terminal 2: Node.js API (server.js)
  ↓
  REST API on port 3002
  Triggers calls via make_call.py

Terminal 3: React Frontend
  ↓
  Dev server on port 5173
  UI for Dev Mode and Phone Call Mode
```

## Next Steps

1. ✅ Configure `.env` file with your credentials
2. ✅ Start all 3 services
3. ✅ Test Dev Mode
4. ✅ Test Phone Call Mode
5. 🎉 Enjoy your AI interaction feature!

## Need Help?

- Check `AI_INTERACTION_SETUP.md` for detailed setup
- Check `IMPLEMENTATION_SUMMARY.md` for technical details
- Check `phone-call-backend/README.md` for API docs

---

**You're all set!** 🚀

The hardest part (Python setup) is done. Now just configure your `.env` file and start the services!
