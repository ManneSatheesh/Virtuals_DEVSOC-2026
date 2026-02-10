# 🔍 Agent Dev Mode Diagnostic Report

## ✅ Current Status

Based on the tests, here's what we know:

### 1. **Agent is Running** ✅
- Running in `dev` mode
- Connected to LiveKit Cloud: `wss://ai-assistant-o104n7t4.livekit.cloud`
- Agent name: `voice_agent`
- Status: **Waiting for dispatch jobs**

### 2. **LiveKit Connection** ✅
- API credentials valid
- Connection successful
- 0 active rooms (normal when no one is connected)

### 3. **Dispatch Rule Issue** ⚠️

**Your Current Rule:**
```
Dispatch rule ID: SDR_6RX9XuUrW3pQ
Rule name: voice-session-dispatch
Destination room: voice-session<caller-number>
Agent: voice-agent  ← WRONG (should be voice_agent with underscore)
Rule type: Individual
```

**Problems:**
1. ❌ Agent name: `voice-agent` (hyphen) ≠ `voice_agent` (underscore in code)
2. ❌ Room pattern: `voice-session<caller-number>` (for SIP calls) ≠ `voice-session-*` (for web)

## 🎯 How Dev Mode Works

### **Normal Flow (When Dispatch Rule is Correct):**

```
1. Agent starts in dev mode
   ↓
2. Agent connects to LiveKit Cloud
   ↓
3. Agent registers as "voice_agent"
   ↓
4. Agent waits silently for dispatch jobs
   ↓
5. Frontend creates room "voice-session-1234567890"
   ↓
6. LiveKit matches pattern "voice-session-*"
   ↓
7. LiveKit dispatches job to "voice_agent"
   ↓
8. Agent receives job request
   ↓
9. Agent joins the room
   ↓
10. Agent terminal shows: "Session started - Room: voice-session-1234567890"
   ↓
11. Audio flows: User ↔ Agent
```

### **Current Flow (With Wrong Dispatch Rule):**

```
1. Agent starts in dev mode ✅
   ↓
2. Agent connects to LiveKit Cloud ✅
   ↓
3. Agent registers as "voice_agent" ✅
   ↓
4. Agent waits silently ✅
   ↓
5. Frontend creates room "voice-session-1234567890" ✅
   ↓
6. LiveKit tries to match pattern "voice-session<caller-number>" ❌
   ↓
7. Pattern doesn't match! (no <caller-number> in web rooms)
   ↓
8. LiveKit doesn't dispatch to any agent ❌
   ↓
9. Room stays empty ❌
   ↓
10. Frontend disconnects (timeout) ❌
```

## 🔧 The Fix

You need to **edit or create a new dispatch rule** with these EXACT values:

| Field | Correct Value | Your Current Value |
|-------|---------------|-------------------|
| **Room Pattern** | `voice-session-*` | `voice-session<caller-number>` ❌ |
| **Agent Name** | `voice_agent` | `voice-agent` ❌ |
| **Rule Type** | `Individual` | `Individual` ✅ |

## 📋 Step-by-Step Fix

### Option 1: Edit Existing Rule

1. Go to LiveKit Dashboard
2. Find rule: `voice-session-dispatch` (ID: SDR_6RX9XuUrW3pQ)
3. Click **Edit**
4. Change:
   - Room Pattern: `voice-session-*` (with asterisk)
   - Agent Name: `voice_agent` (with underscore)
5. Save

### Option 2: Create New Rule

1. Go to LiveKit Dashboard → Dispatch Rules
2. Click **Create New Rule**
3. Fill in:
   - Name: `web-voice-dispatch`
   - Room Pattern: `voice-session-*`
   - Agent Name: `voice_agent`
   - Rule Type: `Individual`
4. Save

## ✅ How to Test After Fix

1. **Ensure agent is running**:
   ```bash
   # Should see in terminal:
   uv run src/agent.py dev
   ```

2. **Open frontend**:
   ```
   http://localhost:5173/voice
   ```

3. **Click microphone button**

4. **Watch agent terminal** - You should see:
   ```
   Session started - Room: voice-session-1738876437802
   🧠 Loaded memory from Backboard
   🎭 Emotion detection background task started
   💬 Waiting for conversation to end...
   ```

5. **Speak** - Agent should respond with voice

## 🎤 Audio Flow in Dev Mode

When dispatch rule is correct:

```
Your Microphone
    ↓
Frontend (React)
    ↓
LiveKit Cloud (WebRTC)
    ↓
Agent (Python - dev mode)
    ↓
Gemini 2.5 Flash (AI processing)
    ↓
Agent (Python)
    ↓
LiveKit Cloud (WebRTC)
    ↓
Frontend (React)
    ↓
Your Speakers
```

**Emotion Detection (Parallel):**
```
Your Voice
    ↓
Agent taps audio stream
    ↓
Sends to Emotion Backend (port 8000)
    ↓
Wav2Vec2 model detects emotion
    ↓
Agent logs emotion
```

## 📊 Current State Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Agent Running | ✅ | Dev mode active |
| LiveKit Connection | ✅ | Connected to cloud |
| Dispatch Rule | ❌ | Wrong pattern & agent name |
| Frontend | ✅ | Running on port 5173 |
| Backend Services | ✅ | Emotion (8000), Memory (3000) |

## 🎯 Bottom Line

**The agent IS running correctly in dev mode and IS ready to receive audio.**

**The problem is the dispatch rule doesn't match:**
- Your rule expects: `voice-session<caller-number>` + agent `voice-agent`
- Your code creates: `voice-session-1234567890` + agent `voice_agent`

**Fix the dispatch rule and everything will work!** 🚀

---

**Next Action**: Edit the dispatch rule in LiveKit dashboard with the correct values above.
