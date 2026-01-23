# 🚀 Deploy Now - Run These Commands

## Quick Deploy (Copy & Paste)

Open your terminal and run:

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/frontend"

# Install dependencies
npm install

# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting:af-affiliate-portal-b831d
```

## If npm install fails with log errors

Try this instead:

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/frontend"

# Set npm cache directory to project folder
export npm_config_cache="./.npm-cache"
mkdir -p .npm-cache

# Install dependencies
npm install --cache .npm-cache

# Build
npm run build

# Deploy
firebase deploy --only hosting:af-affiliate-portal-b831d
```

## Or use the deploy script

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal"
./deploy-firebase.sh
```

## What to expect

After running `firebase deploy`, you should see:
```
✔  Deploy complete!

Hosting URL: [your-site-url]
```

## Check deployment status

Visit Firebase Console:
https://console.firebase.google.com/project/af-affiliate-portal/hosting

## Troubleshooting

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
firebase login
```

### "Not logged in"
```bash
firebase login
```

### "Build fails"
Check for errors in the build output. Common issues:
- Missing dependencies
- TypeScript errors
- Next.js configuration issues

### "Target not found"
Make sure the hosting site `af-affiliate-portal-b831d` exists in Firebase Console.
