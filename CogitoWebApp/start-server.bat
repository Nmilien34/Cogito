@echo off
echo Starting Cogito WebApp Server...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python server...
    python server.py
    goto :end
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Node.js server...
    npx --yes http-server -p 8000 -o
    goto :end
)

REM If neither is available, try to open directly
echo No server found. Opening file directly...
start index.html
goto :end

:end
pause

