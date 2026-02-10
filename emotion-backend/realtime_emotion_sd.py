#!/usr/bin/env python
"""
Real-time Emotion Detection from Microphone (sounddevice version)
Captures audio in real-time and sends to backend for emotion detection
Alternative to PyAudio - often easier to install
"""
import sounddevice as sd
import numpy as np
import requests
import threading
import time
from collections import deque
from datetime import datetime

# Configuration
API_URL = "http://localhost:8000/predict"
SAMPLE_RATE = 16000
CHANNELS = 1
BUFFER_DURATION = 2  # Process every 2 seconds
BUFFER_SIZE = int(SAMPLE_RATE * BUFFER_DURATION)
CHUNK_DURATION = 0.5  # Capture 0.5s at a time

class RealtimeEmotionDetectorSD:
    def __init__(self):
        self.audio_buffer = deque(maxlen=BUFFER_SIZE)
        self.is_recording = False
        self.latest_emotion = None
        self.latest_confidence = 0.0
        self.lock = threading.Lock()
        
    def audio_callback(self, indata, frames, time_info, status):
        """Sounddevice callback for audio input"""
        if status:
            print(f"Audio Status: {status}")
        
        # Copy audio data to buffer
        audio_data = indata[:, 0].astype(np.float32)
        
        with self.lock:
            self.audio_buffer.extend(audio_data)
    
    def send_audio_chunk(self, audio_chunk):
        """Send audio chunk to backend for emotion detection"""
        try:
            import io
            import soundfile as sf
            
            buffer = io.BytesIO()
            sf.write(buffer, audio_chunk, SAMPLE_RATE, format='WAV')
            buffer.seek(0)
            
            files = {'file': ('audio.wav', buffer, 'audio/wav')}
            response = requests.post(API_URL, files=files, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                with self.lock:
                    self.latest_emotion = result['label']
                    self.latest_confidence = result['score']
                
                return result
            else:
                print(f"API Error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error sending audio: {e}")
            return None
    
    def processing_thread(self):
        """Background thread to process audio chunks"""
        print("Processing thread started...")
        
        while self.is_recording:
            with self.lock:
                if len(self.audio_buffer) >= BUFFER_SIZE:
                    audio_chunk = np.array(list(self.audio_buffer), dtype=np.float32)
                else:
                    time.sleep(0.1)
                    continue
            
            if len(audio_chunk) > 0:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Processing {len(audio_chunk)/SAMPLE_RATE:.1f}s of audio...")
                result = self.send_audio_chunk(audio_chunk)
                
                if result:
                    emotion_map = {
                        'ang': 'ANGRY 😠',
                        'hap': 'HAPPY 😊',
                        'sad': 'SAD 😢',
                        'neu': 'NEUTRAL 😐',
                        'fear': 'FEAR 😨',
                        'dis': 'DISGUST 🤢',
                        'sur': 'SURPRISE 😲'
                    }
                    
                    label = result['label']
                    emotion_display = emotion_map.get(label, label.upper())
                    confidence = result['score']
                    
                    print(f"╔════════════════════════════════════════╗")
                    print(f"║  DETECTED EMOTION: {emotion_display:<19}║")
                    print(f"║  Confidence: {confidence*100:>6.2f}%{' '*21}║")
                    print(f"║  Response: {result['response']:<24}║")
                    print(f"╚════════════════════════════════════════╝")
                    
                    print("  Probabilities:")
                    for emotion, prob in sorted(result['probs'].items(), key=lambda x: x[1], reverse=True):
                        bar_length = int(prob * 30)
                        bar = "█" * bar_length + "░" * (30 - bar_length)
                        print(f"    {emotion.upper():>4}: [{bar}] {prob*100:>6.2f}%")
            
            time.sleep(0.5)
    
    def start(self):
        """Start real-time emotion detection"""
        print("\n" + "="*50)
        print("  REAL-TIME EMOTION DETECTION FROM MICROPHONE")
        print("="*50)
        print(f"Sample Rate: {SAMPLE_RATE} Hz")
        print(f"Channels: {CHANNELS}")
        print(f"Buffer Duration: {BUFFER_DURATION}s")
        print(f"API URL: {API_URL}")
        print("="*50)
        print("\nInitializing microphone...\n")
        
        self.is_recording = True
        
        # Start processing thread
        processor = threading.Thread(target=self.processing_thread, daemon=True)
        processor.start()
        
        try:
            # List available devices
            print("Available Audio Devices:")
            devices = sd.query_devices()
            for i, device in enumerate(devices):
                if device['max_input_channels'] > 0:
                    default_marker = " [DEFAULT]" if i == sd.default.device[0] else ""
                    print(f"  [{i}] {device['name']} (Input: {device['max_input_channels']})${default_marker}")
            print()
            
            # Create audio stream
            with sd.InputStream(
                channels=CHANNELS,
                samplerate=SAMPLE_RATE,
                callback=self.audio_callback,
                blocksize=int(SAMPLE_RATE * CHUNK_DURATION)
            ):
                print("🎤 Microphone active! Speak into your microphone...")
                print("Press Ctrl+C to stop.\n")
                
                try:
                    while self.is_recording:
                        time.sleep(0.1)
                except KeyboardInterrupt:
                    print("\n\nStopping...")
            
            self.is_recording = False
            print("✓ Microphone closed. Goodbye!")
            
        except Exception as e:
            print(f"Error: {e}")
            self.is_recording = False

if __name__ == "__main__":
    detector = RealtimeEmotionDetectorSD()
    detector.start()
