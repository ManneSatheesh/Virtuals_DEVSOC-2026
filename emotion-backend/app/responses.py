RESPONSES = {
    "angry":   "I sense frustration. Let me help resolve this quickly.",
    "happy":   "You sound upbeat! Great to hear. How can I assist further?",
    "sad":     "I'm here for you. Would you like me to simplify this step?",
    "neutral": "Got it. I'll proceed.",
    "fear":    "No worries, I'll guide you through it.",
    "disgust": "Understood. Let me find a better alternative.",
    "surprise":"That was unexpected! Do you want more details?"
}

# Text emotion model (j-hartmann/emotion-english-distilroberta-base) uses these labels:
# anger, disgust, fear, joy, neutral, sadness, surprise
TEXT_RESPONSES = {
    "anger":    "I sense frustration. Let me help resolve this quickly.",
    "joy":      "You sound upbeat! Great to hear. How can I assist further?",
    "sadness":  "I'm here for you. Would you like me to simplify this step?",
    "neutral":  "Got it. I'll proceed.",
    "fear":     "No worries, I'll guide you through it.",
    "disgust":  "Understood. Let me find a better alternative.",
    "surprise": "That was unexpected! Do you want more details?"
}

__all__ = ["RESPONSES", "TEXT_RESPONSES"]