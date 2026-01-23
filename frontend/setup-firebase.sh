#!/bin/bash

echo "🔧 Setting up Firebase Hosting..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Check if logged in
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "Please login to Firebase..."
    firebase login
fi

# Navigate to frontend
cd "$(dirname "$0")"

# Check if .firebaserc exists
if [ ! -f ".firebaserc" ]; then
    echo "⚙️  Initializing Firebase..."
    firebase init hosting --project affiliate-portal-121a7
    
    # Set defaults
    echo "out" | firebase init hosting --project affiliate-portal-121a7 --public out --yes
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Build the app
echo "🔨 Building Next.js app..."
npm run build

# Check if build was successful
if [ ! -d "out" ] || [ ! -f "out/index.html" ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🚀 Ready to deploy! Run:"
echo "   firebase deploy --only hosting"
echo ""
echo "Or use: ./deploy.sh"
