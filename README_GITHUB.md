# Deploy Without Terminal - Quick Guide

## 🚀 Easiest Method: GitHub + Firebase Integration

### What You Need:
- GitHub account (free)
- GitHub Desktop app (optional, but easiest)

### Steps:

1. **Create GitHub Repository**
   - Go to https://github.com/new
   - Name it: `affiliate-portal`
   - Create repository

2. **Push Code Using GitHub Desktop**
   - Download: https://desktop.github.com/
   - Install and login
   - File → Add Local Repository
   - Select this folder
   - Click "Publish repository"

3. **Connect Firebase to GitHub**
   - Go to: https://console.firebase.google.com/project/af-affiliate-portal/hosting
   - Click "Connect GitHub" or "Get started"
   - Authorize Firebase
   - Select your repository
   - Configure:
     - Root: `frontend`
     - Build: `npm install && npm run build`
     - Output: `out`

4. **Done!** 
   - Every push to GitHub = automatic deployment
   - No terminal needed!

## Alternative: VS Code Firebase Extension

1. Install "Firebase" extension in VS Code
2. Click Firebase icon → Sign in
3. Right-click project → Deploy

## See `SETUP_GITHUB_DEPLOY.md` for detailed instructions!
