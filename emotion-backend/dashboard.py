#!/usr/bin/env python
"""
WebSocket-based emotion display server
Connects microphone capture to web dashboard
"""
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import sounddevice as sd
import numpy as np
import requests
import json
from datetime import datetime

app = FastAPI(title="Emotion Display Dashboard")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_URL = "http://localhost:8000/predict"
SAMPLE_RATE = 16000
CHANNELS = 1
BUFFER_DURATION = 2
BUFFER_SIZE = int(SAMPLE_RATE * BUFFER_DURATION)
CHUNK_DURATION = 0.5

class EmotionCapture:
    def __init__(self):
        self.audio_buffer = np.array([], dtype=np.float32)
        self.is_recording = False
        self.latest_emotion = None
        
    async def capture_and_process(self, websocket):
        """Capture audio and send emotions to websocket"""
        
        def audio_callback(indata, frames, time_info, status):
            if status:
                print(f"Audio status: {status}")
            audio_data = indata[:, 0].astype(np.float32)
            self.audio_buffer = np.concatenate([self.audio_buffer, audio_data])
            
            # Process when buffer is full
            if len(self.audio_buffer) >= BUFFER_SIZE:
                chunk = self.audio_buffer[:BUFFER_SIZE]
                self.audio_buffer = self.audio_buffer[BUFFER_SIZE:]
                
                # Send to backend
                asyncio.create_task(self.process_emotion(chunk, websocket))
        
        try:
            with sd.InputStream(
                channels=CHANNELS,
                samplerate=SAMPLE_RATE,
                callback=audio_callback,
                blocksize=int(SAMPLE_RATE * CHUNK_DURATION)
            ):
                while True:
                    await asyncio.sleep(0.1)
        except Exception as e:
            print(f"Error in capture: {e}")
    
    async def process_emotion(self, audio_chunk, websocket):
        """Send audio to backend and get emotion"""
        try:
            import io
            import soundfile as sf
            
            buffer = io.BytesIO()
            sf.write(buffer, audio_chunk, SAMPLE_RATE, format='WAV')
            buffer.seek(0)
            
            files = {'file': ('audio.wav', buffer, 'audio/wav')}
            response = requests.post(BACKEND_URL, files=files, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                self.latest_emotion = result
                
                # Send to websocket
                await websocket.send_json({
                    "type": "emotion",
                    "timestamp": datetime.now().isoformat(),
                    "data": result
                })
        except Exception as e:
            print(f"Error processing emotion: {e}")

emotion_capture = EmotionCapture()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        await emotion_capture.capture_and_process(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")

@app.get("/", response_class=HTMLResponse)
async def get_dashboard():
    return HTML_DASHBOARD

HTML_DASHBOARD = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Real-Time Emotion Detection Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            background: #e8f5e9;
            color: #2e7d32;
        }
        
        .status.inactive {
            background: #ffebee;
            color: #c62828;
        }
        
        .emotion-display {
            text-align: center;
            margin: 30px 0;
            padding: 30px;
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            border-radius: 15px;
        }
        
        .emoji {
            font-size: 80px;
            margin-bottom: 15px;
            animation: bounce 0.6s;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .emotion-label {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .confidence {
            font-size: 18px;
            color: #666;
            margin-bottom: 20px;
        }
        
        .confidence-bar {
            width: 100%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        
        .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .response-text {
            font-size: 14px;
            color: #666;
            font-style: italic;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .probabilities {
            margin-top: 30px;
        }
        
        .probabilities h3 {
            color: #333;
            font-size: 16px;
            margin-bottom: 15px;
        }
        
        .probability-item {
            margin-bottom: 12px;
        }
        
        .probability-label {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin-bottom: 4px;
            color: #555;
            font-weight: 500;
        }
        
        .probability-bar {
            width: 100%;
            height: 6px;
            background: #f0f0f0;
            border-radius: 3px;
            overflow: hidden;
        }
        
        .probability-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 3px;
            transition: width 0.3s ease;
        }
        
        .timestamp {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 20px;
        }
        
        .mic-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
            font-size: 14px;
            color: #666;
        }
        
        .mic-dot {
            width: 12px;
            height: 12px;
            background: #2e7d32;
            border-radius: 50%;
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .error-message {
            padding: 15px;
            background: #ffebee;
            color: #c62828;
            border-radius: 8px;
            margin-top: 20px;
            display: none;
        }
        
        .emotion-emoji {
            ang: '😠',
            hap: '😊',
            sad: '😢',
            neu: '😐',
            fear: '😨',
            dis: '🤢',
            sur: '😲'
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎤 Emotion Detection</h1>
            <div class="status" id="status">Connecting...</div>
        </div>
        
        <div class="emotion-display" id="emotionDisplay">
            <div class="emoji" id="emoji">🎤</div>
            <div class="emotion-label" id="emotionLabel">Listening...</div>
            <div class="confidence">Confidence: <span id="confidenceText">0%</span></div>
            <div class="confidence-bar">
                <div class="confidence-fill" id="confidenceFill"></div>
            </div>
        </div>
        
        <div class="response-text" id="responseText">
            Waiting for audio...
        </div>
        
        <div class="probabilities">
            <h3>Emotion Probabilities</h3>
            <div id="probabilitiesContainer"></div>
        </div>
        
        <div class="mic-indicator">
            <div class="mic-dot" id="micDot"></div>
            <span id="micStatus">Microphone: Standby</span>
        </div>
        
        <div class="timestamp" id="timestamp"></div>
        
        <div class="error-message" id="errorMessage"></div>
    </div>
    
    <script>
        const emotionEmoji = {
            'ang': '😠',
            'hap': '😊',
            'sad': '😢',
            'neu': '😐',
            'fear': '😨',
            'dis': '🤢',
            'sur': '😲'
        };
        
        const emotionNames = {
            'ang': 'ANGRY',
            'hap': 'HAPPY',
            'sad': 'SAD',
            'neu': 'NEUTRAL',
            'fear': 'FEAR',
            'dis': 'DISGUST',
            'sur': 'SURPRISE'
        };
        
        function connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
            
            ws.onopen = function() {
                console.log('Connected to emotion detection server');
                document.getElementById('status').textContent = '🟢 Active';
                document.getElementById('status').classList.remove('inactive');
                document.getElementById('micStatus').textContent = 'Microphone: Active';
                document.getElementById('errorMessage').style.display = 'none';
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                
                if (message.type === 'emotion') {
                    const data = message.data;
                    updateEmotionDisplay(data);
                }
            };
            
            ws.onerror = function(error) {
                console.error('WebSocket error:', error);
                showError('Connection error. Make sure the backend is running on port 8000');
                document.getElementById('status').textContent = '🔴 Error';
                document.getElementById('status').classList.add('inactive');
            };
            
            ws.onclose = function() {
                console.log('Disconnected from emotion detection server');
                document.getElementById('status').textContent = '🔴 Disconnected';
                document.getElementById('status').classList.add('inactive');
                document.getElementById('micStatus').textContent = 'Microphone: Offline';
                
                // Attempt to reconnect after 3 seconds
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function updateEmotionDisplay(data) {
            const label = data.label;
            const score = data.score;
            const probs = data.probs;
            const response = data.response;
            
            // Update emotion label and emoji
            const emotionLabel = emotionNames[label] || label.toUpperCase();
            const emoji = emotionEmoji[label] || '🎤';
            
            document.getElementById('emotionLabel').textContent = emotionLabel;
            document.getElementById('emoji').textContent = emoji;
            
            // Update confidence
            const confidence = Math.round(score * 100);
            document.getElementById('confidenceText').textContent = `${confidence}%`;
            document.getElementById('confidenceFill').style.width = `${confidence}%`;
            
            // Update response
            document.getElementById('responseText').textContent = response;
            
            // Update timestamp
            const now = new Date();
            document.getElementById('timestamp').textContent = 
                `Last update: ${now.toLocaleTimeString()}`;
            
            // Update probabilities
            updateProbabilities(probs);
        }
        
        function updateProbabilities(probs) {
            const container = document.getElementById('probabilitiesContainer');
            container.innerHTML = '';
            
            // Sort by probability
            const sorted = Object.entries(probs)
                .sort(([, a], [, b]) => b - a);
            
            sorted.forEach(([emotion, probability]) => {
                const percentage = Math.round(probability * 100);
                const html = `
                    <div class="probability-item">
                        <div class="probability-label">
                            <span>${emotion.toUpperCase()}</span>
                            <span>${percentage}%</span>
                        </div>
                        <div class="probability-bar">
                            <div class="probability-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
                container.innerHTML += html;
            });
        }
        
        function showError(message) {
            const errorElement = document.getElementById('errorMessage');
            errorElement.textContent = '❌ ' + message;
            errorElement.style.display = 'block';
        }
        
        // Connect on page load
        document.addEventListener('DOMContentLoaded', function() {
            connectWebSocket();
        });
    </script>
</body>
</html>
"""

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*60)
    print("  EMOTION DISPLAY DASHBOARD")
    print("="*60)
    print("\n🌐 Open your browser at: http://localhost:8001")
    print("\n📝 Make sure the backend API is running on port 8000:")
    print("   uvicorn app.server:app --host 0.0.0.0 --port 8000")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
