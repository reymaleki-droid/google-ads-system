# Docker Build and Run Script for Google Ads System
# Run this script in PowerShell on Windows

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Google Ads System - Docker Build" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "Docker is running." -ForegroundColor Green
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "WARNING: .env.local file not found!" -ForegroundColor Yellow
    Write-Host "Create .env.local with your environment variables before building." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
}

# Stop and remove existing container
Write-Host "Stopping existing container..." -ForegroundColor Yellow
docker stop google-ads-system-app 2>$null
docker rm google-ads-system-app 2>$null
Write-Host ""

# Build the Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes on first build..." -ForegroundColor Gray
docker build -t google-ads-system:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Run the container
Write-Host "Starting container..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start container!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "   Deployment Successful!        " -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Application is running at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:    docker logs -f google-ads-system-app" -ForegroundColor Gray
Write-Host "  Stop:         docker-compose down" -ForegroundColor Gray
Write-Host "  Restart:      docker-compose restart" -ForegroundColor Gray
Write-Host "  Shell access: docker exec -it google-ads-system-app sh" -ForegroundColor Gray
Write-Host ""

# Wait for health check
Write-Host "Waiting for application to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 2 -UseBasicParsing 2>$null
        if ($response.StatusCode -eq 200) {
            Write-Host "Application is healthy!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Opening browser..." -ForegroundColor Cyan
            Start-Process "http://localhost:3000"
            break
        }
    } catch {
        # Continue waiting
    }
    
    $attempt++
    Start-Sleep -Seconds 2
    Write-Host "." -NoNewline
}

if ($attempt -eq $maxAttempts) {
    Write-Host ""
    Write-Host "WARNING: Application may still be starting. Check logs with:" -ForegroundColor Yellow
    Write-Host "docker logs google-ads-system-app" -ForegroundColor Gray
}
