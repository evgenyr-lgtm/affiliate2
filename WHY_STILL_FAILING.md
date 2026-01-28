# Why Firebase Is Still Using `npm ci`

## The Issue:

Firebase App Hosting uses **buildpacks** (Cloud Native Buildpacks) that automatically run `npm ci`. This is hardcoded in the buildpack and **cannot be changed** through Firebase Console settings.

## What I Changed:

✅ Updated `.github/workflows/firebase-deploy.yml` to use `npm install`
- This only affects GitHub Actions deployments
- Firebase App Hosting uses its own build system (buildpacks)

## Why It's Still Failing:

The build logs show:
```
Running "npm ci --quiet --no-fund --no-audit (NODE_ENV=development)"
```

This is coming from the Firebase buildpack, not from any configuration we can change.

## The Only Solution:

Generate a **complete** `package-lock.json` file with all dependencies. Firebase's `npm ci` will then work.

## How to Fix:

1. **Run in Terminal:**
   ```bash
   cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/frontend"
   rm -f package-lock.json
   npm install
   ```

2. **Commit and push via GitHub Desktop**

3. **Firebase will work!**

## Why This Works:

- `npm install` generates a complete lock file with all transitive dependencies
- `npm ci` can then use this complete lock file
- Build succeeds!

---

**The buildpack uses `npm ci` automatically - we can't change it. We must provide a complete package-lock.json!**
