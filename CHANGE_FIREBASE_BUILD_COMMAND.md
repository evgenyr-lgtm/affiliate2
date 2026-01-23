# 🔧 How to Change Firebase Build Command to `npm install`

## Step-by-Step Instructions

### Step 1: Go to Firebase Console
1. Open your browser
2. Go to: **https://console.firebase.google.com**
3. Sign in with your Google account
4. Select project: **af-affiliate-portal**

### Step 2: Navigate to Hosting Settings
1. In the left sidebar, click **"Hosting"**
2. You should see your site: **af-affiliate-portal-b831d**
3. Click on **"Settings"** (gear icon) or **"Manage"** button
4. Look for **"Build configuration"** or **"Build settings"** section

### Step 3: Find Build Command
Look for one of these sections:
- **"Build command"** or **"Build script"**
- **"CI/CD"** settings
- **"GitHub integration"** settings
- **"Build configuration"**

### Step 4: Change the Command
**Current command (likely):**
```
npm ci && npm run build
```

**Change it to:**
```
npm install && npm run build
```

Or if it's split into separate fields:
- **Install command:** `npm install`
- **Build command:** `npm run build`

### Step 5: Save Changes
1. Click **"Save"** or **"Update"**
2. Firebase will automatically trigger a new build

## Alternative: If Using GitHub Integration

If Firebase is connected to GitHub (which it seems to be), you might need to:

### Option A: Change in Firebase Console
1. Go to **Hosting** → **Settings**
2. Find **"GitHub integration"** or **"Build configuration"**
3. Edit the build command there

### Option B: Update GitHub Actions Workflow
If the build command is in GitHub Actions, update this file:

**File:** `.github/workflows/firebase-deploy.yml`

**Change line 27 from:**
```yaml
run: npm ci
```

**To:**
```yaml
run: npm install
```

Then commit and push to GitHub.

## Visual Guide

1. **Firebase Console** → **Project: af-affiliate-portal**
2. **Left sidebar** → **Hosting**
3. **Settings** (gear icon) or **Manage**
4. **Build configuration** section
5. **Edit build command**
6. **Save**

## What This Does

- **`npm ci`**: Requires complete `package-lock.json` (fails if incomplete)
- **`npm install`**: Works even without complete lock file (generates it if needed)

## After Changing

1. Firebase will trigger a new build automatically
2. The build should succeed now!
3. Your site will deploy successfully

---

**Quick Path:** Firebase Console → Hosting → Settings → Build Configuration → Change `npm ci` to `npm install` → Save
