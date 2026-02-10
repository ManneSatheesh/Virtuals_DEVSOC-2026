#!/usr/bin/env python
"""
Launcher for Real-time Emotion Detection
Choose between PyAudio or SoundDevice implementations
"""
import sys
import subprocess

def main():
    print("\n" + "="*50)
    print("  REAL-TIME EMOTION DETECTION LAUNCHER")
    print("="*50)
    print("\nChoose audio input method:\n")
    print("  [1] SoundDevice (RECOMMENDED - easier)")
    print("  [2] PyAudio")
    print("  [q] Quit\n")
    
    choice = input("Enter your choice (1/2/q): ").strip().lower()
    
    if choice == '1':
        print("\n✓ Starting with SoundDevice...\n")
        try:
            subprocess.run([sys.executable, 'realtime_emotion_sd.py'], check=False)
        except Exception as e:
            print(f"Error: {e}")
            print("Try installing: pip install sounddevice")
    
    elif choice == '2':
        print("\n✓ Starting with PyAudio...\n")
        try:
            subprocess.run([sys.executable, 'realtime_emotion.py'], check=False)
        except Exception as e:
            print(f"Error: {e}")
            print("Try installing: pip install pyaudio")
    
    elif choice == 'q':
        print("\nGoodbye!")
    
    else:
        print("\n✗ Invalid choice. Please try again.")
        main()

if __name__ == "__main__":
    main()
