# 🔍 Real-Time Connection Diagnostic

## ✅ What to Check Right Now

Since you've updated the dispatch rule, let's verify the **actual connection flow**:

### 1️⃣ **Check Agent Terminal**

When you click the mic button, the agent terminal should show:

```
✅ GOOD - Agent receives job:
Session started - Room: voice-session-1738876437802
🧠 Loaded memory from Backboard: ...
🎭 Emotion detection background task started
💬 Waiting for conversation to end...

❌ BAD - No output:
(silence means dispatch rule didn't route the job)
```

### 2️⃣ **Check Browser Console (F12)**

**Expected flow:**

```javascript
// Step 1: Publishing track (trackID: undefined is NORMAL here)
publishing track {room: 'voice-session-...', trackID: undefined}

// Step 2: Track gets ID assigned
publishing track {room: 'voice-session-...', trackID: 'TR_abc123'}

// Step 3: Connection established
Connected to room

// Step 4: Agent joins (if dispatch rule works)
Participant joined: voice_agent

// Step 5: Audio flowing
Agent is speaking...
```

**Bad signs:**
```javascript
disconnect from room  // Means dispatch failed
Connection timeout    // Agent never joined
```

### 3️⃣ **Check LiveKit Dashboard**

Go to: https://cloud.livekit.io/ → Rooms

**If dispatch rule works:**
- ✅ You'll see active room: `voice-session-1738876437802`
- ✅ 2 participants: You + `voice_agent`
- ✅ Audio tracks active

**If dispatch rule doesn't work:**
- ❌ Room exists but only 1 participant (you)
- ❌ No agent joined
- ❌ Room closes after timeout

## 🎯 The Three Critical Questions

### **Q1: Did the track finish publishing?**

**Check browser console:**
```javascript
// Initial (trackID: undefined) - NORMAL ✅
publishing track {trackID: undefined}

// Then should become:
publishing track {trackID: 'TR_abc123'} - GOOD ✅
```

If it stays `undefined` forever → **WebRTC issue** (firewall/network)

### **Q2: Did the agent get assigned to the room?**

**Check agent terminal:**
```bash
# Should see within 1-2 seconds of clicking mic:
Session started - Room: voice-session-1738876437802

# If you see nothing → Dispatch rule not working ❌
```

**Also check browser console:**
```javascript
Participant joined: voice_agent  // Agent successfully joined ✅
```

### **Q3: Did audio actually flow?**

**Test:**
1. Say "Hello"
2. Wait 2-3 seconds
3. Should hear agent respond

**Agent terminal should show:**
```
👤 USER: Hello
🎭 Emotion detected: neutral (85%)
🤖 AGENT: Hey! How can I help you today?
```

## 🔧 Quick Diagnostic Commands

### **Check if room is active:**
```bash
# In a new terminal:
cd lk-google-telnyx-1
uv run verify_livekit_connection.py
```

Look for: `Found X active rooms` (should be 1 when connected)

### **Check agent status:**
```bash
# Agent terminal should show:
INFO livekit.agents registered worker
```

If you see `shutting down` → Agent crashed, restart it

## 📊 Troubleshooting Matrix

| Symptom | Cause | Fix |
|---------|-------|-----|
| `trackID: undefined` forever | WebRTC blocked | Check firewall, try different network |
| Track publishes, then disconnect | Dispatch rule wrong | Fix pattern to `voice-session-*` |
| Agent terminal silent | Dispatch rule not routing | Verify agent name is `voice_agent` |
| Agent joins but no audio | Microphone permissions | Allow mic in browser |
| Agent responds but you can't hear | Speaker issue | Check volume/output device |

## 🎯 Current Dispatch Rule Check

**Your rule should be:**
```
Destination room: voice-session-*
Agent: voice_agent
Rule type: Individual
```

**NOT:**
```
Destination room: voice-session-*<caller-number>  ❌
```

## ✅ Success Indicators

**You'll know it's working when:**

1. **Browser console shows:**
   ```
   publishing track
   Connected to room
   Participant joined: voice_agent
   ```

2. **Agent terminal shows:**
   ```
   Session started - Room: voice-session-...
   🧠 Loaded memory
   💬 Waiting for conversation to end...
   ```

3. **You can:**
   - Speak and see transcript in browser
   - Hear agent respond
   - See emotion detection working

## 🚀 Test Right Now

1. **Open**: `http://localhost:5173/voice`
2. **Open browser console** (F12)
3. **Click microphone**
4. **Watch both**:
   - Browser console for connection logs
   - Agent terminal for "Session started"
5. **Say "Hello"**
6. **Wait for response**

---

**The `trackID: undefined` is just the beginning of the handshake. What matters is what happens NEXT!** 🎯

Check your agent terminal and browser console now and let me know what you see!
