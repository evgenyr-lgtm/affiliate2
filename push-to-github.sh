#!/bin/bash

# Script to push to GitHub and trigger Firebase deployment

cd "$(dirname "$0")"

echo "🚀 Preparing to push to GitHub..."

# Check if remote exists
if git remote get-url origin &> /dev/null; then
    echo "✅ GitHub remote already configured"
    REMOTE_URL=$(git remote get-url origin)
    echo "   Remote: $REMOTE_URL"
else
    echo "⚠️  No GitHub remote configured"
    echo ""
    echo "Please provide your GitHub repository URL"
    echo "Format: https://github.com/username/repository-name.git"
    echo ""
    read -p "Enter GitHub repository URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo "❌ No URL provided. Exiting."
        exit 1
    fi
    
    echo "📎 Adding remote..."
    git remote add origin "$REPO_URL"
    echo "✅ Remote added"
fi

echo ""
echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🔥 Firebase will automatically deploy in a few moments"
    echo ""
    echo "Check deployment status at:"
    echo "https://console.firebase.google.com/project/af-affiliate-portal/hosting"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "   1. GitHub repository exists"
    echo "   2. You have push permissions"
    echo "   3. GitHub credentials are configured"
fi
