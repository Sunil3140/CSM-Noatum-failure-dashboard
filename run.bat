@echo off
title Fleet Failure Tracker - Setup & Run
echo ===================================================
echo   CSM Noatum Fleet Failure Tracker
echo ===================================================
echo.

:: Check if Python is installed
py --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in system PATH.
    echo Please install Python 3.x and check the "Add Python to PATH" box.
    echo.
    pause
    exit /b
)

:: Install required python packages
echo [1/3] Checking and installing Python dependencies...
py -m pip install pandas openpyxl
echo.

:: Run data processing script
echo [2/3] Processing raw Excel files...
if not exist "data" (
    mkdir "data"
)
py process_data.py
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to process Excel files.
    echo Please ensure your raw Excel spreadsheets are placed in the 'data' folder.
    echo.
    pause
    exit /b
)
echo.

:: Start local web server and open browser
echo [3/3] Launching local HTTP web server...
echo Server running at: http://localhost:8000
echo.
echo Press Ctrl+C in this window to stop the server when done.
echo.

:: Open browser automatically
start http://localhost:8000

:: Start the Python HTTP server
py -m http.server 8000
