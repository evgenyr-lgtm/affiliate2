# Deploy Commands

## Quick Deploy

Run this from the project root:

```bash
./deploy-now.sh
```

## Manual Deploy Steps

### 1. Navigate to frontend
```bash
cd frontend
```

### 2. Install dependencies (if needed)
```bash
npm install
```

### 3. Build the app
```bash
npm run build
```

### 4. Deploy to Firebase
```bash
firebase deploy --only hosting
```

## If Firebase CLI is not installed

```bash
npm install -g firebase-tools
firebase login
```

## If not logged in

```bash
firebase login
```

## Troubleshooting

### Build fails
```bash
cd frontend
rm -rf .next out node_modules
npm install
npm run build
```

### Deployment fails
1. Check Firebase login: `firebase projects:list`
2. Verify project ID: `cat .firebaserc`
3. Check Firebase Console for Hosting status

### Still seeing "Site Not Found"
1. Go to Firebase Console → Hosting
2. Make sure Hosting is enabled
3. Check deployment history
4. Wait 1-2 minutes for DNS propagation
