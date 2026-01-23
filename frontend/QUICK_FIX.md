# Quick Fix for "Site Not Found"

## Run This First

```bash
cd frontend
./setup-firebase.sh
```

Or manually:

## Step-by-Step Fix

### 1. Login to Firebase
```bash
firebase login
```

### 2. Initialize Hosting (if needed)
```bash
cd frontend
firebase init hosting
```
- Select: Use existing project → `affiliate-portal-121a7`
- Public directory: `out`
- Single-page app: `Yes`
- GitHub: `No`

### 3. Build
```bash
npm run build
```

### 4. Deploy
```bash
firebase deploy --only hosting
```

## Verify in Firebase Console

1. Go to: https://console.firebase.google.com/project/affiliate-portal-121a7/hosting
2. Check if there are any deployments
3. If Hosting shows "Get started", click it to enable

## Most Common Issue

**Hosting not enabled in Firebase Console**

Fix:
1. Open Firebase Console
2. Go to Hosting section
3. Click "Get started" if you see it
4. Then deploy again
