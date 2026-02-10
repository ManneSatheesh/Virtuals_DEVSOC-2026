@echo off
echo ========================================
echo Phone Call Backend - API Server
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

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing Node.js dependencies...
    npm install
    echo.
)

echo Starting API Server on port 3002...
echo Keep this window open!
echo.

npm start

pause
