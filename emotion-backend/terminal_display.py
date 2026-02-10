#!/usr/bin/env python
"""
Terminal-based real-time emotion display
Captures microphone and shows beautiful emotion visualization in terminal
"""
import sounddevice as sd
import numpy as np
import requests
import time
from datetime import datetime
from collections import deque

# Configuration
API_URL = "http://localhost:8000/predict"
SAMPLE_RATE = 16000
CHANNELS = 1
BUFFER_DURATION = 2
BUFFER_SIZE = int(SAMPLE_RATE * BUFFER_DURATION)
CHUNK_DURATION = 0.5

class TerminalEmotionDisplay:
    def __init__(self):
        self.audio_buffer = deque(maxlen=BUFFER_SIZE)
        self.is_recording = False
        self.history = deque(maxlen=5)  # Keep last 5 emotions
        
    def clear_screen(self):
        """Clear terminal screen"""
        import os
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def print_header(self):
        """Print dashboard header"""
        print("\n" + "█" * 70)
        print("║" + " " * 68 + "║")
        print("║" + "  🎤 REAL-TIME EMOTION DETECTION DASHBOARD".center(68) + "║")
        print("║" + " " * 68 + "║")
        print("█" * 70)
    
    def print_emotion_box(self, emotion_data):
        """Print emotion display box"""
        if not emotion_data:
            print("\n" + "╔" + "═" * 68 + "╗")
            print("║" + "  Waiting for audio input...".center(68) + "║")
            print("╚" + "═" * 68 + "╝\n")
            return
        
        label = emotion_data['label']
        score = emotion_data['score']
        response = emotion_data['response']
        probs = emotion_data['probs']
        
        emoji_map = {
            'ang': '😠',
            'hap': '😊',
            'sad': '😢',
            'neu': '😐',
            'fear': '😨',
            'dis': '🤢',
            'sur': '😲'
        }
        
        name_map = {
            'ang': 'ANGRY',
            'hap': 'HAPPY',
            'sad': 'SAD',
            'neu': 'NEUTRAL',
            'fear': 'FEAR',
            'dis': 'DISGUST',
            'sur': 'SURPRISE'
        }
        
        emoji = emoji_map.get(label, '🎤')
        name = name_map.get(label, label.upper())
        confidence = int(score * 100)
        
        # Main emotion box
        print("\n" + "╔" + "═" * 68 + "╗")
        print("║" + f"  {emoji}  {name}  {emoji}".center(68) + "║")
        print("║" + " " * 68 + "║")
        
        # Confidence bar
        bar_length = 50
        filled = int(bar_length * score)
        bar = "█" * filled + "░" * (bar_length - filled)
        print("║" + f"  Confidence: [{bar}] {confidence}%".ljust(68) + "║")
        print("║" + " " * 68 + "║")
        
        # Response
        response_line = response[:65]
        print("║" + f"  💬 {response_line}".ljust(68) + "║")
        print("╚" + "═" * 68 + "╝")
        
        # Probability breakdown
        print("\n" + "┌" + "─" * 68 + "┐")
        print("│" + "  Emotion Probabilities:".ljust(68) + "│")
        print("├" + "─" * 68 + "┤")
        
        sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)
        for emotion, prob in sorted_probs:
            percentage = int(prob * 100)
            bar_filled = int(20 * prob)
            bar = "█" * bar_filled + "░" * (20 - bar_filled)
            emotion_name = name_map.get(emotion, emotion.upper()).ljust(8)
            print("│  " + f"{emotion_name} [{bar}] {percentage:>3}%".ljust(66) + "│")
        
        print("└" + "─" * 68 + "┘")
    
    def print_status(self, connected=True, buffer_size=0):
        """Print connection and buffer status"""
        status_icon = "🟢" if connected else "🔴"
        connection_text = "Connected" if connected else "Disconnected"
        
        print("\n" + "╔" + "═" * 68 + "╗")
        print("║" + f"  Status: {status_icon} {connection_text} | Buffer: {buffer_size}/{BUFFER_SIZE}".ljust(68) + "║")
        print("║" + f"  Time: {datetime.now().strftime('%H:%M:%S')}".ljust(68) + "║")
        print("║" + "  Press Ctrl+C to stop".ljust(68) + "║")
        print("╚" + "═" * 68 + "╝\n")
    
    def audio_callback(self, indata, frames, time_info, status):
        """Audio callback to capture microphone data"""
        if status:
            print(f"⚠️  Audio status: {status}")
        
        audio_data = indata[:, 0].astype(np.float32)
        self.audio_buffer.extend(audio_data)
    
    def send_audio_chunk(self, audio_chunk):
        """Send audio to backend and get emotion"""
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
            else:
                print(f"❌ API Error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def run(self):
        """Start the terminal display"""
        self.is_recording = True
        
        try:
            self.print_header()
            print("\n🎙️  Initializing microphone...\n")
            
            # List devices
            print("Available audio devices:")
            devices = sd.query_devices()
            for i, device in enumerate(devices):
                if device['max_input_channels'] > 0:
                    default = "[DEFAULT]" if i == sd.default.device[0] else ""
                    print(f"  [{i}] {device['name']} {default}")
            print()
            
            with sd.InputStream(
                channels=CHANNELS,
                samplerate=SAMPLE_RATE,
                callback=self.audio_callback,
                blocksize=int(SAMPLE_RATE * CHUNK_DURATION)
            ):
                print("✅ Microphone active!\n")
                self.print_status(connected=True)
                
                current_emotion = None
                last_update = time.time()
                
                while self.is_recording:
                    # Process audio every 2 seconds
                    if len(self.audio_buffer) >= BUFFER_SIZE:
                        audio_chunk = np.array(list(self.audio_buffer), dtype=np.float32)
                        
                        # Clear screen and display
                        self.clear_screen()
                        self.print_header()
                        
                        # Send to backend
                        print("\n⏳ Processing audio...\n")
                        emotion_data = self.send_audio_chunk(audio_chunk)
                        
                        if emotion_data:
                            current_emotion = emotion_data
                            self.history.append(emotion_data)
                        
                        last_update = time.time()
                    
                    # Display current emotion
                    self.clear_screen()
                    self.print_header()
                    self.print_emotion_box(current_emotion)
                    self.print_status(connected=True, buffer_size=len(self.audio_buffer))
                    
                    time.sleep(0.5)
        
        except KeyboardInterrupt:
            print("\n\n" + "█" * 70)
            print("║" + "  👋 Thanks for using Emotion Detection!".center(68) + "║")
            print("█" * 70 + "\n")
        
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print(f"Make sure the backend API is running on port 8000")
        
        finally:
            self.is_recording = False

if __name__ == "__main__":
    display = TerminalEmotionDisplay()
    display.run()
