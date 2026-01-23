# Setup GitHub Auto-Deploy (No Terminal Needed!)

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `affiliate-portal`)
3. **Don't initialize with README** (we'll push existing code)

## Step 2: Push Code to GitHub

### Using GitHub Desktop (Easiest - No Terminal):

1. **Download GitHub Desktop**: https://desktop.github.com/
2. **Install and login**
3. **Add Repository**:
   - File → Add Local Repository
   - Select: `/Users/evgenyrodionov/Desktop/Affiliate Portal`
4. **Commit and Push**:
   - Write commit message: "Initial commit"
   - Click "Publish repository"
   - Choose your GitHub account
   - Click "Publish Repository"

### Using VS Code (Also No Terminal):

1. **Open VS Code** in your project folder
2. **Source Control** tab (left sidebar)
3. **Initialize Repository** (if not done)
4. **Stage All Changes** (+ button)
5. **Commit** (write message, click checkmark)
6. **Publish Branch** (click "Publish Branch" button)

## Step 3: Connect Firebase to GitHub

1. **Go to Firebase Console**:
   https://console.firebase.google.com/project/af-affiliate-portal/hosting

2. **Get Started with Hosting** (if first time):
   - Click "Get started"
   - Or click "Add another site" if you have sites

3. **Connect to GitHub**:
   - Look for "Connect GitHub" or "Set up GitHub Actions"
   - Click it
   - Authorize Firebase to access GitHub
   - Select your repository: `affiliate-portal` (or your repo name)
   - Select branch: `main` or `master`

4. **Configure Build**:
   - **Root directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Output directory**: `out`
   - **Node version**: `18`

5. **Save Configuration**

## Step 4: Automatic Deployment!

Now, every time you:
- Push code to GitHub (via GitHub Desktop, VS Code, or web)
- Firebase automatically:
  - Installs dependencies
  - Builds your app
  - Deploys to hosting

## Step 5: View Deployments

- Go to Firebase Console → Hosting
- See deployment history
- Click on any deployment to see details

## Alternative: Use GitHub Actions (Already Configured)

I've created a GitHub Actions workflow file (`.github/workflows/firebase-deploy.yml`).

**To use it:**

1. **Get Firebase Service Account**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Add Secret to GitHub**:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste the entire contents of the downloaded JSON file
   - Click "Add secret"

3. **Push code** - GitHub Actions will automatically deploy!

## Benefits

✅ **No terminal needed** - Use GitHub Desktop or VS Code
✅ **Automatic deployments** - Push code, it deploys
✅ **Deployment history** - See all deployments in Firebase Console
✅ **Easy rollback** - Revert to previous deployments with one click

## Troubleshooting

### "Build failed"
- Check Firebase Console → Hosting → Build logs
- Verify build command is correct
- Check Node version (should be 18)

### "Deployment not triggering"
- Make sure you pushed to `main` or `master` branch
- Check GitHub Actions tab (if using workflow)
- Verify Firebase-GitHub connection is active

### "Can't find out directory"
- Verify build command creates `out` folder
- Check output directory setting in Firebase Console
