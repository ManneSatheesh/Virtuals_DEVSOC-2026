import os

MODEL_ID = os.getenv("MODEL_ID", "superb/wav2vec2-base-superb-er")  # swap with your fine-tuned path later
TEXT_MODEL_ID = os.getenv("TEXT_MODEL_ID", "j-hartmann/emotion-english-distilroberta-base")  # 7-class text emotion
SAMPLE_RATE = int(os.getenv("SAMPLE_RATE", "16000"))
CORS_ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "*")  # comma-separated for prod
DEVICE_PREFERENCE = os.getenv("DEVICE_PREFERENCE", "auto")  # 'auto' | 'cpu' | 'gpu'

__all__ = ["MODEL_ID", "TEXT_MODEL_ID", "SAMPLE_RATE", "CORS_ALLOW_ORIGINS", "DEVICE_PREFERENCE"]