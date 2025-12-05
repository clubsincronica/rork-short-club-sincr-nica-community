# GitHub API Workflow Trigger Script
# You'll need a GitHub Personal Access Token with 'workflow' scope

Write-Host "GitHub Actions Workflow Trigger" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if gh CLI is available
$ghAvailable = Get-Command gh -ErrorAction SilentlyContinue

if ($ghAvailable) {
    Write-Host "Using GitHub CLI to trigger workflow..." -ForegroundColor Green
    gh workflow run railway-migrate.yml --ref master
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Workflow triggered successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "View workflow runs at:" -ForegroundColor Yellow
        Write-Host "https://github.com/clubsincronica/rork-short-club-sincr-nica-community/actions" -ForegroundColor Blue
    } else {
        Write-Host ""
        Write-Host "✗ Failed to trigger workflow via gh CLI" -ForegroundColor Red
        Write-Host "You may need to run: gh auth login" -ForegroundColor Yellow
    }
} else {
    Write-Host "GitHub CLI not found. Manual trigger required." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install GitHub CLI" -ForegroundColor Cyan
    Write-Host "  Download from: https://cli.github.com/" -ForegroundColor Blue
    Write-Host "  Then run: gh auth login" -ForegroundColor Gray
    Write-Host "  Then run this script again" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Manually trigger via GitHub.com" -ForegroundColor Cyan
    Write-Host "  1. Go to: https://github.com/clubsincronica/rork-short-club-sincr-nica-community/actions/workflows/railway-migrate.yml" -ForegroundColor Blue
    Write-Host "  2. Sign in to GitHub" -ForegroundColor Gray
    Write-Host "  3. Click 'Run workflow' button (top right)" -ForegroundColor Gray
    Write-Host "  4. Select 'master' branch" -ForegroundColor Gray
    Write-Host "  5. Click 'Run workflow'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 3: Use curl with Personal Access Token" -ForegroundColor Cyan
    Write-Host "  Create token at: https://github.com/settings/tokens" -ForegroundColor Blue
    Write-Host "  (Select 'repo' and 'workflow' scopes)" -ForegroundColor Gray
    Write-Host ""
    
    $response = Read-Host "Do you have a GitHub Personal Access Token? (y/n)"
    
    if ($response -eq 'y') {
        $token = Read-Host "Enter your GitHub Personal Access Token" -AsSecureString
        $tokenPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token))
        
        Write-Host ""
        Write-Host "Triggering workflow via API..." -ForegroundColor Green
        
        $headers = @{
            "Accept" = "application/vnd.github+json"
            "Authorization" = "Bearer $tokenPlain"
            "X-GitHub-Api-Version" = "2022-11-28"
        }
        
        $body = @{
            ref = "master"
        } | ConvertTo-Json
        
        try {
            $result = Invoke-RestMethod -Uri "https://api.github.com/repos/clubsincronica/rork-short-club-sincr-nica-community/actions/workflows/railway-migrate.yml/dispatches" -Method Post -Headers $headers -Body $body -ContentType "application/json"
            
            Write-Host ""
            Write-Host "✓ Workflow triggered successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "View workflow runs at:" -ForegroundColor Yellow
            Write-Host "https://github.com/clubsincronica/rork-short-club-sincr-nica-community/actions" -ForegroundColor Blue
        } catch {
            Write-Host ""
            Write-Host "✗ Failed to trigger workflow" -ForegroundColor Red
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please verify:" -ForegroundColor Yellow
            Write-Host "  - Token has 'repo' and 'workflow' scopes" -ForegroundColor Gray
            Write-Host "  - Repository name is correct" -ForegroundColor Gray
            Write-Host "  - GitHub Actions is enabled for the repository" -ForegroundColor Gray
        }
    }
}

Write-Host ""
