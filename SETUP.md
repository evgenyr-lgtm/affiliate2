# Setup Guide - Affiliate Portal

## Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Redis (optional, for rate limiting)
- npm or yarn

### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE affiliate_portal;
```

2. Configure database connection in `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/affiliate_portal?schema=public"
```

3. Run migrations:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### Step 3: Environment Configuration

#### Backend (.env)
Create `backend/.env` file:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/affiliate_portal?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Application
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# reCAPTCHA (get from https://www.google.com/recaptcha/admin)
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
RECAPTCHA_SITE_KEY=your-recaptcha-site-key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@accessfinancial.com

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Zoho Desk (optional)
ZOHO_DESK_API_URL=https://desk.zoho.com/api/v1
ZOHO_DESK_ORG_ID=your-org-id
ZOHO_DESK_API_KEY=your-api-key
```

#### Frontend (.env.local)
Create `frontend/.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

### Step 4: Create Initial Admin User

You can create an admin user via Prisma Studio or SQL:

```bash
cd backend
npx prisma studio
```

Or via SQL:
```sql
-- Create admin user (password: Admin123!)
INSERT INTO "User" (id, email, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@accessfinancial.com',
  '$2b$10$YourHashedPasswordHere', -- Use bcrypt to hash password
  'SYSTEM_ADMIN',
  true,
  NOW(),
  NOW()
);
```

**Note**: You'll need to hash the password using bcrypt. You can use an online tool or create a simple script.

### Step 5: Initialize Settings

After creating an admin user, log in and configure:
1. Default Affiliate URL
2. Manager notification emails
3. Email templates
4. reCAPTCHA keys (if not in .env)

### Step 6: Run Development Servers

#### Option 1: Run separately
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### Option 2: Run together (from root)
```bash
npm run dev
```

### Step 7: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Documentation: http://localhost:4000/api/docs
- Prisma Studio: `cd backend && npx prisma studio`

## Initial Configuration Checklist

- [ ] Database created and migrated
- [ ] Environment variables configured
- [ ] Admin user created
- [ ] reCAPTCHA keys configured
- [ ] SMTP email configured
- [ ] Default settings configured via admin panel
- [ ] Email templates configured
- [ ] Zoho Desk configured (optional)

## Testing the Setup

1. **Register a new affiliate**:
   - Go to http://localhost:3000/register
   - Fill in the registration form
   - Check email for verification link

2. **Login as admin**:
   - Go to http://localhost:3000/login
   - Use admin credentials
   - Approve the affiliate from admin panel

3. **Test affiliate dashboard**:
   - Login as affiliate
   - View dashboard
   - Generate affiliate link
   - Submit a manual referral

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### Email Not Sending
- Verify SMTP credentials
- Check spam folder
- For Gmail, use App Password (not regular password)

### reCAPTCHA Errors
- Verify site key and secret key match
- Check domain configuration in reCAPTCHA admin
- In development, reCAPTCHA can be skipped if secret key is not set

### CORS Issues
- Ensure FRONTEND_URL in backend .env matches frontend URL
- Check CORS configuration in main.ts

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure production database
4. Set up proper SMTP service
5. Configure CDN for static assets
6. Set up SSL certificates
7. Configure proper CORS origins
8. Enable rate limiting
9. Set up monitoring and logging
10. Configure backup strategy

## Next Steps

See `IMPLEMENTATION.md` for detailed feature documentation and next steps for completing the implementation.
