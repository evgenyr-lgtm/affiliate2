# 🚀 Quick Firebase Deployment

## One-Command Deploy

```bash
./deploy.sh
```

## Manual Steps

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Build & Deploy Frontend
```bash
cd frontend
npm install
npm run build
firebase deploy --only hosting
```

### 3. Your App is Live!
- https://affiliate-portal-121a7.web.app
- https://affiliate-portal-121a7.firebaseapp.com

## ⚠️ Important Notes

### Backend Must Be Deployed Separately

Firebase Hosting only serves static files. Your NestJS backend needs separate hosting:

**Recommended Options:**
1. **Google Cloud Run** (same ecosystem) - See `FIREBASE_DEPLOYMENT.md`
2. **Railway** (easiest) - railway.app
3. **Render** - render.com
4. **Heroku** - heroku.com

### Update API URL

After deploying backend, update `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

Then rebuild and redeploy:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Update Backend CORS

In `backend/src/main.ts`, add Firebase URLs:
```typescript
app.enableCors({
  origin: [
    'https://affiliate-portal-121a7.web.app',
    'https://affiliate-portal-121a7.firebaseapp.com',
    'http://localhost:3000',
  ],
  credentials: true,
});
```

## Environment Variables

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-production-key
```

### Backend (set in hosting platform)
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL=https://affiliate-portal-121a7.web.app`
- `SMTP_*` (email config)
- All other vars from `backend/.env`

## Troubleshooting

**Build fails?**
- Check Node.js 18+
- Clear `.next`: `rm -rf frontend/.next`
- Reinstall: `rm -rf node_modules && npm install`

**Deploy fails?**
- Verify Firebase login: `firebase login`
- Check project ID matches: `affiliate-portal-121a7`

**CORS errors?**
- Update backend CORS with Firebase URLs
- Check `FRONTEND_URL` in backend env

For detailed deployment guide, see `FIREBASE_DEPLOYMENT.md`
