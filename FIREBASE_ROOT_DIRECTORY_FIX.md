# Fix: Invalid Root Directory Error

## The Problem:
Firebase says: "No buildable app found rooted at '/workspace/frontend'"

## Solutions:

### Solution 1: Make Sure Code is Pushed to GitHub First

**Important**: Firebase can only see files that are in your GitHub repository!

1. **Push your code to GitHub first** (via GitHub Desktop):
   - Open GitHub Desktop
   - Add repository: `/Users/evgenyrodionov/Desktop/Affiliate Portal`
   - Click "Publish repository" or "Push origin"
   - Wait for push to complete

2. **Then configure Firebase**:
   - Go back to Firebase Console
   - Try again with root directory: `frontend`

### Solution 2: Check Repository Structure

Firebase clones your GitHub repo to `/workspace/`. Make sure your repo structure is:

```
Affiliate-Portal/          (GitHub repo root)
├── frontend/              ← This should exist in GitHub
│   ├── package.json       ← This must be in GitHub
│   ├── app/
│   └── ...
├── backend/
└── ...
```

### Solution 3: Verify Files Are in GitHub

1. Go to: https://github.com/evgenyrodionov/Affiliate-Portal
2. Check if you can see the `frontend` folder
3. Check if `frontend/package.json` exists
4. If not, push the code first!

### Solution 4: Alternative - Use Root Directory

If your GitHub repository **only contains the frontend code** (not the whole project), then:

**App root directory**: `.` (just a dot, meaning root)

But this only works if the repo root IS the frontend app.

### Solution 5: Check .gitignore

Make sure `frontend/` is NOT in `.gitignore`. Check:

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal"
cat .gitignore | grep frontend
```

If `frontend` is ignored, remove it from `.gitignore` and commit again.

## Recommended Steps:

1. ✅ **First**: Push code to GitHub (via GitHub Desktop)
2. ✅ **Verify**: Check https://github.com/evgenyrodionov/Affiliate-Portal - can you see `frontend/` folder?
3. ✅ **Then**: Configure Firebase with root directory: `frontend`
4. ✅ **Build command**: `npm install && npm run build`
5. ✅ **Output directory**: `out`

## Quick Check:

Run this to see what Firebase will see:
```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal"
git ls-files | grep "^frontend/package.json"
```

If this shows `frontend/package.json`, then the file is tracked and will be in GitHub after push.

## Most Likely Issue:

**The code hasn't been pushed to GitHub yet!**

Firebase can only access files that are in your GitHub repository. If you just configured the repository but haven't pushed, Firebase won't see the `frontend` folder.

**Fix**: Push to GitHub first, then configure Firebase.
