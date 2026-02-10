from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import torch
import numpy as np

from .config import MODEL_ID, TEXT_MODEL_ID, SAMPLE_RATE, CORS_ALLOW_ORIGINS, DEVICE_PREFERENCE
from .responses import RESPONSES, TEXT_RESPONSES
from .utils import read_audio_to_mono_float32, resample_if_needed, normalize_if_needed, to_prob_vector

# ---------- App ----------
app = FastAPI(title="Emotion Backend", version="1.0.0")

# CORS
allow_origins = [o.strip() for o in CORS_ALLOW_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Model ----------
def select_device():
    if DEVICE_PREFERENCE == "gpu" and torch.cuda.is_available():
        return 0
    if DEVICE_PREFERENCE == "cpu":
        return -1
    # auto
    return 0 if torch.cuda.is_available() else -1

device_arg = select_device()
clf = None
text_clf = None

def get_model():
    global clf
    if clf is None:
        clf = pipeline(
            task="audio-classification",
            model=MODEL_ID,
            device=device_arg,
            top_k=None,
            truncation=True
        )
    return clf

def get_text_model():
    global text_clf
    if text_clf is None:
        text_clf = pipeline(
            task="text-classification",
            model=TEXT_MODEL_ID,
            device=device_arg,
            top_k=None,
            truncation=True,
            max_length=512,
        )
    return text_clf

# ---------- Schemas ----------
class PredictOut(BaseModel):
    label: str
    score: float
    probs: dict
    response: str

class TextPredictIn(BaseModel):
    text: str

class TextPredictOut(BaseModel):
    label: str
    score: float
    probs: dict
    response: str

# ---------- Routes ----------
@app.on_event("startup")
async def startup_event():
    """Pre-load models on startup so first request is fast."""
    print("🚀 Pre-loading emotion models...")
    try:
        print("   📦 Loading text emotion model...")
        get_text_model()
        print("   ✅ Text model loaded!")
        print("   📦 Loading audio emotion model...")
        get_model()
        print("   ✅ Audio model loaded!")
        print("🎭 Emotion detection ready!")
    except Exception as e:
        print(f"   ⚠️ Model pre-load warning: {e}")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "audio_model": MODEL_ID,
        "text_model": TEXT_MODEL_ID,
        "device": "gpu" if device_arg == 0 else "cpu",
    }

@app.post("/predict", response_model=PredictOut)
async def predict(file: UploadFile = File(...)):
    try:
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Empty file")
        wav, sr = read_audio_to_mono_float32(data)
        wav, sr = resample_if_needed(wav, sr, SAMPLE_RATE)
        wav = normalize_if_needed(wav)

        # Inference
        model = get_model()
        result = model({"array": wav, "sampling_rate": sr})
        labels = [r["label"] for r in result]
        raw_vals = [r.get("score", 0.0) for r in result]
        probs_map = to_prob_vector(labels, raw_vals)

        # Top-1
        top_label = max(probs_map, key=probs_map.get)
        top_score = probs_map[top_label]
        response_text = RESPONSES.get(top_label, "Okay.")

        return PredictOut(label=top_label, score=top_score, probs=probs_map, response=response_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/predict-text", response_model=TextPredictOut)
async def predict_text(body: TextPredictIn):
    """Detect emotion from text using a text classification model."""
    try:
        text = body.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Empty text")

        model = get_text_model()
        result = model(text)

        # text-classification with top_k=None returns [[{...}, ...]]
        if isinstance(result, list) and len(result) > 0 and isinstance(result[0], list):
            result = result[0]

        # Build probability map
        probs_map = {r["label"]: round(r["score"], 4) for r in result}

        # Top-1
        top = max(result, key=lambda r: r["score"])
        top_label = top["label"]
        top_score = top["score"]
        response_text = TEXT_RESPONSES.get(top_label, RESPONSES.get(top_label, "Okay."))

        return TextPredictOut(
            label=top_label,
            score=round(top_score, 4),
            probs=probs_map,
            response=response_text,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text inference error: {str(e)}")