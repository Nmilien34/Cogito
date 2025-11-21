@echo off
echo ========================================
echo Cogito Smart Radio - Quick Start
echo ========================================
echo.
echo This will start both the backend and frontend servers.
echo Make sure you've run 'npm install' in both folders first!
echo.
pause

echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Servers are starting...
echo ========================================
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul

start http://localhost:5173

echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul

