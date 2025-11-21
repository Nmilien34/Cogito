# Open Cogito Smart Radio App
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Opening Cogito Smart Radio App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\client"

Write-Host "Starting preview server..." -ForegroundColor Green
Write-Host ""
Write-Host "The app will open in your browser at: http://localhost:4173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 2
Start-Process "http://localhost:4173"

npm run preview

