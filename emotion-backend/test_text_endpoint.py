"""Quick test for /predict-text endpoint"""
import requests

URL = "http://localhost:8000/predict-text"

tests = [
    "I am so angry right now!",
    "This is the best day of my life!",
    "I feel really sad and lonely",
    "Can you tell me the weather?",
    "This is absolutely disgusting",
    "Oh wow I didn't expect that!",
    "I'm scared about what might happen",
]

print(f"{'Text':<45} {'Label':<12} {'Score'}")
print("-" * 70)

for text in tests:
    r = requests.post(URL, json={"text": text})
    if r.status_code == 200:
        d = r.json()
        print(f"{text:<45} {d['label']:<12} {d['score']:.0%}")
    else:
        print(f"{text:<45} ERROR {r.status_code}")
