# ⚡ Quick Fix: Change Firebase Build Command

## ✅ I've Updated GitHub Actions

I've already changed the GitHub Actions workflow file to use `npm install` instead of `npm ci`.

**File updated:** `.github/workflows/firebase-deploy.yml`

## 🔧 Also Change in Firebase Console

Since Firebase is building directly (not just through GitHub), you also need to change it in Firebase Console:

### Steps:

1. **Go to:** https://console.firebase.google.com/project/af-affiliate-portal/hosting
2. **Click:** Settings (gear icon) or "Manage"
3. **Find:** "Build configuration" or "CI/CD" section
4. **Change:** Build command from `npm ci && npm run build` to `npm install && npm run build`
5. **Save**

### Visual Path:
```
Firebase Console
  → Project: af-affiliate-portal
  → Hosting (left sidebar)
  → Settings / Manage
  → Build configuration
  → Edit build command
  → Change: npm ci → npm install
  → Save
```

## 📤 Push the GitHub Changes

After changing Firebase Console, also push the GitHub Actions update:

**Via GitHub Desktop:**
1. You'll see `.github/workflows/firebase-deploy.yml` modified
2. Commit: "Change build command to npm install"
3. Push to GitHub

## ✅ Result

After both changes:
- ✅ GitHub Actions will use `npm install`
- ✅ Firebase Console builds will use `npm install`
- ✅ Builds will succeed even without complete package-lock.json

---

**Next:** Change build command in Firebase Console → Push GitHub changes → Firebase will build successfully! 🚀
