#!/bin/bash

echo "🚀 Deploying to Firebase (af-affiliate-portal)..."

cd "$(dirname "$0")/frontend"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Check if logged in
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null 2>&1; then
    echo "⚠️  Please login to Firebase first:"
    echo "   firebase login"
    exit 1
fi

# Install Firebase SDK if needed
if ! grep -q "firebase" package.json; then
    echo "📦 Installing Firebase SDK..."
    npm install firebase
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Build the app
echo "🔨 Building Next.js application..."
npm run build

# Check if build was successful
if [ ! -d "out" ] || [ ! -f "out/index.html" ]; then
    echo "❌ Build failed! The 'out' directory was not created."
    echo "   Please check for build errors above."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Firebase
echo "☁️  Deploying to Firebase Hosting (af-affiliate-portal-b831d)..."
firebase deploy --only hosting:af-affiliate-portal-b831d

echo ""
echo "✅ Deployment complete!"
echo "🌐 Check Firebase Console for your app URL:"
echo "   https://console.firebase.google.com/project/af-affiliate-portal/hosting"
