# Firebase Deployment Guide

## Overview

This guide covers deploying the Affiliate Portal to Firebase. Note that:
- **Frontend (Next.js)** → Firebase Hosting ✅
- **Backend (NestJS)** → Needs separate hosting (see Backend Deployment section)

## Frontend Deployment to Firebase

### Prerequisites

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in frontend directory:
```bash
cd frontend
firebase init hosting
```

When prompted:
- Select "Use an existing project" → `affiliate-portal-121a7`
- Public directory: `out`
- Configure as single-page app: `Yes`
- Set up automatic builds: `No` (we'll do it manually)

### Build and Deploy

1. **Build the frontend:**
```bash
cd frontend
npm run build
```

This creates a static export in the `out` directory.

2. **Deploy to Firebase:**
```bash
firebase deploy --only hosting
```

Or use the npm script:
```bash
npm run deploy
```

3. **Access your deployed app:**
Your app will be available at:
- `https://affiliate-portal-121a7.web.app`
- `https://affiliate-portal-121a7.firebaseapp.com`

### Environment Variables for Production

Before building, set production environment variables:

Create `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-production-recaptcha-key
```

Then build:
```bash
NODE_ENV=production npm run build
```

## Backend Deployment Options

Since Firebase Hosting only serves static files, you need to deploy the NestJS backend separately. Here are the best options:

### Option 1: Google Cloud Run (Recommended - Same Ecosystem)

1. **Create Dockerfile for backend:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
```

2. **Deploy to Cloud Run:**
```bash
cd backend
gcloud builds submit --tag gcr.io/affiliate-portal-121a7/backend
gcloud run deploy affiliate-backend \
  --image gcr.io/affiliate-portal-121a7/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 2: Railway (Easiest)

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Add PostgreSQL service
5. Set environment variables
6. Deploy automatically

### Option 3: Heroku

1. Install Heroku CLI
2. Create `Procfile` in backend:
```
web: npm run start:prod
```
3. Deploy:
```bash
cd backend
heroku create affiliate-backend
heroku addons:create heroku-postgresql
git push heroku main
```

### Option 4: Render

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect repository
4. Configure:
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm run start:prod`
5. Add PostgreSQL database
6. Set environment variables

## Configuration Steps

### 1. Update Frontend API URL

After deploying backend, update `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### 2. Update Backend CORS

In `backend/src/main.ts`, update CORS:
```typescript
app.enableCors({
  origin: [
    'https://affiliate-portal-121a7.web.app',
    'https://affiliate-portal-121a7.firebaseapp.com',
    'http://localhost:3000', // For local development
  ],
  credentials: true,
});
```

### 3. Environment Variables for Backend

Set these in your backend hosting platform:
- `DATABASE_URL` (from your hosted PostgreSQL)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL` (Firebase hosting URL)
- `SMTP_*` (email configuration)
- All other variables from `backend/.env`

## Quick Deploy Script

Create `deploy.sh`:
```bash
#!/bin/bash

echo "🚀 Deploying to Firebase..."

# Build frontend
cd frontend
npm run build

# Deploy to Firebase
firebase deploy --only hosting

echo "✅ Deployment complete!"
echo "🌐 App URL: https://affiliate-portal-121a7.web.app"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend API URL updated
- [ ] CORS configured on backend
- [ ] Database migrations run on production DB
- [ ] Environment variables set
- [ ] SSL certificates configured
- [ ] Domain configured (optional)
- [ ] reCAPTCHA keys updated for production
- [ ] Email SMTP configured
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test admin panel

## Troubleshooting

### Build Errors
- Check Node.js version (18+)
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Deployment Errors
- Verify Firebase project ID matches
- Check Firebase CLI is logged in: `firebase login`
- Verify `firebase.json` configuration

### CORS Errors
- Update backend CORS to include Firebase URLs
- Check `FRONTEND_URL` in backend environment

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` in frontend
- Check backend is running and accessible
- Verify CORS settings

## Custom Domain (Optional)

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow DNS configuration steps
4. Update CORS in backend to include custom domain

## Continuous Deployment

Set up GitHub Actions for automatic deployment:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: affiliate-portal-121a7
```

## Notes

- Firebase Hosting serves static files only
- Backend must be deployed separately
- Consider using Firebase Functions for API endpoints (requires refactoring)
- For full-stack Next.js with API routes, consider Vercel instead
- Database should be hosted separately (Cloud SQL, Railway, etc.)
