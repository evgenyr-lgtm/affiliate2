# Launch Guide - Quick Start

## Prerequisites Check

- ✅ Node.js 18+ installed
- ✅ PostgreSQL running (or use Docker)
- ✅ npm or yarn installed

## Quick Launch Steps

### 1. Install Dependencies

```bash
# From project root
npm run install:all
```

Or manually:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Set Up Database

**Option A: Using existing PostgreSQL**
```bash
# Create database
createdb affiliate_portal

# Or via psql:
# psql -U postgres
# CREATE DATABASE affiliate_portal;
```

**Option B: Using Docker (if you have Docker)**
```bash
docker run --name affiliate-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=affiliate_portal -p 5432:5432 -d postgres:15
```

### 3. Configure Environment

**Backend (.env)**
```bash
cd backend
cp .env.example .env  # If .env.example exists, or create .env manually
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/affiliate_portal?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@accessfinancial.com
```

**Frontend (.env.local)**
```bash
cd frontend
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
```

> **Note**: reCAPTCHA is optional for development. Leave empty to skip verification.

### 4. Run Database Migrations & Seed

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

This will:
- Create all database tables
- Create admin user (email: `admin@accessfinancial.com`, password: `Admin123!`)
- Set up default settings
- Create email templates

### 5. Create Upload Directories

```bash
cd backend
mkdir -p uploads/documents uploads/avatars
```

### 6. Launch Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

Wait for: `Application is running on: http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Wait for: `Ready - started server on 0.0.0.0:3000`

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **API Docs**: http://localhost:4000/api/docs

### 8. Login

**Admin Login:**
- Email: `admin@accessfinancial.com`
- Password: `Admin123!`

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Verify DATABASE_URL in backend/.env
# Format: postgresql://username:password@host:port/database
```

### Port Already in Use
```bash
# Change PORT in backend/.env or frontend/.env.local
# Or kill process using the port:
# macOS/Linux: lsof -ti:4000 | xargs kill
# Windows: netstat -ano | findstr :4000
```

### Module Not Found
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

### Prisma Errors
```bash
cd backend
npx prisma generate
npx prisma migrate reset  # WARNING: This deletes all data
npx prisma migrate dev
```

## Next Steps After Launch

1. **Test Registration**: Register a new affiliate account
2. **Approve Affiliate**: Login as admin and approve the affiliate
3. **Test Referral**: Create a referral from affiliate dashboard
4. **Configure Settings**: Update default affiliate URL and email settings

## Development Notes

- Backend hot-reloads on file changes
- Frontend hot-reloads on file changes
- Database changes require migration: `npx prisma migrate dev`
- Upload files are stored in `backend/uploads/`
- Logs appear in terminal where servers are running

## Production Deployment

For production:
1. Set `NODE_ENV=production`
2. Use strong JWT secrets (32+ characters)
3. Configure production database
4. Set up proper SMTP service
5. Enable HTTPS
6. Configure CORS properly
7. Set up file storage (S3 or similar)
8. Configure backups
