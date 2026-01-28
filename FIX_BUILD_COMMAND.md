# Fix: package-lock.json Out of Sync Error

## The Problem:
Firebase is using `npm ci` which requires a complete `package-lock.json` file with all dependencies. The minimal lock file I created isn't sufficient.

## ✅ Solution: Change Firebase Build Command

### Option 1: Use `npm install` Instead (Easiest)

In Firebase Console → Hosting → Settings, change the build command from:
```
npm install && npm run build
```

To:
```
npm install && npm run build
```

(Actually, Firebase might be using `npm ci` automatically. Let me check the configuration.)

### Option 2: Generate Proper package-lock.json (Recommended)

Run this locally in your terminal:

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/frontend"
rm package-lock.json  # Remove the incomplete one
npm install  # This will generate a complete lock file
```

Then commit and push:
```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal"
git add frontend/package-lock.json
git commit -m "Add complete package-lock.json"
```

Push via GitHub Desktop.

### Option 3: Update Firebase Build Settings

In Firebase Console → Hosting → Settings → Build Configuration:

**Current (if using npm ci):**
- Build command: `npm ci && npm run build`

**Change to:**
- Build command: `npm install && npm run build`

This will work even with an incomplete lock file, but Option 2 is better for consistency.

## Why This Happened:

The `package-lock.json` I created was minimal (just top-level dependencies). `npm ci` requires a complete lock file with:
- All transitive dependencies
- Exact versions
- Dependency tree structure

## Recommended Fix:

**Generate the proper lock file locally:**

1. Open Terminal
2. Run:
   ```bash
   cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/frontend"
   rm package-lock.json
   npm install
   ```
3. Commit and push via GitHub Desktop
4. Firebase will work!

---

**The easiest fix: Generate proper package-lock.json by running `npm install` locally, then push it!**
