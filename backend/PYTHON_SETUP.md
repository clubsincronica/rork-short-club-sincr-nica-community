# Python Installation Guide

## Step 1: Download Python

1. Go to: https://www.python.org/downloads/
2. Click "Download Python 3.12.x" (latest version)
3. **IMPORTANT**: During installation, CHECK ✅ "Add Python to PATH"
4. Click "Install Now"

## Step 2: Verify Installation

Open a NEW PowerShell terminal and run:
```powershell
python --version
```

Should show: `Python 3.12.x`

## Step 3: Install Backend Dependencies

```powershell
cd backend
npm install
```

## Step 4: Initialize Database

```powershell
npm run db:init
```

## Step 5: Start Server

```powershell
npm run dev
```

Server will run on `http://localhost:3000`

---

## Troubleshooting

**If Python still not found:**
1. Close ALL PowerShell windows
2. Open new PowerShell
3. Try again

**If npm install still fails:**
- Make sure you opened a NEW terminal after Python installation
- Restart VS Code completely
- Run: `npm config set python python`

---

**After successful installation, I'll help you connect the React Native app to the backend!**
