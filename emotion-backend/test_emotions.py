#!/usr/bin/env python
"""Quick test for emotion detection backend"""
import sys
import subprocess
import time

print("=" * 60)
print("  EMOTION DETECTION SYSTEM - QUICK TEST")
print("=" * 60)

# Step 1: Check Python
print(f"\n✓ Python: {sys.version.split()[0]}")

# Step 2: Check imports
print("\nChecking dependencies:")
deps = {
    'fastapi': 'FastAPI',
    'uvicorn': 'Uvicorn',
    'transformers': 'Transformers',
    'torch': 'PyTorch',
    'sounddevice': 'SoundDevice',
    'numpy': 'NumPy'
}

missing = []
for pkg, name in deps.items():
    try:
        __import__(pkg)
        print(f"  ✓ {name}")
    except ImportError:
        print(f"  ✗ {name}")
        missing.append(pkg)

if missing:
    print(f"\n⚠ Missing: {', '.join(missing)}")
    print("Installing...")
    subprocess.run([sys.executable, "-m", "pip", "install"] + missing)

# Step 3: Test model loading
print("\nLoading emotion detection model...")
print("(This may take 1-2 minutes on first run)")

try:
    from transformers import pipeline
    print("  → Initializing wav2vec2-base-superb-er model...")
    clf = pipeline(
        "audio-classification",
        model="superb/wav2vec2-base-superb-er",
        device=-1  # CPU
    )
    print("✓ Model loaded successfully!")
    
    # Test with dummy audio
    print("\n✓ Testing with sample audio...")
    import numpy as np
    test_audio = np.random.randn(16000).astype(np.float32)
    result = clf({"array": test_audio, "sampling_rate": 16000})
    
    print(f"\n✓ Detection works! Sample emotions detected:")
    for r in result[:3]:
        print(f"  - {r['label']}: {r['score']:.2%}")
    
    print("\n" + "=" * 60)
    print("✅ EMOTION DETECTION IS WORKING!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
