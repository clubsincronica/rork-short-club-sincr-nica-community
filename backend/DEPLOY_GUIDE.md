# Deploy to Railway (Free Hosting)

## Why Railway?
- ✅ Free tier available
- ✅ Handles Python dependencies automatically
- ✅ Auto-deploys from GitHub
- ✅ Provides live URL for your mobile app
- ✅ PostgreSQL database included

## Step 1: Prepare for Deployment

Already done! Your backend is ready to deploy.

## Step 2: Create Railway Account

1. Go to: https://railway.app
2. Sign up with GitHub
3. Click "New Project"

## Step 3: Deploy from GitHub

### Option A: Deploy from Repo
1. Push your code to GitHub
2. In Railway, click "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js and builds

### Option B: Deploy with Railway CLI
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize in backend folder
cd backend
railway init

# Deploy
railway up
```

## Step 4: Add PostgreSQL Database

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway automatically sets DATABASE_URL environment variable
3. Update your backend to use PostgreSQL instead of SQLite

## Step 5: Set Environment Variables

In Railway dashboard, go to "Variables":
```
JWT_SECRET=your_secret_key_here_change_this
NODE_ENV=production
PORT=3000
```

## Step 6: Get Your Backend URL

Railway provides a URL like: `https://your-app.railway.app`

Copy this URL - you'll use it in your React Native app!

## Step 7: Update React Native App

Change the API base URL to your Railway URL (I'll help with this after deployment).

---

## Alternative: Render.com

1. Go to: https://render.com
2. Sign up with GitHub
3. "New" → "Web Service"
4. Connect repository
5. Build Command: `cd backend && npm install`
6. Start Command: `cd backend && npm start`

---

## What's Next?

1. **Install Python** (5 minutes) - test locally
2. **Deploy to Railway** (10 minutes) - get live URL
3. **Update mobile app** - connect to backend
4. **Test with 2 phones** - real multi-device chat!

Tell me when Python is installed or if you want to skip local and go straight to Railway deployment!
