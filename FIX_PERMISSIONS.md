# 🔧 Fix Permission Error

## The Error:
```
npm error sh: /Users/evgenyrodionov/Desktop/Affiliate Portal/node_modules/.bin/napi-postinstall: Permission denied
```

## ✅ Solution 1: Fix Permissions (Try This First)

Run in Terminal:
```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal"
chmod -R u+w node_modules
cd frontend
npm install
```

## ✅ Solution 2: Clean Install (If Solution 1 Doesn't Work)

Run in Terminal:
```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal"
rm -rf node_modules
cd frontend
npm install
```

## ✅ Solution 3: Install Without Workspace (Recommended)

Since you're in a workspace, try installing directly in frontend:

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/frontend"
rm -f package-lock.json
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag helps with dependency conflicts.

## ✅ Solution 4: Use npm ci with --legacy-peer-deps

If install still fails, try:
```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/frontend"
npm install --legacy-peer-deps --force
```

## After Success:

1. Verify `package-lock.json` was created:
   ```bash
   ls -lh package-lock.json
   ```
   Should show a large file (several MB)

2. Commit and push via GitHub Desktop

---

**Try Solution 3 first - it's the cleanest approach!**
