@echo off
echo.
echo  ██████╗ ██████╗  █████╗ ██╗███╗   ██╗██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗     █████╗ ██╗
echo  ██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║    ██╔══██╗██║
echo  ██║  ██║██████╔╝███████║██║██╔██╗ ██║██║ █╗ ██║███████║   ██║   ██║     ███████║    ███████║██║
echo  ██║  ██║██╔══██╗██╔══██║██║██║╚██╗██║██║███╗██║██╔══██║   ██║   ██║     ██╔══██║    ██╔══██║██║
echo  ██████╔╝██║  ██║██║  ██║██║██║ ╚████║╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║    ██║  ██║██║
echo  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚══╝╚══╝ ╚═╝  ╚═╝  ╚═╝    ╚═════╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝
echo.
echo  AI-Powered Urban Waterlogging Prediction System
echo  ================================================
echo  All data is SYNTHETIC. Risk scores are EXPERIMENTAL.
echo  Not for emergency use. Human inspection required.
echo  ================================================
echo.

:: Check Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.9+ from https://python.org
    pause
    exit /b 1
)

:: Move into backend directory
cd /d "%~dp0backend"

:: Install Python dependencies if needed
echo [1/3] Checking Python dependencies...
pip install -r requirements.txt --quiet
echo       Done.

:: Start Flask server in the background
echo [2/3] Starting DrainWatch AI server...
echo       This will auto-seed the database on first run.
echo.
start "" /B python app.py

:: Wait a moment for the server to start
timeout /t 3 /nobreak >nul

:: Open browser
echo [3/3] Opening browser...
start http://localhost:5000

echo.
echo  ================================================
echo  DrainWatch AI is running at:
echo  http://localhost:5000
echo  ================================================
echo.
echo  Press Ctrl+C in the Python window to stop the server.
echo  Close this window after the browser opens.
echo.
pause
