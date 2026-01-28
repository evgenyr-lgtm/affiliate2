# ⚡ Quick Setup: Create Admin User

## The Issue

The database isn't running or connected. Follow these steps:

## Quick Steps

### 1. Start PostgreSQL Database

**On macOS:**
```bash
brew services start postgresql@14
```

**Or check if it's already running:**
```bash
brew services list | grep postgresql
```

### 2. Create Database (if needed)

```bash
createdb affiliate_portal
# or
psql -U postgres -c "CREATE DATABASE affiliate_portal;"
```

### 3. Update Database URL

Edit `backend/.env` and make sure `DATABASE_URL` matches your PostgreSQL setup:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/affiliate_portal?schema=public"
```

Change `postgres:postgres` to your PostgreSQL username and password.

### 4. Run Setup Script

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
./create-admin.sh
```

Or manually:
```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

## Admin Credentials

After seeding completes:
- **Email:** `admin@accessfinancial.com`
- **Password:** `Admin123!`

## Verify It Worked

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
npx prisma studio
```

Open `http://localhost:5555` and check the `User` table for the admin user.

---

**Make sure PostgreSQL is running, then run the setup script!** 🚀
