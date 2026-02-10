# Phone Call Backend

Backend service for handling outbound AI phone calls using LiveKit and Vobiz SIP trunk.

## Overview

This backend provides:
- **Python Agent** (`agent.py`): AI worker that handles outbound phone calls
- **Node.js API Server** (`server.js`): REST API for initiating and tracking calls
- **Call Dispatcher** (`make_call.py`): Utility for dispatching calls to LiveKit

## Prerequisites

1. **Python 3.9+** installed
2. **Node.js 18+** installed
3. **LiveKit Cloud Account** - Get credentials from [cloud.livekit.io](https://cloud.livekit.io)
4. **Vobiz Account** - Get SIP trunk credentials from [console.vobiz.ai](https://console.vobiz.ai)
5. **API Keys**:
   - Google Gemini API Key (for LLM and TTS)
   - Deepgram API Key (for STT)

## Setup Instructions

### 1. Install Python Dependencies

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Install Node.js Dependencies

```powershell
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```powershell
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
# LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# AI Services
GOOGLE_API_KEY=your_google_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
TTS_PROVIDER=google

# Vobiz SIP Trunk
VOBIZ_SIP_DOMAIN=your-domain.sip.vobiz.ai
VOBIZ_USERNAME=your_username
VOBIZ_PASSWORD=your_password
VOBIZ_OUTBOUND_NUMBER=+91XXXXXXXXXX
OUTBOUND_TRUNK_ID=ST_xxxxxxxxxxxxx
DEFAULT_TRANSFER_NUMBER=+91XXXXXXXXXX
```

### 4. Create SIP Trunk (First Time Only)

You need to create a SIP trunk in LiveKit that connects to Vobiz:

```powershell
# Use LiveKit CLI or the setup script from the original LiveKit-Vobiz-Outbound folder
# This will give you the OUTBOUND_TRUNK_ID to add to your .env file
```

## Running the Services

You need to run **TWO** services:

### Terminal 1: Start the Python Agent

```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start the agent
python agent.py start
```

Wait until you see: `INFO:livekit.agents:registered worker ...`

Keep this terminal running!

### Terminal 2: Start the Node.js API Server

```powershell
# In a new terminal
npm start
```

The API server will start on `http://localhost:3002`

## API Endpoints

### POST /api/phone-call/initiate

Initiate an outbound phone call.

**Request:**
```json
{
  "phoneNumber": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "dispatchId": "...",
  "roomName": "call-...",
  "phoneNumber": "+919876543210",
  "message": "Call initiated successfully"
}
```

### GET /api/phone-call/status/:dispatchId

Get the status of an active call.

**Response:**
```json
{
  "success": true,
  "dispatchId": "...",
  "phoneNumber": "+919876543210",
  "roomName": "call-...",
  "status": "initiated",
  "duration": 45,
  "startTime": "2026-02-10T11:00:00.000Z"
}
```

### GET /health

Health check endpoint.

## Testing

### Test with cURL

```powershell
# Initiate a call
curl -X POST http://localhost:3002/api/phone-call/initiate `
  -H "Content-Type: application/json" `
  -d '{"phoneNumber": "+919876543210"}'

# Check call status
curl http://localhost:3002/api/phone-call/status/DISPATCH_ID
```

### Test with Python Script

```powershell
# Activate venv first
.\venv\Scripts\Activate.ps1

# Make a call directly
python make_call.py --to +919876543210
```

## Troubleshooting

### Agent not starting?
- Check `.env` file has correct credentials
- Ensure all Python dependencies are installed
- Check Python version: `python --version` (should be 3.9+)

### Call not connecting?
- Verify `OUTBOUND_TRUNK_ID` is correct in `.env`
- Check Vobiz SIP credentials and account balance
- Ensure phone number includes country code (e.g., `+91`)

### No audio during call?
- Check Google Gemini/Deepgram API keys
- Verify API keys have sufficient quota
- Check agent logs for errors

### API server errors?
- Ensure Python agent is running first
- Check Node.js version: `node --version` (should be 18+)
- Verify `.env` file exists and is configured

## Architecture

```
Frontend (React)
    ↓
API Server (Node.js) - Port 3002
    ↓
make_call.py (Python)
    ↓
LiveKit Cloud
    ↓
agent.py (Python Worker)
    ↓
Vobiz SIP Trunk
    ↓
User's Phone
```

## Cost Considerations

Each phone call incurs costs:
- LiveKit usage (based on your plan)
- Vobiz SIP charges (per minute)
- Deepgram STT (~$0.0043/min)
- Google Gemini LLM (~$0.00015/1K chars)
- Google TTS (~$4/1M chars)

## Security Notes

- Never commit `.env` file to git
- Keep API keys secure
- Consider adding authentication to API endpoints
- Implement rate limiting for production use
- Phone numbers are stored temporarily in memory only

## Support

For issues related to:
- **LiveKit**: [LiveKit Docs](https://docs.livekit.io)
- **Vobiz**: [Vobiz Support](https://console.vobiz.ai)
- **Google Gemini**: [Google AI Docs](https://ai.google.dev)
- **Deepgram**: [Deepgram Docs](https://developers.deepgram.com)
