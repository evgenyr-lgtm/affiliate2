# Fix "Site Not Found" Error

## The Problem
"Site Not Found" means Firebase Hosting hasn't been initialized or the site hasn't been deployed yet.

## Solution Steps

### Step 1: Login to Firebase
```bash
firebase login
```
This will open a browser window for authentication.

### Step 2: Initialize Firebase Hosting (if not done)
```bash
cd frontend
firebase init hosting
```

When prompted:
- ✅ **Use an existing project**: Select `affiliate-portal-121a7`
- ✅ **What do you want to use as your public directory?**: Type `out`
- ✅ **Configure as a single-page app?**: Type `Yes`
- ✅ **Set up automatic builds and deploys with GitHub?**: Type `No` (for now)
- ✅ **File out/index.html already exists. Overwrite?**: Type `No`

### Step 3: Build the Frontend
```bash
cd frontend
npm install  # If not done already
npm run build
```

This creates the `out` directory with static files.

### Step 4: Deploy to Firebase
```bash
cd frontend
firebase deploy --only hosting
```

### Step 5: Verify Deployment
After deployment, you'll see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/affiliate-portal-121a7/overview
Hosting URL: https://affiliate-portal-121a7.web.app
```

## Alternative: Use the Deploy Script
```bash
./deploy.sh
```

## If You Still See "Site Not Found"

### Check 1: Verify Project Exists
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Check if project `affiliate-portal-121a7` exists
3. If not, create it first

### Check 2: Verify Hosting is Enabled
1. In Firebase Console, go to **Hosting**
2. If you see "Get started", click it to enable Hosting
3. Then follow the deployment steps above

### Check 3: Check Build Output
```bash
cd frontend
ls -la out/
```

You should see `index.html` and other files. If not, the build failed.

### Check 4: Verify Firebase Config
```bash
cd frontend
cat .firebaserc
```

Should show:
```json
{
  "projects": {
    "default": "affiliate-portal-121a7"
  }
}
```

## Quick Fix Command Sequence

```bash
# 1. Login
firebase login

# 2. Go to frontend
cd frontend

# 3. Install dependencies (if needed)
npm install

# 4. Build
npm run build

# 5. Deploy
firebase deploy --only hosting
```

## Common Issues

### Issue: "Firebase CLI not found"
**Fix:**
```bash
npm install -g firebase-tools
```

### Issue: "Authentication Error"
**Fix:**
```bash
firebase login --reauth
```

### Issue: "Project not found"
**Fix:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project `affiliate-portal-121a7` (or use existing)
3. Update `.firebaserc` with correct project ID

### Issue: "Build fails"
**Fix:**
```bash
cd frontend
rm -rf .next out node_modules
npm install
npm run build
```

### Issue: "out directory not found"
**Fix:**
The build didn't complete. Check for errors:
```bash
cd frontend
npm run build
```

Look for any error messages and fix them.

## Verify It's Working

After successful deployment:
1. Visit: https://affiliate-portal-121a7.web.app
2. You should see the login page
3. If you see "Site Not Found", wait 1-2 minutes for DNS propagation

## Still Having Issues?

1. Check Firebase Console → Hosting for deployment status
2. Check `firebase-debug.log` for detailed error messages
3. Verify your Firebase project ID matches in `.firebaserc`
4. Make sure you have the correct permissions for the Firebase project
