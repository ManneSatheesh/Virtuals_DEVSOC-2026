@echo off
echo ========================================
echo Phone Call Backend - Python Agent
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo.
    echo Please create .env file with your credentials:
    echo   1. Copy .env.example to .env
    echo   2. Edit .env with your LiveKit and Vobiz credentials
    echo.
    pause
    exit /b 1
)

echo Starting Python Agent...
echo Keep this window open!
echo.
echo Waiting for agent to register with LiveKit...
echo.

REM Run agent using the virtual environment's Python directly
venv\Scripts\python.exe agent.py start

pause
