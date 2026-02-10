# 🚀 START HERE - AI Interaction Feature

## ⚡ Quick Start (3 Steps)

### Step 1: Start Python Agent
Open **PowerShell Terminal 1**:
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
.\start_agent.bat
```

**Wait for this message:**
```
INFO:livekit.agents:registered worker
```

✅ **Keep this terminal open!** Don't close it.

---

### Step 2: Start API Server
Open **PowerShell Terminal 2** (new window):
```powershell
cd "c:\vs code\Assistant\phone-call-backend"
.\start_server.bat
```

**Wait for this message:**
```
🚀 Phone Call Backend API running on http://localhost:3002
```

✅ **Keep this terminal open!**

---

### Step 3: Start Frontend
Open **PowerShell Terminal 3** (new window):
```powershell
cd "c:\vs code\Assistant\frontend"
npm run dev
```

**Wait for this message:**
```
➜  Local:   http://localhost:5173/
```

✅ **Keep this terminal open!**

---

### Step 4: Open Browser
Navigate to: **http://localhost:5173/ai-interaction**

You'll see two tabs:
- **🖥️ Dev Mode** - Web-based voice interaction
- **📞 Phone Call** - AI calls your phone

---

## 🎯 Try It Out!

### Option 1: Dev Mode (Quick Test)
1. Click **"Dev Mode"** tab
2. Click the microphone button
3. Allow browser microphone access
4. Say "Hello!"
5. AI responds through your speakers

### Option 2: Phone Call Mode
1. Click **"Phone Call"** tab
2. Country code: **+91** (India)
3. Enter your number: e.g., `8667382469`
4. Click **"Call Me"**
5. **Your phone will ring in 5-10 seconds!**
6. Answer and talk to the AI

---

## ⚠️ Common Issues

### "Port 8081 already in use"
**Problem:** Agent won't start, shows port error

**Solution:** Kill the old process:
```powershell
# Find the process
netstat -ano | findstr :8081

# Kill it (replace XXXXX with the PID number)
taskkill /F /PID XXXXX

# Then restart the agent
.\start_agent.bat
```

### "Port 3002 already in use"
**Problem:** API server won't start

**Solution:**
```powershell
# Find the process
netstat -ano | findstr :3002

# Kill it
taskkill /F /PID XXXXX

# Restart
.\start_server.bat
```

### Agent shows errors
**Problem:** Python errors in Terminal 1

**Solution:** Check your `.env` file has correct credentials:
```powershell
notepad .env
```

Verify these are set:
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `GOOGLE_API_KEY`
- `DEEPGRAM_API_KEY`
- `OUTBOUND_TRUNK_ID`

---

## 🛑 How to Stop Everything

Press **Ctrl+C** in each terminal window:
1. Terminal 1 (Agent) - Press Ctrl+C
2. Terminal 2 (API Server) - Press Ctrl+C  
3. Terminal 3 (Frontend) - Press Ctrl+C

---

## 📱 Phone Number Format

When using Phone Call Mode:
- ✅ **Correct**: `9876543210` (10 digits, no spaces)
- ❌ **Wrong**: `+91 9876543210` (don't include country code in input)
- ❌ **Wrong**: `98765 43210` (no spaces)

The country code selector (+91) is separate!

---

## 💡 Tips

### For Best Results:
- **Use headphones** in Dev Mode to avoid echo
- **Speak clearly** - the AI is listening!
- **Wait for AI to finish** before speaking again
- **Check all 3 terminals** are running before testing

### Your Phone Call Settings:
- **Caller ID**: +918071387318 (what you'll see when AI calls)
- **Your Vobiz Domain**: 2f16686b.sip.vobiz.ai
- **SIP Trunk**: ST_3q8tVUGjZ4Lz

---

## ✅ Checklist Before Starting

- [ ] All 3 terminals open
- [ ] Terminal 1 shows "registered worker"
- [ ] Terminal 2 shows "running on port 3002"
- [ ] Terminal 3 shows "Local: http://localhost:5173"
- [ ] Browser open to `/ai-interaction`

---

## 🎉 You're Ready!

Everything is configured. Just follow the 3 steps above and start interacting with your AI assistant!

**Need help?** Check:
- `READY_TO_USE.md` - Full guide
- `AI_INTERACTION_SETUP.md` - Detailed setup
- `phone-call-backend/README.md` - API docs

---

**Quick Copy-Paste Commands:**

```powershell
# Terminal 1
cd "c:\vs code\Assistant\phone-call-backend" ; .\start_agent.bat

# Terminal 2  
cd "c:\vs code\Assistant\phone-call-backend" ; .\start_server.bat

# Terminal 3
cd "c:\vs code\Assistant\frontend" ; npm run dev
```

Then open: **http://localhost:5173/ai-interaction** 🚀
