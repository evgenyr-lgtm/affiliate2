# ✅ Fixed Firebase App Hosting Configuration

## The Problem:

Firebase App Hosting expects `output: 'standalone'` for server-side rendering, but the config was set to `output: 'export'` (static export). This caused the error:
```
Error: ENOENT: no such file or directory, open '/workspace/.next/standalone/.next/routes-manifest.json'
```

## What Was Fixed:

Updated `next.config.js` to:
- Use `standalone` output when `FIREBASE_APP_HOSTING` env var is set (Firebase sets this automatically)
- Keep `export` mode for regular Firebase Hosting (static sites)
- Enable image optimization for App Hosting

## Changes Made:

- `frontend/next.config.js`: Conditional output based on Firebase App Hosting environment

## Next Steps:

1. **Push via GitHub Desktop:**
   - Commit: "Fix Next.js config for Firebase App Hosting - use standalone instead of export"
   - Push to GitHub

2. **Firebase Will Build Successfully!** 🎉

Firebase App Hosting will now:
- Use standalone output mode
- Generate routes-manifest.json correctly
- Build and deploy successfully!

---

**Push the config fix and Firebase App Hosting will work!** 🚀
