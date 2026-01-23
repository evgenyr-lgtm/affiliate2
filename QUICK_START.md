# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+ 
- PostgreSQL (or Docker)
- npm or yarn

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Set Up Database

**Create database:**
```bash
createdb affiliate_portal
# Or via psql: CREATE DATABASE affiliate_portal;
```

**Configure connection in `backend/.env`:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/affiliate_portal?schema=public"
JWT_SECRET=change-this-to-a-random-32-character-string-in-production
JWT_REFRESH_SECRET=change-this-to-another-random-32-character-string
PORT=4000
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@accessfinancial.com
```

### 3. Run Migrations & Seed
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
cd ..
```

### 4. Configure Frontend
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
```

### 5. Launch!
```bash
# Option 1: Use the launch script
./start.sh

# Option 2: Manual launch (2 terminals)
# Terminal 1:
cd backend && npm run start:dev

# Terminal 2:
cd frontend && npm run dev
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **API Docs**: http://localhost:4000/api/docs

## Default Admin Credentials

After running the seed script:
- **Email**: `admin@accessfinancial.com`
- **Password**: `Admin123!`

## What's Included

✅ Complete authentication system
✅ Affiliate registration & approval
✅ Referral tracking system
✅ Admin panel
✅ Email notifications
✅ File uploads
✅ Account settings
✅ Cookie-based affiliate tracking

## Next Steps

1. Register a new affiliate account
2. Login as admin and approve the affiliate
3. Test referral creation
4. Configure email settings
5. Upload brand materials

## Troubleshooting

**Database connection error?**
- Check PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
- Verify DATABASE_URL format in `backend/.env`

**Port already in use?**
- Change PORT in `backend/.env` or kill the process

**Module not found?**
- Run `npm install` in both backend and frontend directories

**Prisma errors?**
- Run `cd backend && npx prisma generate && npx prisma migrate dev`

For detailed setup, see `LAUNCH.md`
