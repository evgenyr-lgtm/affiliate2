# Deploy to Firebase

## Quick Deploy

```bash
cd frontend
npm install
npm run build
firebase deploy --only hosting:af-affiliate-portal-b831d
```

## Step-by-Step

### 1. Install Firebase (if not already installed)
```bash
npm install firebase
```

### 2. Install dependencies
```bash
cd frontend
npm install
```

### 3. Build the app
```bash
npm run build
```

### 4. Deploy to Firebase
```bash
firebase deploy --only hosting:af-affiliate-portal-b831d
```

## Or use npm script
```bash
cd frontend
npm run deploy
```

## Firebase Configuration

- **Project ID**: `af-affiliate-portal`
- **Hosting Site**: `af-affiliate-portal-b831d`
- **Config**: Updated in `lib/firebase.ts`

## After Deployment

Your app will be available at the Firebase Hosting URL for site `af-affiliate-portal-b831d`.

Check Firebase Console for the exact URL:
https://console.firebase.google.com/project/af-affiliate-portal/hosting
