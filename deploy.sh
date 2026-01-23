#!/bin/bash

echo "🚀 Deploying Affiliate Portal to Firebase..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production not found. Creating from .env.local..."
    if [ -f ".env.local" ]; then
        cp .env.local .env.production
    else
        echo "NEXT_PUBLIC_API_URL=https://your-backend-url.com" > .env.production
        echo "NEXT_PUBLIC_RECAPTCHA_SITE_KEY=" >> .env.production
        echo "⚠️  Please update .env.production with your production API URL"
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Build Next.js app
echo "🔨 Building Next.js application..."
npm run build

# Deploy to Firebase
echo "☁️  Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is live at:"
echo "   https://affiliate-portal-121a7.web.app"
echo "   https://affiliate-portal-121a7.firebaseapp.com"
echo ""
echo "⚠️  Remember to:"
echo "   1. Deploy your backend separately (see FIREBASE_DEPLOYMENT.md)"
echo "   2. Update NEXT_PUBLIC_API_URL in .env.production"
echo "   3. Update CORS settings in backend"
echo ""

cd ..
