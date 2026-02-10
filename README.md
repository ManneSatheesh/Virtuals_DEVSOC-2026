# 🧠 MindfulVoice

**AI Mental Health Companion with Real-Time Emotion Detection, Voice Conversations, Phone Calls & Persistent Memory**

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Project Architecture](#project-architecture)
- [Project Structure](#project-structure)
- [Services & Components](#services--components)
- [API Documentation](#api-documentation)
- [Environment Configuration](#environment-configuration)
- [Development Workflow](#development-workflow)
- [Deployment Guide](#deployment-guide)
- [Contributing](#contributing)
- [License](#license)

---

## 📱 Overview

**MindfulVoice** is a compassionate AI companion designed to provide mental health support through multiple interactive channels. It combines advanced emotion detection, natural language AI, and persistent memory to deliver personalized wellness experiences.

### What Makes It Unique

✨ **Multi-Channel Support**: Web voice, phone calls, text chat—choose your communication style  
🎭 **Emotion-Aware AI**: Real-time audio + text emotion detection with adaptive responses  
💾 **Persistent Memory**: Backboard.io integration maintains conversation context across sessions  
📊 **Wellness Analytics**: Weekly automated reports with mood trends and personalized recommendations  
☁️ **Cloud-Native**: Supabase PostgreSQL + LiveKit for scalable infrastructure  
🔒 **Privacy-First**: Row-level security, encryption, and HIPAA-ready architecture  

---

## ✨ Features

### 🎤 Voice Conversations
- Web-based voice chat with AI via LiveKit
- Real-time audio waveform visualization
- Automatic speech-to-text transcription (Deepgram)
- Natural text-to-speech responses

### 📞 Phone Calling
- AI initiates outbound calls to user's phone
- E.164 phone number validation
- Real-time conversation with live call tracking
- Session recording and transcription

### 💬 Text Chat
- Type-based conversations with emotion detection
- See detected emotions for each message
- Memory-integrated responses
- Full message history

### 🧠 Emotion Detection
- **Audio Analysis**: Detects emotion from speech tone (7 emotions)
- **Text Analysis**: Analyzes written content sentiment
- **Speech Features**: Captures hesitation patterns, pacing, filler words
- **Mood Timeline**: Tracks emotional state progression throughout session

### 📈 Dashboard
- Real-time mood trends visualization
- Latest session summary
- Pending wellness reminders
- Weekly report highlights
- Quick access to all interaction modes

### 📋 Session History
- Browse all past interactions (voice, phone, text)
- Full transcripts with timestamps
- Emotion analysis for each session
- Searchable and filterable
- Mood score tracking over time

### 🎯 Wellness Reminders
- Customizable reminder categories (wellness, medication, exercise, social, other)
- Scheduled notifications
- Completion tracking
- Integration with mood data

### 📊 Weekly Reports
- AI-generated (Gemini) analysis of past week
- Mood trends and insights
- Key conversation topics
- Personalized recommendations
- Generated every Monday 8 AM

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher ([download](https://nodejs.org/))
- **Python** 3.9+ ([download](https://www.python.org/))
- **Git** for version control
- **Supabase Account** ([create free](https://supabase.com/))
- **Google API Key** (Gemini, TTS) ([get key](https://aistudio.google.com/apikey))
- **LiveKit Access** ([cloud.livekit.io](https://cloud.livekit.io/))
- **Deepgram API Key** (speech-to-text) ([get key](https://console.deepgram.com/))

### Installation (5 Minutes)

**1. Clone the repository**
```bash
git clone <repository-url>
cd Assistant
```

**2. Install dependencies**
```bash
# Frontend dependencies
cd frontend
npm install
npm run build

# Emotion backend dependencies
cd ../emotion-backend
pip install -r requirements.txt

# Phone call backend dependencies
cd ../phone-call-backend
pip install -r requirements.txt
npm install

# LiveKit agent dependencies
cd ../lk-google-telnyx-1
pip install -r requirements.txt (if needed)
```

**3. Configure environment variables**
```bash
# Copy example files
cp frontend/.env.example frontend/.env.local
cp emotion-backend/.env.example emotion-backend/.env.local
cp phone-call-backend/.env.example phone-call-backend/.env.local
cp lk-google-telnyx-1/.env.example lk-google-telnyx-1/.env.local

# Edit each .env.local file with your credentials
```

**4. Start services (4 separate terminals)**

Terminal 1 - Frontend:
```bash
cd frontend
npm run dev
# Available at http://localhost:5173
```

Terminal 2 - Emotion Detection Backend:
```bash
cd emotion-backend
python app/server.py
# API running on http://localhost:8000
```

Terminal 3 - Phone Call Backend:
```bash
cd phone-call-backend
npm start
python agent.py start
# API on port 3002, Agent on port 8081
```

Terminal 4 - Voice Agent Backend:
```bash
cd lk-google-telnyx-1
node src/index.js
# Backboard memory service on http://localhost:3000
```

**5. Verify installation**
```bash
# Test frontend
curl http://localhost:5173

# Test emotion backend
curl http://localhost:8000/health

# Test phone backend
curl http://localhost:3002/health
```

---

## 🏗️ Project Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                        │
│              http://localhost:5173 | Production: Vercel            │
│  Pages: Home, Login, Dashboard, Voice/Phone/Chat, History, Settings│
└──────────┬──────────────────────────────────────────────────────────┘
           │
      ┌────┴─────┬──────────────┬──────────────┬──────────────┐
      │           │              │              │              │
      v           v              v              v              v
 LiveKit       Supabase       Token Server    Backboard      Phone API
 Cloud         PostgreSQL     (Port 3001)     Memory         (Port 3002)
 (wss://)       (Cloud)                       (Port 3000)         │
                                                                  │
      ┌───────────────────────────────────────────────────────────┤
      │                                                            │
      v                                                            v
┌──────────────────────────────────────────────────────────────────────┐
│                        PYTHON SERVICES                               │
├─────────────────────┬────────────────────┬────────────────────────────┤
│ Voice Agent         │ Emotion Detection  │ Phone Call Agent           │
│ (LiveKit Agents)    │ (FastAPI)          │ (LiveKit + Deepgram)       │
│                     │                    │                            │
│ • agent.py          │ • Audio emotion    │ • Outbound calling         │
│ • Port 8081         │ • Text emotion     │ • Real-time transcription  │
│ • Gemini 2.5 Flash  │ • Port 8000        │ • SIP trunk integration    │
│ • Deepgram STT      │ • Transformer ML   │ • Port 8081 + 3002         │
│ • Google TTS        │ • PyTorch models   │ • Twilio/Vobiz integration │
└─────────────────────┴────────────────────┴────────────────────────────┘
```

### Data Flow: Voice Conversation

```
User speaks → LiveKit captures audio
   ↓
Deepgram transcribes to text
   ↓
Emotion-backend analyzes:
  • Audio emotion: "happy" (92%)
  • Text emotion: "joy" (89%)
  • Speech features: hesitation, filler words
   ↓
Agent receives transcript + emotion context
   ↓
Gemini LLM generates response (influenced by mood)
   ↓
Google TTS converts response to speech
   ↓
User hears response + session stored with emotion labels
```

### Data Flow: Phone Call

```
Frontend sends phone number to API (port 3002)
   ↓
make_call.py validates E.164 format
   ↓
Create unique LiveKit room + SIP participant token
   ↓
Dispatch outbound-caller agent to room
   ↓
Agent joins room → Calls user's phone via Vobiz SIP trunk
   ↓
User answers → Real-time streaming conversation begins
   ↓
Emotion detected from speech patterns
   ↓
Transcript recorded + session stored to database
   ↓
Call ends → Session summary displayed on frontend
```

### Data Flow: Weekly Report Generation

```
Monday 8:00 AM → Cron job triggers
   ↓
Fetch user's last 7 days:
  • Questionnaire responses (33 questions)
  • All sessions: voice, phone, text
  • All messages with mood scores
  • Reminder completion status
   ↓
Compile context for Gemini analysis
   ↓
Gemini generates:
  • Mood trend (improving/stable/declining)
  • Key topics discussed
  • Recommendations
  • Insights from mood data
   ↓
Store in weekly_reports table
   ↓
User sees summary on dashboard with highlights
```

---

## 📂 Project Structure

```
Assistant/
├── frontend/                          # React + Vite web application
│   ├── src/
│   │   ├── App.jsx                   # Main app component
│   │   ├── main.jsx                  # Entry point
│   │   ├── components/               # React components
│   │   │   ├── Layout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── VoiceWaveform.jsx
│   │   │   ├── PhoneCallMode.jsx
│   │   │   ├── DevInteractionMode.jsx
│   │   │   └── ...
│   │   ├── pages/                    # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AIInteraction.jsx
│   │   │   ├── TextChat.jsx
│   │   │   ├── VoiceInteraction.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Questionnaire.jsx
│   │   ├── contexts/                 # React context providers
│   │   │   └── AuthContext.jsx
│   │   ├── lib/                      # Utility libraries
│   │   │   ├── supabase.js          # Supabase client
│   │   │   ├── appwrite.js          # Appwrite client
│   │   │   ├── phoneCallApi.js      # Phone API wrapper
│   │   │   └── ...
│   │   ├── assets/                   # Static assets
│   │   └── App.css, index.css        # Styles
│   ├── server/
│   │   ├── token-server.js          # LiveKit token generation (Port 3001)
│   │   └── package.json
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── emotion-backend/                   # FastAPI emotion detection service
│   ├── app/
│   │   ├── server.py                # FastAPI app (Port 8000)
│   │   ├── config.py                # Configuration
│   │   ├── responses.py             # Response models
│   │   ├── utils.py                 # Utility functions
│   │   └── __init__.py
│   ├── requirements.txt
│   ├── README_DISPLAY.md
│   ├── dashboard.py                 # Monitoring dashboard
│   ├── quickstart.py                # Quick start script
│   └── .env.example
│
├── phone-call-backend/                # Express + Python call service
│   ├── server.js                     # Express API (Port 3002)
│   ├── agent.py                      # LiveKit agent for calls
│   ├── make_call.py                  # Call dispatcher
│   ├── package.json
│   ├── requirements.txt
│   ├── start_agent.bat               # Windows script
│   ├── start_server.bat              # Windows script
│   └── .env.example
│
├── lk-google-telnyx-1/                # Voice agent & Backboard backend
│   ├── src/
│   │   ├── agent.py                  # Main voice agent (7000+ lines)
│   │   │                             # Features:
│   │   │                             # - Emotion synthesis
│   │   │                             # - Memory integration
│   │   │                             # - Function tools
│   │   │                             # - Transcript storage
│   │   ├── outbound_agent.py        # Outbound call handler
│   │   ├── telephony_agent.py       # Telephony realtime agent
│   │   └── __init__.py
│   ├── call_via_livekit.py          # SIP call utility
│   ├── make_call.py                 # Twilio call utility
│   ├── check_memory.py              # Memory endpoint tester
│   ├── setup_dispatch.py            # LiveKit dispatch setup
│   ├── diagnostic_test.py           # Memory persistence test
│   ├── test_livekit.py              # LiveKit console mode test
│   ├── pyproject.toml               # Python project config
│   ├── package.json
│   ├── requirements.txt
│   └── .env.example
│
├── emotion-detection-repo/            # ML model repository
│   └── (Pre-trained models reference)
│
├── supabase_schema.sql               # Database schema
├── README.md                         # This file
├── START_HERE.md                     # Quick reference guide
└── .env.example                      # Root env template
```

---

## 🔧 Services & Components

### Frontend (React + Vite)

**Port**: 5173 (Development) | Vercel (Production)

**Key Pages**:
- **Home** (`/`): Landing page with feature overview
- **Login** (`/login`): Supabase Auth (Google OAuth + Email/Password)
- **Dashboard** (`/dashboard`): Real-time stats, mood trends, reminders, weekly report
- **AI Interaction** (`/ai-interaction`): Voice (Dev mode) + Phone call (Production mode)
- **Text Chat** (`/chat`): Text-based conversation with emotion detection
- **Voice Interaction** (`/voice`): Traditional voice sessions transcript
- **History** (`/history`): Browse all past sessions with full transcripts
- **Settings** (`/settings`): User preferences and notification settings
- **Questionnaire** (`/questionnaire`): Initial 33-question onboarding assessment

**Authentication**: Supabase Auth with Row-Level Security  
**State Management**: React Context + Supabase real-time subscriptions  
**UI Framework**: Tailwind CSS + Lucide React icons  
**Voice Communication**: LiveKit React Components v2.9

### Token Server (Node.js Express)

**Port**: 3001

**Purpose**: Issues LiveKit room access tokens for web-based voice sessions

**Endpoint**:
```
POST /token
Body: { "roomName": "call-123", "userId": "user@example.com" }
Returns: { "token": "jwt..." }
```

### Emotion Detection Backend (FastAPI)

**Port**: 8000

**Models**:
- **Audio**: `superb/wav2vec2-base-superb-er` (16kHz WAV) → 7 emotion classes
- **Text**: `j-hartmann/emotion-english-distilroberta-base` (512 char max) → 7 emotions

**Endpoints**:
- `POST /predict` - Audio emotion detection (WAV file upload)
- `POST /predict-text` - Text emotion detection
- `GET /health` - Service health check

### Phone Call Backend (Express + Python)

**Ports**: 3002 (Express API) | 8081 (Python LiveKit Agent)

**Components**:
- `server.js`: REST API for call management
- `agent.py`: LiveKit agent for voice handling
- `make_call.py`: Dispatcher for creating rooms

**Endpoints**:
- `POST /api/phone-call/initiate` - Start outbound call
- `GET /api/phone-call/status/:id` - Check call status
- `GET /api/phone-call/active` - List active calls
- `GET /health` - Health check

**Integration**: Vobiz SIP trunk for PSTN access

### Voice Agent Backend (Python LiveKit Agents)

**Ports**: 8081 (Primary) | 3000 (Backboard memory API)

**Key File**: `lk-google-telnyx-1/src/agent.py` (700+ lines)

**Features**:
- **LLM**: Google Gemini 2.5 Flash (real-time audio)
- **STT**: Deepgram (16kHz streaming)
- **TTS**: Google Cloud TTS (8kHz telephony)
- **Emotion Synthesis**: Real-time audio + text analysis
- **Memory Integration**: Backboard.io context recall
- **Function Tools**:
  - `end_conversation()` - Gracefully end call
  - `recall_information()` - Query memory
  - `lookup_info()` - Knowledge base search

**Session Management**:
- Real-time VAD (voice activity detection)
- Interruption handling
- Transcript collection with timestamps
- Mood timeline tracking
- Automatic transcript storage

### Database (Supabase PostgreSQL)

**6 Core Tables**:

1. **profiles**
   ```sql
   - id (PK, auto-created on auth signup)
   - email, name, age, picture
   - voice_care_enabled, elderly_support_enabled
   - created_at, updated_at
   ```

2. **questionnaire_responses**
   ```sql
   - id (PK)
   - user_id (FK → profiles)
   - set (Intro, Set A, Set B, Set C)
   - question_number (1-33)
   - answer (text)
   - answered_at
   ```

3. **sessions**
   ```sql
   - id (PK)
   - user_id (FK → profiles)
   - type (voice, phone, text)
   - duration_seconds, status
   - mood_summary, mood_score
   - transcript_summary
   - created_at, ended_at
   ```

4. **messages**
   ```sql
   - id (PK)
   - session_id (FK → sessions)
   - role (user | assistant)
   - content (text)
   - emotion_label, emotion_score
   - created_at
   ```

5. **reminders**
   ```sql
   - id (PK)
   - user_id (FK → profiles)
   - category (wellness, medication, exercise, social, other)
   - title, description
   - due_date, completed_at
   - created_at
   ```

6. **weekly_reports**
   ```sql
   - id (PK)
   - user_id (FK → profiles)
   - week_start_date
   - mood_trend (string)
   - key_topics (text array)
   - recommendations (text)
   - insights (text)
   - session_count, message_count
   - generated_at
   ```

**Security**: Row-Level Security (RLS) enabled on all tables

---

## 📡 API Documentation

### Emotion Detection API (Port 8000)

#### Audio Emotion Detection
```bash
POST /predict
Content-Type: multipart/form-data

curl -X POST -F "file=@audio.wav" http://localhost:8000/predict

Response:
{
  "label": "happy",
  "score": 0.92,
  "probabilities": {
    "angry": 0.02,
    "happy": 0.92,
    "sad": 0.01,
    "neutral": 0.03,
    "fearful": 0.01,
    "disgusted": 0.01,
    "surprised": 0.00
  },
  "suggestion": "You sound happy and positive!"
}
```

#### Text Emotion Detection
```bash
POST /predict-text
Content-Type: application/json

curl -X POST http://localhost:8000/predict-text \
  -H "Content-Type: application/json" \
  -d '{"text": "I am feeling wonderful today"}'

Response:
{
  "label": "joy",
  "score": 0.95,
  "probabilities": {
    "joy": 0.95,
    "sadness": 0.01,
    "anger": 0.02,
    "neutral": 0.01,
    "fear": 0.00,
    "disgust": 0.00,
    "surprise": 0.01
  }
}
```

#### Health Check
```bash
GET /health

Response: { "status": "ok", "model": "loaded" }
```

### Phone Call API (Port 3002)

#### Initiate Outbound Call
```bash
POST /api/phone-call/initiate
Content-Type: application/json

curl -X POST http://localhost:3002/api/phone-call/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+12025551234",
    "userId": "user@example.com"
  }'

Response:
{
  "success": true,
  "callId": "call_abc123",
  "roomName": "call_abc123",
  "status": "initiated",
  "estimatedWaitTime": 5
}
```

#### Check Call Status
```bash
GET /api/phone-call/status/:callId

curl http://localhost:3002/api/phone-call/status/call_abc123

Response:
{
  "callId": "call_abc123",
  "status": "active",
  "duration": 120,
  "participant": "user@example.com",
  "recordingUrl": "https://..."
}
```

#### List Active Calls
```bash
GET /api/phone-call/active

Response:
{
  "activeCalls": [
    {
      "callId": "call_abc123",
      "userId": "user@example.com",
      "duration": 120,
      "status": "active"
    }
  ],
  "total": 1
}
```

#### Health Check
```bash
GET /health

Response: { "status": "ok", "agent": "running" }
```

### Main Backend API (Port 3000 - Backboard)

#### Recall Memory
```bash
POST /recall-memory
Content-Type: application/json

curl -X POST http://localhost:3000/recall-memory \
  -H "Content-Type: application/json" \
  -d '{}'

Response:
{
  "memory": "User's name is John. Working on hackathon. Loves AI."
}
```

#### Store Transcript
```bash
POST /store-transcript
Content-Type: application/json

curl -X POST http://localhost:3000/store-transcript \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": [
      {"role": "user", "content": "I feel great today"},
      {"role": "assistant", "content": "That's wonderful to hear!"}
    ],
    "call_start": "2025-02-10T10:00:00Z",
    "call_end": "2025-02-10T10:05:00Z",
    "duration_seconds": 300,
    "room_name": "call_abc123",
    "mood_timeline": [...],
    "final_mood": {...}
  }'

Response:
{
  "success": true,
  "thread_id": "thread_xyz789",
  "messages_stored": 2
}
```

---

## 🔐 Environment Configuration

### Frontend Environment (`.env.local`)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# LiveKit Configuration
VITE_LIVEKIT_URL=wss://livekit-instance.livekit.cloud
VITE_LIVEKIT_API_KEY=your_api_key
VITE_LIVEKIT_API_SECRET=your_api_secret

# API Endpoints
VITE_TOKEN_SERVER_URL=http://localhost:3001
VITE_PHONE_API_URL=http://localhost:3002
VITE_EMOTION_API_URL=http://localhost:8000
VITE_BACKBOARD_URL=http://localhost:3000

# Other
VITE_ENVIRONMENT=development
```

### Emotion Backend Environment (`.env.local`)
```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Model Configuration
AUDIO_MODEL=superb/wav2vec2-base-superb-er
TEXT_MODEL=j-hartmann/emotion-english-distilroberta-base
DEVICE=auto  # auto|cuda|cpu

# Cache
CACHE_DIR=./models

# API Keys (if needed)
HUGGING_FACE_TOKEN=your_token
```

### Phone Call Backend Environment (`.env.local`)
```env
# Express Server
EXPRESS_PORT=3002
NODE_ENV=development

# Python Agent
AGENT_PORT=8081

# LiveKit Configuration
LIVEKIT_URL=wss://livekit-instance.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Google Configuration
GOOGLE_API_KEY=your_api_key

# Deepgram Configuration
DEEPGRAM_API_KEY=your_api_key

# Twilio (if using Twilio for calls)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token

# Vobiz (if using Vobiz for SIP)
VOBIZ_SIP_TRUNK=your_trunk_id
```

### Voice Agent Backend Environment (`.env.local`)
```env
# LiveKit Configuration
LIVEKIT_URL=wss://livekit-instance.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Google Configuration
GOOGLE_API_KEY=your_api_key

# Backboard Configuration (Memory)
BACKBOARD_URL=http://localhost:3000
BACKBOARD_API_KEY=your_backboard_api_key

# Emotion Detection
EMOTION_API_URL=http://localhost:8000/predict
EMOTION_TEXT_API_URL=http://localhost:8000/predict-text

# Deepgram (if using for STT)
DEEPGRAM_API_KEY=your_api_key

# Server Configuration
PORT=3000
DEBUG=true
```

---

## 💻 Development Workflow

### Common Tasks

#### Running Everything Locally

Terminal 1 - Frontend:
```bash
cd frontend
npm run dev
```

Terminal 2 - Emotion Backend:
```bash
cd emotion-backend
python app/server.py
```

Terminal 3 - Phone Call Backend:
```bash
cd phone-call-backend
npm start  # in one terminal
python agent.py start  # in another terminal
```

Terminal 4 - Voice Agent:
```bash
cd lk-google-telnyx-1
node src/index.js
```

#### Testing Emotion Detection

```bash
# Test audio emotion
curl -F "file=@sample.wav" http://localhost:8000/predict

# Test text emotion
curl -X POST http://localhost:8000/predict-text \
  -H "Content-Type: application/json" \
  -d '{"text": "I am feeling happy"}'
```

#### Testing Phone Calls

```bash
# Initiate call
curl -X POST http://localhost:3002/api/phone-call/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+12025551234",
    "userId": "test@example.com"
  }'

# Check status
curl http://localhost:3002/api/phone-call/status/call_id_here
```

#### Testing Memory Integration

```bash
# Check current memory
curl -X POST http://localhost:3000/recall-memory -H "Content-Type: application/json" -d '{}'

# Run diagnostic test
cd lk-google-telnyx-1
python diagnostic_test.py
```

### Debugging

**Frontend**: Open DevTools (F12) → React DevTools → Inspect components, check Supabase queries

**Emotion Backend**: Check `/emotion-backend/logs/` for model loading issues

**Phone Agent**: Enable DEBUG=true in .env, check terminal output for LiveKit connection status

**Memory Integration**: Run `diagnostic_test.py` to verify Backboard connectivity

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Port already in use | Service still running | `lsof -i :PORT` then kill process |
| CORS errors | Missing origin in config | Add frontend URL to backend CORS whitelist |
| Emotion model not loading | GPU memory insufficient | Set `DEVICE=cpu` in .env |
| LiveKit connection fails | Wrong credentials | Verify `LIVEKIT_URL`, `API_KEY`, `API_SECRET` |
| Memory not persisting | Backboard server down | Check `http://localhost:3000/status` |
| Phone number validation errors | Wrong format | Use E.164 format: `+1-202-555-1234` |

---

## 🚀 Deployment Guide

### Frontend Deployment (Vercel)

```bash
# Connect to Vercel
vercel link

# Deploy
vercel --prod

# Environment variables on Vercel dashboard:
VITE_SUPABASE_URL=prod_url
VITE_SUPABASE_ANON_KEY=prod_key
# ... (all other VITE_* variables)
```

### Python Services (Railway / Render)

**Emotion Backend**:
```bash
# Create requirements.txt with pinned versions
pip freeze > requirements.txt

# Deploy to Railway
railway init
railway link
railway up
```

**Phone Call Backend**:
```bash
# Deploy Express server
railway init
railway link
railway up

# Deploy Python agent separately or via process manager
```

### Database (Supabase Cloud)

Already hosted - just ensure:
1. Row-Level Security enabled on all tables
2. Backup schedule configured
3. Custom domain set up if needed

### Environment Variables for Production

Update all `.env` files with production credentials:
- Supabase production database URL
- LiveKit production credentials
- Production API keys (Google, Deepgram, etc.)
- Production domain URLs

### Database Migrations

```bash
# Generate migration
supabase migration new <migration_name>

# Apply migration
supabase db push

# Verify with schema
supabase schema list
```

---

## 🤝 Contributing

### Getting Started with Development

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m "Add amazing feature"`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Coding Standards

- **Python**: Follow PEP 8, use type hints, pragma comments for linting
- **JavaScript**: Use ESLint config, prefer const/let over var, arrow functions
- **SQL**: Use consistent naming (snake_case), include comments for complex queries
- **Components**: Functional components with hooks, descriptive prop names

### Commit Message Format

```
[type]: Brief description

Optional detailed explanation.

Related: #issue_number
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`

Example:
```
feat: Add weekly report generation via Gemini

Implement automated Monday 8 AM cron job that:
- Fetches user's last 7 days of data
- Sends comprehensive context to Gemini
- Stores generated report in database
- Displays on user dashboard

Related: #42
```

### Code Review Process

1. PR submitted → Automated tests run
2. At least 1 approval required
3. Merge to `main` → Auto-deploy to staging
4. Manual QA on staging
5. Production deployment via CD pipeline

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Attribution

Built with:
- **Google Gemini** - Advanced LLM reasoning
- **LiveKit** - Real-time voice/video communication
- **Supabase** - PostgreSQL database & auth
- **Deepgram** - Speech-to-text & text-to-speech
- **Backboard.io** - Conversation memory & context
- **PyTorch & Transformers** - Emotion detection models
- **React & Vite** - Frontend framework
- **FastAPI** - Python backend framework

---

## 📞 Support & Contact

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@mindfulvoice.io
- **Documentation**: See [docs/](docs/) folder

---

## 🎯 Roadmap

### Q1 2026
- [ ] Multi-language support (Spanish, Mandarin, Japanese)
- [ ] Advanced analytics dashboard
- [ ] Integration with wearables (Fitbit, Apple Watch)

### Q2 2026
- [ ] Video conversations support
- [ ] Group therapy sessions
- [ ] Mobile native apps (iOS/Android)

### Q3 2026
- [ ] HIPAA certification
- [ ] Enterprise SSO integration
- [ ] Custom model fine-tuning

---

**Made with ❤️ by MindfulVoice Team**
