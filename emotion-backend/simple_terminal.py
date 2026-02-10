#!/usr/bin/env python
"""
Real-Time Emotion Detection - Terminal Display
Shows emotions directly in Windows PowerShell/Console
"""
import sounddevice as sd
import numpy as np
import requests
import time
import sys
from datetime import datetime

# Configuration
API_URL = "http://localhost:8000/predict"
SAMPLE_RATE = 16000
CHANNELS = 1
BUFFER_DURATION = 2
BUFFER_SIZE = int(SAMPLE_RATE * BUFFER_DURATION)
CHUNK_DURATION = 0.5

class SimpleTerminalDisplay:
    def __init__(self):
        self.audio_buffer = []
        self.is_recording = False
        
    def audio_callback(self, indata, frames, time_info, status):
        """Audio callback"""
        if status:
            print(f"Audio warning: {status}")
        audio_data = indata[:, 0].astype(np.float32)
        self.audio_buffer.extend(audio_data.tolist())
    
    def send_audio(self, audio_chunk):
        """Send audio to backend"""
        try:
            import io
            import soundfile as sf
            
            buffer = io.BytesIO()
            sf.write(buffer, audio_chunk, SAMPLE_RATE, format='WAV')
            buffer.seek(0)
            
            files = {'file': ('audio.wav', buffer, 'audio/wav')}
            response = requests.post(API_URL, files=files, timeout=10)
            
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"Error: {e}")
        return None
    
    def display_emotion(self, data):
        """Display emotion in terminal"""
        if not data:
            return
        
        emotion_emoji = {
            'ang': '😠', 'hap': '😊', 'sad': '😢',
            'neu': '😐', 'fear': '😨', 'dis': '🤢', 'sur': '😲'
        }
        
        emotion_name = {
            'ang': 'ANGRY', 'hap': 'HAPPY', 'sad': 'SAD',
            'neu': 'NEUTRAL', 'fear': 'FEAR', 'dis': 'DISGUST', 'sur': 'SURPRISE'
        }
        
        label = data['label']
        score = data['score']
        response = data['response']
        probs = data['probs']
        
        emoji = emotion_emoji.get(label, '🎤')
        name = emotion_name.get(label, label.upper())
        confidence = int(score * 100)
        
        # Clear and display
        print("\n" + "="*70)
        print(f"{emoji}  {name}  {emoji}")
        print("="*70)
        print(f"Confidence: {confidence}% " + ("█" * (confidence//5)) + ("░" * (20-confidence//5)))
        print(f"Response: {response}")
        print("="*70)
        
        # Show probabilities
        print("\nProbabilities:")
        for emotion, prob in sorted(probs.items(), key=lambda x: x[1], reverse=True):
            percentage = int(prob * 100)
            bar = ("█" * (percentage//5)) + ("░" * (20-percentage//5))
            print(f"  {emotion.upper():6} [{bar}] {percentage}%")
        
        print(f"Time: {datetime.now().strftime('%H:%M:%S')}\n")
    
    def run(self):
        """Main run"""
        print("\n" + "="*70)
        print("🎤 REAL-TIME EMOTION DETECTION (TERMINAL)")
        print("="*70)
        print("\nListening to your microphone...")
        print("Speak into your mic and emotions will appear here!")
        print("Press Ctrl+C to stop\n")
        
        self.is_recording = True
        
        try:
            with sd.InputStream(
                channels=CHANNELS,
                samplerate=SAMPLE_RATE,
                callback=self.audio_callback,
                blocksize=int(SAMPLE_RATE * CHUNK_DURATION)
            ):
                current_emotion = None
                
                while self.is_recording:
                    if len(self.audio_buffer) >= BUFFER_SIZE:
                        audio_chunk = np.array(self.audio_buffer[:BUFFER_SIZE], dtype=np.float32)
                        self.audio_buffer = self.audio_buffer[BUFFER_SIZE:]
                        
                        print("⏳ Processing...")
                        emotion_data = self.send_audio(audio_chunk)
                        
                        if emotion_data:
                            current_emotion = emotion_data
                            self.display_emotion(emotion_data)
                    
                    time.sleep(0.1)
        
        except KeyboardInterrupt:
            print("\n\nGoodbye! 👋\n")
        except Exception as e:
            print(f"\nError: {e}\n")
        finally:
            self.is_recording = False

if __name__ == "__main__":
    display = SimpleTerminalDisplay()
    display.run()
