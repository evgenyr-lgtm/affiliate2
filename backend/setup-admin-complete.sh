#!/bin/bash

echo "🔐 Complete Admin User Setup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check PostgreSQL
echo "📋 Step 1: Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL (psql) not found in PATH${NC}"
    echo ""
    echo "Please install PostgreSQL first:"
    echo "  brew install postgresql@14"
    echo "  brew services start postgresql@14"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL found${NC}"
echo ""

# Step 2: Check if PostgreSQL is running
echo "📋 Step 2: Checking if PostgreSQL is running..."
if ! pg_isready -U postgres &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running${NC}"
    echo ""
    echo "Starting PostgreSQL..."
    
    # Try to start via Homebrew
    if command -v brew &> /dev/null; then
        brew services start postgresql@14 2>/dev/null || \
        brew services start postgresql@15 2>/dev/null || \
        brew services start postgresql 2>/dev/null || \
        echo -e "${RED}❌ Could not start PostgreSQL automatically${NC}"
        echo "Please start PostgreSQL manually:"
        echo "  brew services start postgresql@14"
        sleep 3
    else
        echo -e "${RED}❌ Please start PostgreSQL manually${NC}"
        exit 1
    fi
fi

if pg_isready -U postgres &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL is still not running${NC}"
    echo "Please start PostgreSQL and try again"
    exit 1
fi
echo ""

# Step 3: Create database
echo "📋 Step 3: Creating database (if needed)..."
psql -U postgres -c "CREATE DATABASE affiliate_portal;" 2>/dev/null && \
    echo -e "${GREEN}✅ Database created${NC}" || \
    echo -e "${YELLOW}⚠️  Database may already exist${NC}"
echo ""

# Step 4: Generate Prisma client
echo "📋 Step 4: Generating Prisma client..."
cd "$(dirname "$0")"
npx prisma generate > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi
echo ""

# Step 5: Run migrations
echo "📋 Step 5: Running database migrations..."
npx prisma migrate deploy > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations applied${NC}"
else
    echo -e "${YELLOW}⚠️  Migrations may already be applied or failed${NC}"
    echo "Trying migrate dev..."
    npx prisma migrate dev --name init > /dev/null 2>&1 || echo "Migration check completed"
fi
echo ""

# Step 6: Seed database
echo "📋 Step 6: Creating admin user..."
npm run prisma:seed
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Admin user created successfully!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}Admin Credentials:${NC}"
    echo "  Email: admin@accessfinancial.com"
    echo "  Password: Admin123!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo -e "${RED}❌ Failed to create admin user${NC}"
    echo "Check the error above for details"
    exit 1
fi
