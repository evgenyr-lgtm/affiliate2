#!/bin/bash

echo "🚀 Starting Affiliate Portal..."

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found. Please create it from backend/.env.example"
    echo "   See LAUNCH.md for configuration details"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Warning: frontend/.env.local not found. Creating default..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > frontend/.env.local
    echo "NEXT_PUBLIC_RECAPTCHA_SITE_KEY=" >> frontend/.env.local
fi

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check if database is set up
echo "🔍 Checking database setup..."
cd backend
if ! npx prisma db pull > /dev/null 2>&1; then
    echo "📊 Setting up database..."
    echo "   Please ensure PostgreSQL is running and DATABASE_URL is correct in backend/.env"
    echo "   Then run: cd backend && npx prisma migrate dev && npm run prisma:seed"
    cd ..
    exit 1
fi
cd ..

# Create upload directories
mkdir -p backend/uploads/documents backend/uploads/avatars

echo "✅ Setup complete!"
echo ""
echo "Starting servers..."
echo "   Backend: http://localhost:4000"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:4000/api/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
npm run dev
