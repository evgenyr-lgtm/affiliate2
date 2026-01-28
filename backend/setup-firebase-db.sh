#!/bin/bash

echo "🔗 Setting up Firebase Cloud SQL Connection"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  Make sure you've updated DATABASE_URL in backend/.env${NC}"
echo "   with your Cloud SQL credentials!"
echo ""
read -p "Press Enter to continue after updating .env file..."

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Check if DATABASE_URL is still using placeholder
if grep -q "YOUR_PASSWORD\|INSTANCE_IP" .env; then
    echo -e "${RED}❌ Please update DATABASE_URL in .env with actual credentials${NC}"
    echo "   Replace YOUR_PASSWORD and INSTANCE_IP with real values"
    exit 1
fi

echo ""
echo "📦 Step 1: Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

echo "🗄️  Step 2: Running database migrations..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Migrations may have failed or already applied${NC}"
    echo "Trying migrate dev..."
    npx prisma migrate dev --name init
fi
echo ""

echo "🌱 Step 3: Creating admin user..."
npm run prisma:seed
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Setup complete!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}Admin Credentials:${NC}"
    echo "  Email: admin@accessfinancial.com"
    echo "  Password: Admin123!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo -e "${RED}❌ Failed to create admin user${NC}"
    echo "Check DATABASE_URL in .env and try again"
    exit 1
fi
