# PowerShell script to start Cogito WebApp server

Write-Host "Starting Cogito WebApp Server..." -ForegroundColor Green
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Using Python server..." -ForegroundColor Yellow
        python server.py
        exit
    }
} catch {
    # Python not found, continue
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Using Node.js server..." -ForegroundColor Yellow
        npx --yes http-server -p 8000 -o
        exit
    }
} catch {
    # Node not found, continue
}

# If neither is available, open file directly
Write-Host "No server found. Opening file directly..." -ForegroundColor Yellow
Start-Process "index.html"

