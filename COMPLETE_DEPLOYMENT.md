# Complete Deployment Guide

## Step-by-Step Deployment

### Step 1: Install Firebase CLI (if not installed)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

**This will:**
- Open your browser
- Show Firebase login page
- Use credentials: evgeny.r@melonad.io / GP7315Eq3x#E@&81*
- Complete OAuth authentication

### Step 3: Navigate to Frontend
```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/frontend"
```

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Build the App
```bash
npm run build
```

### Step 6: Deploy to Firebase
```bash
firebase deploy --only hosting:af-affiliate-portal-b831d
```

## Complete Command Sequence

Copy and paste this entire block:

```bash
# Install Firebase CLI (if needed)
npm install -g firebase-tools

# Login (opens browser - use your credentials)
firebase login

# Navigate and deploy
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/frontend"
npm install
npm run build
firebase deploy --only hosting:af-affiliate-portal-b831d
```

## What to Expect

### After `firebase login`:
- Browser opens automatically
- Sign in with: evgeny.r@melonad.io
- Password: GP7315Eq3x#E@&81*
- Browser shows "Firebase CLI Login Successful"
- Terminal shows "✔ Success! Logged in as evgeny.r@melonad.io"

### After `firebase deploy`:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/af-affiliate-portal/overview
Hosting URL: https://af-affiliate-portal-b831d.web.app
```

## Troubleshooting

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### "Authentication Error"
```bash
firebase login --reauth
```

### "Target not found"
- Check Firebase Console: https://console.firebase.google.com/project/af-affiliate-portal/hosting
- Verify site `af-affiliate-portal-b831d` exists
- If not, create it in Firebase Console first

### "Build fails"
```bash
cd frontend
rm -rf .next out node_modules
npm install
npm run build
```

## Security Reminder

⚠️ Your Firebase credentials are now stored securely in your system. The `firebase login` command handles this automatically and securely.
