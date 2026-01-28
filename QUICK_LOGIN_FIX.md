# 🔐 Quick Fix: Can't Login

## Admin Credentials (Correct)
- **Email:** `admin@accessfinancial.com`
- **Password:** `Admin123!`

## Most Likely Issue: Database Not Seeded

The admin user needs to be created in the database first. Follow these steps:

### Step 1: Check if Backend is Running

Open Terminal and check if backend is running on port 4000:
```bash
curl http://localhost:4000/api/health
```

If you get an error, the backend isn't running.

### Step 2: Start Backend (if not running)

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
npm install  # If not done already
npm run start:dev
```

Keep this terminal open - backend must be running!

### Step 3: Seed the Database

Open a **NEW terminal window** and run:

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
npm run prisma:seed
```

**Expected output:**
```
Seeding database...
Created admin user: admin@accessfinancial.com
Created default settings
Created email templates
Seeding completed!
Admin credentials:
  Email: admin@accessfinancial.com
  Password: Admin123!
```

### Step 4: Verify Database Connection

Make sure `backend/.env` exists and has:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/affiliate_portal"
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"
```

### Step 5: Try Login Again

1. Make sure backend is running (`http://localhost:4000`)
2. Go to frontend login page
3. Use:
   - Email: `admin@accessfinancial.com`
   - Password: `Admin123!`

## If Still Can't Login

### Check Backend Logs

Look at the backend terminal for errors. Common issues:
- Database connection failed
- User not found (database not seeded)
- Password mismatch

### Verify User Exists

Run Prisma Studio to check:
```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
npx prisma studio
```

Open browser to `http://localhost:5555` and check the `User` table.

### Check Frontend API URL

Make sure frontend is pointing to the correct backend URL. Check `frontend/.env.local` or `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Quick Test Command

Test login directly via API:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@accessfinancial.com","password":"Admin123!"}'
```

If this works, the issue is with the frontend. If it fails, check backend logs.

---

**Most likely fix: Run `npm run prisma:seed` in the backend directory!** 🚀
