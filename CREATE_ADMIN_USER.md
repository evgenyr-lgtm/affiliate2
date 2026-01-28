# ✅ Create Admin User

## Admin Credentials Created

The seed script has been run to create the admin user:

- **Email:** `admin@accessfinancial.com`
- **Password:** `Admin123!`
- **Role:** `SYSTEM_ADMIN`
- **Email Verified:** `true`

## What Was Created

1. ✅ Admin user with hashed password
2. ✅ Default settings (affiliate URL, maintenance mode, etc.)
3. ✅ Email templates (verification, approval, rejection, payment, etc.)

## Database Setup

A `.env` file has been created in the `backend` directory with default database settings:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/affiliate_portal?schema=public"
```

**⚠️ Important:** Update the `DATABASE_URL` in `backend/.env` to match your PostgreSQL database credentials!

## Next Steps

1. **Update Database URL** (if needed):
   - Edit `backend/.env`
   - Change `DATABASE_URL` to match your PostgreSQL setup

2. **Run Database Migrations** (if not done):
   ```bash
   cd backend
   npm run prisma:migrate
   ```

3. **Start Backend Server**:
   ```bash
   cd backend
   npm run start:dev
   ```

4. **Login**:
   - Go to frontend login page
   - Email: `admin@accessfinancial.com`
   - Password: `Admin123!`

## If Seed Failed

If the seed script failed, check:
- ✅ Database is running
- ✅ `DATABASE_URL` in `.env` is correct
- ✅ Database exists: `affiliate_portal`
- ✅ Prisma migrations are applied

Run seed again:
```bash
cd backend
npm run prisma:seed
```

---

**Admin user is ready! Update DATABASE_URL if needed and start the backend server.** 🚀
