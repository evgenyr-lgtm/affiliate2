#!/bin/bash

# Simple deployment script
cd "$(dirname "$0")"

echo "🚀 Starting deployment..."

# Set npm cache to local directory to avoid permission issues
export npm_config_cache="./.npm-cache"
mkdir -p .npm-cache

echo "📦 Installing dependencies..."
npm install --cache .npm-cache

echo "🔨 Building application..."
npm run build

if [ ! -d "out" ] || [ ! -f "out/index.html" ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi

echo "☁️  Deploying to Firebase..."
firebase deploy --only hosting:af-affiliate-portal-b831d

echo "✅ Deployment complete!"
