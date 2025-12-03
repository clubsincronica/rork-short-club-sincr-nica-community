# Run this script as Administrator to allow incoming connections on port 3000

Write-Host "Adding Windows Firewall rule for Node.js server..." -ForegroundColor Yellow

try {
    New-NetFirewallRule -DisplayName "Club Sincrónica Backend - Port 3000" `
        -Direction Inbound `
        -LocalPort 3000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Any `
        -ErrorAction Stop
    
    Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
    Write-Host "Your backend server is now accessible from other devices on the network." -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nAlternative method:" -ForegroundColor Yellow
    
    $result = netsh advfirewall firewall add rule name="Club Sincrónica Backend" dir=in action=allow protocol=TCP localport=3000
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firewall rule added successfully using netsh!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed. Please run this script as Administrator." -ForegroundColor Red
    }
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
