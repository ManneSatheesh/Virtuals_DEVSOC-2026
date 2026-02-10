#!/usr/bin/env python
"""
Quick Start Guide - Run this to verify everything is set up
"""
import subprocess
import sys
import time
import requests

print("\n" + "="*60)
print("  REAL-TIME EMOTION DETECTION - QUICK START GUIDE")
print("="*60)

# Check Python version
print(f"\n✓ Python Version: {sys.version.split()[0]}")

# Check dependencies
print("\nChecking dependencies...")
dependencies = {
    'fastapi': 'FastAPI',
    'uvicorn': 'Uvicorn', 
    'transformers': 'Transformers',
    'torch': 'PyTorch',
    'sounddevice': 'SoundDevice',
    'soundfile': 'SoundFile',
    'librosa': 'Librosa',
    'requests': 'Requests'
}

missing = []
for package, name in dependencies.items():
    try:
        __import__(package)
        print(f"  ✓ {name}")
    except ImportError:
        print(f"  ✗ {name} (MISSING)")
        missing.append(package)

if missing:
    print(f"\n⚠ Missing packages. Install with:")
    print(f"  pip install {' '.join(missing)}")
    print("\nThen run this script again.")
    sys.exit(1)

# Check backend API
print("\nChecking backend API on port 8000...")
for attempt in range(5):
    try:
        response = requests.get('http://localhost:8000/health', timeout=2)
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ Backend API is running")
            print(f"    - Model: {data['model']}")
            print(f"    - Device: {data['device']}")
            break
    except requests.exceptions.ConnectionError:
        if attempt < 4:
            print(f"  ⏳ Waiting for API... ({attempt+1}/5)")
            time.sleep(2)
        else:
            print("  ✗ Backend API is NOT running")
            print("\n📝 Start the backend with (in a separate terminal):")
            print("    cd emotion-backend")
            print("    uvicorn app.server:app --host 0.0.0.0 --port 8000 --reload")
            sys.exit(1)

print("\n" + "="*60)
print("  ✓ ALL SYSTEMS READY!")
print("="*60)

print("\n📌 NEXT STEPS:")
print("\n1. Make sure backend is still running (you should see it in another terminal)")
print("\n2. Run the real-time emotion detector:")
print("    python realtime_emotion_sd.py")
print("   OR")
print("    python launch_realtime.py")
print("\n3. Speak into your microphone and watch emotions appear!")

print("\n" + "="*60)
print("  FEATURES")
print("="*60)
print("✓ Real-time microphone capture")
print("✓ Automatic 2-second emotion detection")
print("✓ Visual emotion display with emoji")
print("✓ Confidence scores and probabilities")
print("✓ No file recording needed")
print("✓ Multiple emotion support (angry, happy, sad, neutral, etc.)")

print("\n" + "="*60)
print("  For more details, see: REALTIME_README.md")
print("="*60 + "\n")
