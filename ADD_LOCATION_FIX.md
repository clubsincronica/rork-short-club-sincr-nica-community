# Quick Fix: Add Location to Your Profile

## Problem
Your registered users (matias.cazeaux@gmail.com, tom_weasley@hotmail.com) don't have GPS coordinates, so they don't appear in "Near Me" tab.

## Solution
Add location coordinates to test messaging between profiles.

### Option 1: Via Backend (Quick)
Run this in PowerShell:

```powershell
cd backend
node -e "
const initDb = require('sql.js');
initDb().then(SQL => {
  const fs = require('fs');
  const db = new SQL.Database(fs.readFileSync('clubsincronica.db'));
  
  // Get all users
  const users = db.exec('SELECT id, email FROM users');
  if (users.length > 0) {
    console.log('Users found:', users[0].values);
    
    // Update users with test coordinates (Madrid area)
    db.run('UPDATE users SET latitude = -38.02, longitude = -57.53, location = \"Mar del Plata, Argentina\" WHERE email = \"matias.cazeaux@gmail.com\"');
    db.run('UPDATE users SET latitude = -38.01, longitude = -57.52, location = \"Mar del Plata, Argentina\" WHERE email = \"tom_weasley@hotmail.com\"');
    
    // Save database
    const data = db.export();
    fs.writeFileSync('clubsincronica.db', Buffer.from(data));
    console.log('✅ Location added to both users!');
    
    // Verify
    const updated = db.exec('SELECT email, latitude, longitude, location FROM users');
    console.log('Updated users:', JSON.stringify(updated, null, 2));
  }
});
"
```

After running this:
1. Restart the Expo app
2. Go to "Near Me" tab
3. You should see the other user!
4. Click on their profile → "Enviar Mensaje" button
5. Test real-time messaging

### Option 2: Manual Update (Slower)
1. Open Settings in the app
2. Edit profile
3. Add location manually
4. Save

---

**Quick Test:**
After setting location, go to:
- Phone 1 (matias): Near Me tab → Should see "Tomas De La Llosa"
- Phone 2 (tom): Near Me tab → Should see "Matias Cazeaux"
- Click user → Start conversation → Test messages!
