import io
import numpy as np
import soundfile as sf
import librosa

def read_audio_to_mono_float32(file_bytes: bytes):
    """Return (waveform_float32_mono, sample_rate)."""
    wav, sr = sf.read(io.BytesIO(file_bytes), dtype="float32", always_2d=False)
    if wav.ndim > 1:
        wav = wav.mean(axis=1)  # mono
    return wav, sr

def resample_if_needed(wav: np.ndarray, sr: int, target_sr: int):
    if sr == target_sr:
        return wav, sr
    y = librosa.resample(wav, orig_sr=sr, target_sr=target_sr)
    return y.astype(np.float32), target_sr

def normalize_if_needed(y: np.ndarray):
    # Optional, avoid clipping if badly recorded
    m = np.max(np.abs(y)) + 1e-9
    if m > 1.0:
        y = y / m
    return y

def to_prob_vector(labels, values):
    """Ensure values are probabilities; if not, apply softmax."""
    vals = np.array(values, dtype=np.float32)
    if (vals < 0).any() or (vals > 1).any() or vals.sum() > 1.5:
        exp = np.exp(vals - vals.max())
        vals = exp / (exp.sum() + 1e-9)
    return {label: float(v) for label, v in zip(labels, vals)}

__all__ = ["read_audio_to_mono_float32", "resample_if_needed", "normalize_if_needed", "to_prob_vector"]