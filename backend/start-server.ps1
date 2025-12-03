# Navigate to backend directory
Set-Location "C:\Users\tom_w\my-app\rork-short-club-sincr-nica-community-main\backend"

# Build the project
Write-Host "Building project..." -ForegroundColor Yellow
npm run build

# Start the server
Write-Host "Starting server..." -ForegroundColor Green
node dist/server.js
