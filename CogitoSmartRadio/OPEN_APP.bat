@echo off
echo ========================================
echo Opening Cogito Smart Radio App
echo ========================================
echo.

cd /d "%~dp0client"

echo Starting preview server...
echo.
echo The app will open in your browser at: http://localhost:4173
echo.
echo Press Ctrl+C to stop the server
echo.

start http://localhost:4173
npm run preview

