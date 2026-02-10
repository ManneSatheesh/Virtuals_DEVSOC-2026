#!/usr/bin/env python
"""
Test emotion display in terminal
"""
import time

# Test display
emotion_emoji = {'ang': '😠', 'hap': '😊', 'sad': '😢', 'neu': '😐'}
emotion_name = {'ang': 'ANGRY', 'hap': 'HAPPY', 'sad': 'SAD', 'neu': 'NEUTRAL'}

test_emotions = [
    {'label': 'hap', 'score': 0.87, 'response': 'You sound upbeat! Great to hear.', 'probs': {'hap': 0.87, 'neu': 0.10, 'sad': 0.02, 'ang': 0.01}},
    {'label': 'neu', 'score': 0.65, 'response': 'Got it. I will proceed.', 'probs': {'neu': 0.65, 'hap': 0.20, 'sad': 0.10, 'ang': 0.05}},
    {'label': 'sad', 'score': 0.72, 'response': "I'm here for you.", 'probs': {'sad': 0.72, 'neu': 0.15, 'ang': 0.10, 'hap': 0.03}},
]

print("\n" + "="*70)
print("🎤 REAL-TIME EMOTION DETECTION (TERMINAL)")
print("="*70)

for emotion in test_emotions:
    label = emotion['label']
    score = emotion['score']
    response = emotion['response']
    probs = emotion['probs']
    
    emoji = emotion_emoji.get(label, '🎤')
    name = emotion_name.get(label, label.upper())
    confidence = int(score * 100)
    
    print("\n" + "="*70)
    print(f"{emoji}  {name}  {emoji}")
    print("="*70)
    print(f"Confidence: {confidence}% " + ("█" * (confidence//5)) + ("░" * (20-confidence//5)))
    print(f"Response: {response}")
    print("="*70)
    
    print("\nProbabilities:")
    for em, prob in sorted(probs.items(), key=lambda x: x[1], reverse=True):
        percentage = int(prob * 100)
        bar = ("█" * (percentage//5)) + ("░" * (20-percentage//5))
        em_name = emotion_name.get(em, em.upper())
        print(f"  {em_name:6} [{bar}] {percentage}%")
    
    time.sleep(2)

print("\n\n✅ Terminal display is working!\n")
