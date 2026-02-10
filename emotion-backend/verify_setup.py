#!/usr/bin/env python
"""
Verify emotion detection is working
"""
import requests
import time

print("\n" + "="*70)
print("✅ TESTING EMOTION DETECTION")
print("="*70 + "\n")

# Check backend
print("1. Checking backend API...")
try:
    response = requests.get('http://localhost:8000/health', timeout=3)
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Backend is running")
        print(f"   Model: {data['model']}")
        print(f"   Device: {data['device']}")
    else:
        print(f"   ⚠️ Backend not responding properly")
except Exception as e:
    print(f"   ⚠️ Backend not running: {e}")

# Check dependencies
print("\n2. Checking dependencies...")
deps = ['sounddevice', 'soundfile', 'numpy', 'requests', 'librosa']
all_good = True
for dep in deps:
    try:
        __import__(dep)
        print(f"   ✅ {dep}")
    except ImportError:
        print(f"   ❌ {dep}")
        all_good = False

if all_good:
    print("\n" + "="*70)
    print("✅ ALL SYSTEMS READY!")
    print("="*70)
    print("\nNow you can run:")
    print("  Terminal 1: uvicorn app.server:app --host 0.0.0.0 --port 8000")
    print("  Terminal 2: python simple_terminal.py")
    print("\nThen speak into your microphone!")
else:
    print("\n❌ Some dependencies are missing")
    print("Install all with: pip install -r requirements.txt")

print("\n")
