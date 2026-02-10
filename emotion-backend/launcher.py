#!/usr/bin/env python
"""
All-in-One Launcher for Emotion Detection
Handles starting backend and display together
"""
import subprocess
import sys
import time
import os
import threading
import requests

class EmotionLauncher:
    def __init__(self):
        self.backend_process = None
        self.display_process = None
        
    def check_backend(self):
        """Check if backend is running"""
        for _ in range(10):
            try:
                response = requests.get('http://localhost:8000/health', timeout=2)
                if response.status_code == 200:
                    return True
            except:
                time.sleep(1)
        return False
    
    def print_banner(self):
        """Print welcome banner"""
        print("\n" + "="*70)
        print(" " * 15 + "🎤 EMOTION DETECTION LAUNCHER 🎤")
        print("="*70 + "\n")
    
    def print_menu(self):
        """Print main menu"""
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║                    DISPLAY OPTIONS                            ║")
        print("╠════════════════════════════════════════════════════════════════╣")
        print("║                                                                ║")
        print("║  [1] Terminal Display (RECOMMENDED)                           ║")
        print("║      └─ Beautiful real-time visualization in terminal         ║")
        print("║                                                                ║")
        print("║  [2] Web Dashboard                                            ║")
        print("║      └─ Modern web interface at http://localhost:8001         ║")
        print("║                                                                ║")
        print("║  [3] Simple Script                                            ║")
        print("║      └─ Lightweight Python-only version                       ║")
        print("║                                                                ║")
        print("║  [q] Quit                                                      ║")
        print("║                                                                ║")
        print("╚════════════════════════════════════════════════════════════════╝\n")
    
    def start_backend(self):
        """Start the backend API server"""
        print("📡 Starting backend API server on port 8000...\n")
        
        try:
            # Start backend in background
            self.backend_process = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "app.server:app", 
                 "--host", "0.0.0.0", "--port", "8000"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for backend to be ready
            print("⏳ Waiting for backend to initialize...")
            if self.check_backend():
                print("✅ Backend is ready!\n")
                return True
            else:
                print("❌ Backend failed to start\n")
                return False
                
        except Exception as e:
            print(f"❌ Error starting backend: {e}\n")
            return False
    
    def start_terminal_display(self):
        """Start terminal-based display"""
        print("\n🎨 Starting Terminal Display...\n")
        try:
            subprocess.run([sys.executable, "terminal_display.py"], check=False)
        except KeyboardInterrupt:
            print("\n\nStopping...")
        except Exception as e:
            print(f"Error: {e}")
    
    def start_web_dashboard(self):
        """Start web dashboard"""
        print("\n🌐 Starting Web Dashboard on port 8001...\n")
        print("📝 Open your browser at: http://localhost:8001\n")
        try:
            subprocess.run([sys.executable, "dashboard.py"], check=False)
        except KeyboardInterrupt:
            print("\n\nStopping...")
        except Exception as e:
            print(f"Error: {e}")
    
    def start_simple_script(self):
        """Start simple Python script"""
        print("\n⚙️  Starting Simple Script...\n")
        try:
            subprocess.run([sys.executable, "realtime_emotion_sd.py"], check=False)
        except KeyboardInterrupt:
            print("\n\nStopping...")
        except Exception as e:
            print(f"Error: {e}")
    
    def cleanup(self):
        """Stop all processes"""
        print("\n\n" + "="*70)
        print("Shutting down...")
        if self.backend_process:
            self.backend_process.terminate()
        print("✅ Goodbye!\n")
    
    def run(self):
        """Main launcher loop"""
        self.print_banner()
        
        # Start backend
        if not self.start_backend():
            print("❌ Failed to start backend. Make sure port 8000 is available.")
            return
        
        # Show menu
        while True:
            self.print_menu()
            choice = input("Enter your choice (1/2/3/q): ").strip().lower()
            
            if choice == '1':
                self.start_terminal_display()
            elif choice == '2':
                self.start_web_dashboard()
            elif choice == '3':
                self.start_simple_script()
            elif choice == 'q':
                break
            else:
                print("❌ Invalid choice. Please try again.\n")
        
        self.cleanup()

if __name__ == "__main__":
    launcher = EmotionLauncher()
    try:
        launcher.run()
    except KeyboardInterrupt:
        launcher.cleanup()
