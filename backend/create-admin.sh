#!/bin/bash

echo "🔐 Creating Admin User..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "   Please create backend/.env with DATABASE_URL"
    exit 1
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run migrations (if needed)
echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate deploy || echo "⚠️  Migrations may already be applied"

# Seed database
echo ""
echo "🌱 Seeding database with admin user..."
npm run prisma:seed

echo ""
echo "✅ Done!"
echo ""
echo "Admin credentials:"
echo "  Email: admin@accessfinancial.com"
echo "  Password: Admin123!"
echo ""
