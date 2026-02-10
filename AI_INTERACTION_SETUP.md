# AI Interaction Feature - Setup Guide

This guide will help you set up the new AI Interaction page with both Dev Mode (web-based) and Phone Call Mode.

## What's New

You now have a unified AI interaction page (`/ai-interaction`) with two modes:

1. **Dev Mode**: Web-based voice interaction through your browser (uses existing LiveKit setup)
2. **Phone Call Mode**: AI assistant calls your phone number for voice interaction

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  - AIInteraction.jsx (mode switcher)                        │
│  - DevInteractionMode.jsx (web voice)                       │
│  - PhoneCallMode.jsx (phone calls)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─ Dev Mode → Token Server (port 3001)
                              │              → LiveKit Room
                              │
                              └─ Phone Mode → Phone API (port 3002)
                                              → make_call.py
                                              → LiveKit Dispatch
                                              → agent.py (Python worker)
                                              → Vobiz SIP Trunk
                                              → User's Phone
```

## Prerequisites

### For Dev Mode (Already Working)
- ✅ LiveKit Cloud account
- ✅ Token server running on port 3001
- ✅ Google Gemini API key
- ✅ Deepgram API key

### For Phone Call Mode (New Setup Required)
- 📋 Vobiz SIP trunk account ([console.vobiz.ai](https://console.vobiz.ai))
- 📋 Python 3.9+ installed
- 📋 Node.js 18+ installed

## Setup Instructions

### Step 1: Configure Vobiz SIP Trunk

1. **Sign up for Vobiz** at [console.vobiz.ai](https://console.vobiz.ai)
2. **Get your SIP credentials**:
   - SIP Domain (e.g., `xxx.sip.vobiz.ai`)
   - Username
   - Password
   - DID Number (your outbound caller ID, e.g., `+918071387318`)

3. **Create SIP Trunk in LiveKit**:
   - Option A: Use LiveKit Dashboard → SIP → Create Trunk
   - Option B: Use the setup script from `LiveKit-Vobiz-Outbound` folder
   
   You'll get a **Trunk ID** (starts with `ST_...`) - save this!

### Step 2: Configure Phone Call Backend

1. **Navigate to phone-call-backend**:
   ```powershell
   cd "c:\vs code\Assistant\phone-call-backend"
   ```

2. **Copy environment template**:
   ```powershell
   cp .env.example .env
   ```

3. **Edit `.env` file** with your credentials:
   ```env
   # LiveKit (same as your existing setup)
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_api_secret

   # AI Services (same as your existing setup)
   GOOGLE_API_KEY=your_google_api_key
   DEEPGRAM_API_KEY=your_deepgram_api_key
   TTS_PROVIDER=google

   # Vobiz SIP Trunk (NEW - from Step 1)
   VOBIZ_SIP_DOMAIN=xxx.sip.vobiz.ai
   VOBIZ_USERNAME=your_username
   VOBIZ_PASSWORD=your_password
   VOBIZ_OUTBOUND_NUMBER=+91XXXXXXXXXX
   OUTBOUND_TRUNK_ID=ST_xxxxxxxxxxxxx
   DEFAULT_TRANSFER_NUMBER=+91XXXXXXXXXX
   ```

### Step 3: Install Dependencies

#### Python Dependencies
```powershell
cd "c:\vs code\Assistant\phone-call-backend"

# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Install packages
pip install -r requirements.txt
```

#### Node.js Dependencies
```powershell
# In the same directory
npm install
```

### Step 4: Configure Frontend

Add the phone API URL to your frontend `.env`:

```powershell
cd "c:\vs code\Assistant\frontend"
```

Edit `.env` or `.env.local`:
```env
VITE_PHONE_API_URL=http://localhost:3002
```

## Running the Application

### Quick Start (Recommended)

#### For Phone Call Mode:

**Terminal 1** - Start Python Agent:
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
.\start_agent.bat
```

**Terminal 2** - Start API Server:
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
.\start_server.bat
```

**Terminal 3** - Start Frontend:
```powershell
cd "c:\vs code\Assistant\frontend"
npm run dev
```

### Manual Start

If you prefer manual control:

**Terminal 1** - Python Agent:
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
.\venv\Scripts\Activate.ps1
python agent.py start
```

**Terminal 2** - API Server:
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
npm start
```

**Terminal 3** - Frontend:
```powershell
cd "c:\vs code\Assistant\frontend"
npm run dev
```

## Using the Feature

### Access the Page

Navigate to: `http://localhost:5173/ai-interaction`

### Dev Mode

1. Click **"Dev Mode"** tab
2. Click the microphone button
3. Allow browser microphone access
4. Start speaking - the AI will respond in real-time
5. Click "End Session" when done

### Phone Call Mode

1. Click **"Phone Call"** tab
2. Select your country code (default: +91 for India)
3. Enter your phone number (without country code)
4. Click **"Call Me"**
5. Wait for your phone to ring
6. Answer the call - the AI will greet you and start the conversation
7. Hang up when done

## Troubleshooting

### Phone Call Not Working

**Problem**: Call doesn't initiate
- ✅ Check Python agent is running (Terminal 1)
- ✅ Check API server is running (Terminal 2)
- ✅ Verify `.env` file has correct credentials
- ✅ Check Vobiz account has sufficient balance

**Problem**: Phone rings but no audio
- ✅ Verify `OUTBOUND_TRUNK_ID` is correct
- ✅ Check Google Gemini API key is valid
- ✅ Check Deepgram API key is valid
- ✅ Look at Python agent logs for errors

**Problem**: "Invalid phone number" error
- ✅ Ensure number is in E.164 format: `+[country code][number]`
- ✅ Example: `+919876543210` (not `9876543210`)

### Dev Mode Not Working

**Problem**: "Failed to connect to voice server"
- ✅ Check token server is running on port 3001
- ✅ Verify `VITE_TOKEN_SERVER_URL` in frontend `.env`

### General Issues

**Problem**: Frontend build errors
```powershell
cd "c:\vs code\Assistant\frontend"
npm install
```

**Problem**: Python import errors
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Testing

### Test Dev Mode
1. Navigate to `/ai-interaction`
2. Select "Dev Mode"
3. Click microphone
4. Say "Hello, how are you?"
5. Verify AI responds

### Test Phone Call Mode
1. Navigate to `/ai-interaction`
2. Select "Phone Call"
3. Enter your phone number
4. Click "Call Me"
5. Answer your phone
6. Verify AI speaks to you

## File Structure

```
c:\vs code\Assistant\
├── phone-call-backend/          # NEW
│   ├── agent.py                 # Python AI worker
│   ├── make_call.py             # Call dispatcher
│   ├── server.js                # Node.js API
│   ├── requirements.txt         # Python deps
│   ├── package.json             # Node deps
│   ├── .env                     # Your credentials
│   ├── start_agent.bat          # Quick start script
│   ├── start_server.bat         # Quick start script
│   └── README.md                # Detailed docs
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── AIInteraction.jsx      # NEW - Main page
│   │   ├── components/
│   │   │   ├── DevInteractionMode.jsx # NEW - Web voice
│   │   │   └── PhoneCallMode.jsx      # NEW - Phone calls
│   │   └── lib/
│   │       └── phoneCallApi.js        # NEW - API client
│   └── .env                           # Add VITE_PHONE_API_URL
```

## Next Steps

1. **Test both modes** to ensure everything works
2. **Customize the AI agent** in `phone-call-backend/agent.py`:
   - Change the greeting message
   - Modify the assistant's personality
   - Add custom tools/functions
3. **Add authentication** to phone API endpoints (for production)
4. **Implement rate limiting** to prevent abuse
5. **Add call history** tracking in database (optional)

## Cost Awareness

Phone calls incur costs:
- **Vobiz**: Per-minute SIP charges
- **LiveKit**: Based on your plan
- **Deepgram**: ~$0.0043/minute
- **Google Gemini**: ~$0.00015/1K characters
- **Google TTS**: ~$4/1M characters

Estimate: ~$0.05-0.10 per minute of conversation

## Support

- **LiveKit Issues**: Check `lk-google-telnyx-1` folder for existing setup
- **Vobiz Issues**: [console.vobiz.ai](https://console.vobiz.ai)
- **Frontend Issues**: Check browser console for errors
- **Backend Issues**: Check terminal logs for Python/Node errors

## Security Notes

- ✅ Never commit `.env` files to git
- ✅ Keep API keys secure
- ✅ Phone numbers are stored temporarily in memory only
- ✅ Consider adding authentication for production use
- ✅ Implement rate limiting to prevent abuse

---

**You're all set!** 🎉

Navigate to `http://localhost:5173/ai-interaction` and try both modes!
