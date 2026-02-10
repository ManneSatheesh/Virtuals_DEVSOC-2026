# -*- coding: utf-8 -*-
"""
Real-time mic → backend API streaming client for Speech Emotion Recognition.
- Captures a 2.5s window every 0.7s from the default microphone.
- Sends WAV (16-bit PCM) to FastAPI /predict endpoint.
- Smooths predictions with EMA and (optionally) speaks a mapped reply.

Run:
    python stream_client.py --api http://localhost:8000/predict
"""

import argparse
import io
import sys
import time
import queue
import numpy as np
import sounddevice as sd
import requests

# Optional offline TTS (server-side voice on your machine)
try:
    import pyttsx3
    HAVE_TTS = True
except Exception:
    HAVE_TTS = False

def ema_update(prev, new, alpha=0.65):
    if prev is None:
        return new
    return alpha * new + (1 - alpha) * prev

def float_to_int16(x: np.ndarray) -> np.ndarray:
    x = np.clip(x, -1.0, 1.0)
    return (x * 32767.0).astype(np.int16)

def encode_wav_int16(int16_mono: np.ndarray, sr: int) -> bytes:
    """Create a mono 16-bit PCM WAV in-memory (no external deps)."""
    import wave, struct
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)  # 16-bit
        w.setframerate(sr)
        w.writeframes(struct.pack("<" + "h"*len(int16_mono), *int16_mono))
    return buf.getvalue()

def energy_vad(y: np.ndarray, threshold: float = 0.005) -> bool:
    """
    Simple energy-based voice gate. Returns True if voiced.
    threshold ~0.003..0.01 depending on mic gain and environment.
    """
    # RMS energy
    rms = np.sqrt(np.mean(y**2) + 1e-12)
    return bool(rms >= threshold)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", type=str, default="http://localhost:8000/predict",
                        help="FastAPI /predict endpoint URL")
    parser.add_argument("--sr", type=int, default=16000, help="Sample rate")
    parser.add_argument("--window", type=float, default=2.5, help="Seconds per classification window")
    parser.add_argument("--hop", type=float, default=0.7, help="Seconds between classifications")
    parser.add_argument("--ema", type=float, default=0.65, help="EMA alpha 0..1")
    parser.add_argument("--vad_threshold", type=float, default=0.005,
                        help="Energy VAD threshold; set 0 to disable gate")
    parser.add_argument("--mute", action="store_true", help="Disable local TTS replies")
    args = parser.parse_args()

    SR = args.sr
    WINDOW_SAMPLES = int(SR * args.window)
    HOP_SAMPLES = int(SR * args.hop)
    BLOCKSIZE = HOP_SAMPLES  # mic callback block ~ hop seconds

    # Init optional TTS
    tts = None
    if not args.mute and HAVE_TTS:
        try:
            tts = pyttsx3.init()
            tts.setProperty('rate', 175)
        except Exception:
            tts = None

    # For speaking less frequently
    speak_cooldown = 2.5  # seconds
    last_spoken_label = None
    last_speak_ts = 0.0

    # Ring buffer and queue
    buf = np.zeros(0, dtype=np.float32)
    q = queue.Queue()

    # Smoothing
    ema_probs = None
    labels_order = None

    def audio_callback(indata, frames, time_info, status):
        if status:
            print(status, file=sys.stderr)
        # Take mono float32
        q.put(indata.copy().reshape(-1))

    print(f"🎙️ Opening microphone at {SR} Hz …")
    with sd.InputStream(channels=1, samplerate=SR, dtype="float32",
                        blocksize=BLOCKSIZE, callback=audio_callback):
        print(f"Listening… Window={args.window:.1f}s  Hop={args.hop:.1f}s")
        print(f"Sending to: {args.api}")
        if args.vad_threshold > 0:
            print(f"Energy VAD: ON (threshold={args.vad_threshold})")
        else:
            print(f"Energy VAD: OFF")
        if tts:
            print("TTS: ON")
        else:
            print("TTS: OFF")

        last_step = 0.0
        try:
            while True:
                try:
                    chunk = q.get(timeout=1.0)
                except queue.Empty:
                    continue

                # Append new audio to buffer
                buf = np.concatenate([buf, chunk])
                # Keep only last window
                if len(buf) > WINDOW_SAMPLES:
                    buf = buf[-WINDOW_SAMPLES:]

                now = time.time()
                if len(buf) >= WINDOW_SAMPLES and (now - last_step) >= args.hop:
                    last_step = now
                    y = buf.copy()

                    # Simple VAD gate (skip silence / very low energy)
                    if args.vad_threshold > 0 and not energy_vad(y, args.vad_threshold):
                        print("\r…", end="", flush=True)
                        continue

                    # Encode to PCM16 WAV in-memory
                    wav_bytes = encode_wav_int16(float_to_int16(y), SR)

                    # Send to backend
                    files = {"file": ("window.wav", wav_bytes, "audio/wav")}
                    try:
                        r = requests.post(args.api, files=files, timeout=30)
                        r.raise_for_status()
                    except Exception as e:
                        print(f"\n[HTTP error] {e}")
                        continue

                    data = r.json()
                    # data: {label, score, probs: {lbl: prob, ...}, response}
                    if labels_order is None:
                        labels_order = list(data["probs"].keys())

                    # Build vector in fixed order
                    probs_vec = np.array([data["probs"].get(lbl, 0.0) for lbl in labels_order], dtype=np.float32)
                    # Smooth
                    ema_probs = ema_update(ema_probs, probs_vec, alpha=args.ema)
                    top_idx = int(np.argmax(ema_probs))
                    top_label = labels_order[top_idx]
                    conf = float(ema_probs[top_idx])

                    # Print top-3
                    top3 = np.argsort(-ema_probs)[:3]
                    msg = " | ".join([f"{labels_order[i]}:{ema_probs[i]:.2f}" for i in top3])
                    print(f"\r👉 {top_label.upper():<10} [{msg}]  ", end="", flush=True)

                    # Speak (optional): only if confident & changed & cooldown elapsed
                    if tts and (conf >= 0.58) and (top_label != last_spoken_label) and (now - last_speak_ts >= speak_cooldown):
                        last_spoken_label = top_label
                        last_speak_ts = now
                        try:
                            tts.stop()
                            tts.say(data.get("response", f"{top_label}"))
                            tts.runAndWait()
                        except Exception as e:
                            print(f"\n[TTS error] {e}")

        except KeyboardInterrupt:
            print("\nStopping… bye!")