# Real-Time Emotion Detection from Microphone

This system captures audio from your microphone in real-time and detects emotions without saving any files.

## Features

✓ Real-time audio capture from microphone  
✓ Automatic emotion detection every 2 seconds  
✓ Visual emotion display with confidence scores  
✓ Probability breakdown for all emotions  
✓ No file recording needed  
✓ Two implementation options (SoundDevice or PyAudio)  

## Setup

### 1. Install Dependencies

```bash
pip install sounddevice requests pyaudio
```

**Note:** If PyAudio installation fails on Windows, you can skip it and use SoundDevice instead.

### 2. Start the Backend API

Open a terminal and run:

```bash
cd emotion-backend
uvicorn app.server:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. Start Real-Time Emotion Detection

Open another terminal and run:

**Option A: Using Launcher (Recommended)**
```bash
cd emotion-backend
python launch_realtime.py
```

Then select option 1 (SoundDevice) or 2 (PyAudio).

**Option B: Direct SoundDevice**
```bash
cd emotion-backend
python realtime_emotion_sd.py
```

**Option C: Direct PyAudio**
```bash
cd emotion-backend
python realtime_emotion.py
```

## Usage

1. **Start the backend API** (Terminal 1)
   ```bash
   uvicorn app.server:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start real-time detection** (Terminal 2)
   ```bash
   python realtime_emotion_sd.py
   ```

3. **Speak into your microphone**
   - The system will automatically capture audio
   - Every 2 seconds, it processes the captured audio
   - Detected emotion is displayed with confidence

4. **Stop** by pressing `Ctrl+C`

## Output Example

```
══════════════════════════════════════════════════════════════
  REAL-TIME EMOTION DETECTION FROM MICROPHONE
══════════════════════════════════════════════════════════════
Sample Rate: 16000 Hz
Channels: 1
Buffer Duration: 2s
API URL: http://localhost:8000/predict
══════════════════════════════════════════════════════════════

Available Audio Devices:
  [0] Microphone (Realtek High Definition Audio) (Input: 2) [DEFAULT]
  [1] Stereo Mix (Realtek High Definition Audio) (Input: 2)

🎤 Microphone active! Speak into your microphone...
Press Ctrl+C to stop.

[14:23:45] Processing 2.0s of audio...
╔════════════════════════════════════════╗
║  DETECTED EMOTION: HAPPY 😊            ║
║  Confidence:  87.45%                   ║
║  Response: You sound upbeat! Great to hear. How can I assist further?║
╚════════════════════════════════════════╝
  Probabilities:
    HAP: [██████████████████████████░░░░] 87.45%
    NEU: [█████░░░░░░░░░░░░░░░░░░░░░░░░░░] 8.32%
    SAD: [██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 2.81%
    ANG: [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 1.42%
```

## Emotion Codes

| Code | Emotion | Emoji |
|------|---------|-------|
| ang  | Angry   | 😠    |
| hap  | Happy   | 😊    |
| sad  | Sad     | 😢    |
| neu  | Neutral | 😐    |
| fear | Fear    | 😨    |
| dis  | Disgust | 🤢    |
| sur  | Surprise| 😲    |

## Configuration

Edit the script to change:

```python
API_URL = "http://localhost:8000/predict"  # Backend API endpoint
SAMPLE_RATE = 16000                         # Audio sample rate (Hz)
BUFFER_DURATION = 2                         # Process every N seconds
CHUNK_DURATION = 0.5                        # Chunk capture size (seconds)
```

## Troubleshooting

### Microphone Not Found
- Check available devices in the script output
- Edit the script and specify device index if needed

### API Connection Error
- Make sure backend is running on port 8000
- Check: `curl http://localhost:8000/health`

### High CPU Usage
- Reduce `BUFFER_DURATION` or increase chunk processing time
- Use GPU if available (configure in `app/config.py`)

## Files

- `realtime_emotion_sd.py` - Main real-time detector (SoundDevice)
- `realtime_emotion.py` - Real-time detector (PyAudio)
- `launch_realtime.py` - Interactive launcher
- `app/server.py` - Backend FastAPI server
