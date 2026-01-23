# Trigger Deployment Again

Since you've connected Firebase to GitHub, here's how to trigger a new deployment:

## Method 1: Push Any Change (Easiest)

### Using GitHub Desktop:
1. Open GitHub Desktop
2. You should see the change I just made (small comment in `frontend/app/page.tsx`)
3. Write commit message: "Trigger deployment"
4. Click "Commit to main"
5. Click "Push origin" (or it may auto-push)
6. Firebase will automatically deploy!

### Using VS Code:
1. Open VS Code
2. Go to Source Control tab
3. You'll see the changed file
4. Stage the change (+ button)
5. Write commit message: "Trigger deployment"
6. Commit (✓ button)
7. Push (↑ button)
8. Firebase will automatically deploy!

## Method 2: Manual Trigger (If Using GitHub Actions)

1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Deploy to Firebase Hosting" workflow
4. Click "Run workflow" button
5. Select branch: `main`
6. Click "Run workflow"
7. Watch it deploy!

## Method 3: Make Your Own Change

Make any small change to trigger deployment:
- Edit any file in `frontend/`
- Add a comment
- Update a text string
- Then commit and push

## Check Deployment Status

### In Firebase Console:
1. Go to: https://console.firebase.google.com/project/af-affiliate-portal/hosting
2. Click on "Deployments" or "History"
3. You'll see your deployment in progress or completed

### In GitHub:
1. Go to your repository
2. Click "Actions" tab
3. See the deployment workflow running

## What Happens Automatically:

1. ✅ Code pushed to GitHub
2. ✅ Firebase detects the push
3. ✅ Firebase runs: `npm install && npm run build`
4. ✅ Firebase deploys the `out` folder
5. ✅ Your site is updated!

## Deployment URL

After deployment completes, your site will be at:
- Check Firebase Console → Hosting for the exact URL
- Usually: `https://af-affiliate-portal-b831d.web.app`
