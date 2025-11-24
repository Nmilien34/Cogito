@echo off
echo ========================================
echo Cogito Smart Radio - Launch App
echo ========================================
echo.
echo This will:
echo 1. Start the backend server (port 4000)
echo 2. Start the preview server (port 4173)
echo 3. Open the app in your browser
echo.
pause

cd /d "%~dp0"

REM Start Backend Server
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 5 /nobreak >nul

REM Start Preview Server and open browser
echo Starting Preview Server...
cd client
start "Preview Server" cmd /k "npm run preview"

timeout /t 3 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:4173

echo.
echo ========================================
echo App is launching!
echo ========================================
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:4173
echo.
echo Keep both terminal windows open.
echo Press any key to exit this window...
pause >nul

