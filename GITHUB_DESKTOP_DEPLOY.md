# 🚀 Deploy via GitHub Desktop - Step by Step

## ✅ Repository Status:

Your repository is ready! Here's what's configured:
- ✅ Git repository initialized
- ✅ All files committed
- ✅ GitHub remote: `https://github.com/evgenyrodionov/Affiliate-Portal.git`
- ✅ Branch: `main`
- ✅ Ready to push!

## 📋 Steps to Deploy via GitHub Desktop:

### Step 1: Open GitHub Desktop
- Launch the GitHub Desktop application on your Mac

### Step 2: Add Your Repository
1. Click **File** → **Add Local Repository**
2. Navigate to: `/Users/evgenyrodionov/Desktop/Affiliate Portal`
3. Click **Add**

### Step 3: Check Repository Status
GitHub Desktop will show:
- Current branch: `main`
- Commits ready to push (you should see 3+ commits)
- Remote: `origin` → `https://github.com/evgenyrodionov/Affiliate-Portal.git`

### Step 4: Push to GitHub
You'll see one of these buttons:

**Option A: "Publish repository"**
- Click **"Publish repository"** button
- Make sure "Keep this code private" is unchecked (if you want it public)
- Click **"Publish repository"**

**Option B: "Push origin"**
- Click **"Push origin"** button (top right)
- This pushes all your commits to GitHub

### Step 5: Firebase Auto-Deploys! 🎉
Once pushed:
1. ✅ Code is on GitHub
2. ✅ Firebase detects the push (if connected in Firebase Console)
3. ✅ Firebase automatically:
   - Installs dependencies (`npm install`)
   - Builds your app (`npm run build`)
   - Deploys to hosting
4. ✅ Your site updates automatically!

## 🔍 Verify Deployment:

### Check GitHub:
- Go to: https://github.com/evgenyrodionov/Affiliate-Portal
- You should see all your files

### Check Firebase Console:
- Go to: https://console.firebase.google.com/project/af-affiliate-portal/hosting
- Click **"Deployments"** or **"History"**
- You'll see the deployment in progress or completed

### Check Your Live Site:
- **Primary URL**: https://af-affiliate-portal-b831d.web.app
- **Alternative**: https://af-affiliate-portal-b831d.firebaseapp.com

## ⚠️ Important: Firebase-GitHub Connection

If Firebase doesn't auto-deploy, you need to connect them:

1. Go to: https://console.firebase.google.com/project/af-affiliate-portal/hosting
2. Click **"Get started"** or **"Connect GitHub"**
3. Authorize Firebase to access GitHub
4. Select repository: `evgenyrodionov/Affiliate-Portal`
5. Configure:
   - **Root directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Output directory**: `out`
6. Save configuration

## 🎯 Quick Checklist:

- [ ] GitHub Desktop installed and logged in
- [ ] Repository added to GitHub Desktop
- [ ] Clicked "Publish repository" or "Push origin"
- [ ] Code pushed to GitHub (check GitHub website)
- [ ] Firebase connected to GitHub (check Firebase Console)
- [ ] Deployment visible in Firebase Console
- [ ] Site accessible at: https://af-affiliate-portal-b831d.web.app

## 📞 Troubleshooting:

### "Repository not found" error
- Make sure the repository exists on GitHub
- Check the URL: https://github.com/evgenyrodionov/Affiliate-Portal

### "Authentication failed"
- In GitHub Desktop: **GitHub Desktop** → **Preferences** → **Accounts**
- Make sure you're logged in
- Re-authenticate if needed

### Firebase not deploying
- Check Firebase Console → Hosting → Settings
- Verify GitHub connection is active
- Check build logs in Firebase Console

### "Site Not Found" after deployment
- Wait 1-2 minutes for DNS propagation
- Check Firebase Console for deployment status
- Verify the hosting site `af-affiliate-portal-b831d` exists

---

**Just open GitHub Desktop, add the repository, and push! Firebase will handle the rest automatically!** 🚀
