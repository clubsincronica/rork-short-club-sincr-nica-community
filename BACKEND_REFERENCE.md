# Backend Server Quick Reference

## Server Status
- **Running on:** http://localhost:3000
- **Network IP:** http://192.168.0.77:3000
- **Process:** Node.js (PID: check with `Get-Process node`)

## To Restart Server
```powershell
# Kill existing server
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Start server
cd backend
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "dist/server.js" -WorkingDirectory "C:\Users\tom_w\my-app\rork-short-club-sincr-nica-community-main\backend"
```

## Test Connection
```powershell
# From computer
Invoke-RestMethod -Uri "http://localhost:3000/health"

# From network
Invoke-RestMethod -Uri "http://192.168.0.77:3000/health"
```

## Fix Firewall (Run as Administrator)
```powershell
cd backend
.\allow-firewall.ps1
```

## Files Created for Expo Go Testing
- `utils/api-config.ts` - API configuration (IP: 192.168.0.77)
- `app/backend-test.tsx` - Connection test screen
- `backend/allow-firewall.ps1` - Firewall setup script

## Test from Phone
1. **Browser test:** http://192.168.0.77:3000/health
2. **Expo Go:** Navigate to "backend-test" screen

## Troubleshooting Checklist
- [ ] Same WiFi network for phone and computer
- [ ] Windows Firewall allows port 3000
- [ ] No VPN running on either device
- [ ] Server process is running (check with `Get-Process node`)
- [ ] IP address 192.168.0.77 is still correct (run `ipconfig`)

## If IP Changed
Run `ipconfig` to get new IP, then update `utils/api-config.ts`:
```typescript
LOCAL_IP: 'YOUR_NEW_IP_HERE',
```
