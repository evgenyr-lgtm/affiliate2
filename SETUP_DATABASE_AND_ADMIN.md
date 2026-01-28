# 🗄️ Setup Database and Create Admin User

## Prerequisites

1. **PostgreSQL must be installed and running**
2. **Database must exist**

## Step 1: Start PostgreSQL

### On macOS (using Homebrew):
```bash
brew services start postgresql@14
# or
brew services start postgresql@15
```

### Check if PostgreSQL is running:
```bash
psql -U postgres -c "SELECT version();"
```

## Step 2: Create Database

```bash
psql -U postgres
```

Then in psql:
```sql
CREATE DATABASE affiliate_portal;
\q
```

## Step 3: Update Database URL

Edit `backend/.env` and update `DATABASE_URL`:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/affiliate_portal?schema=public"
```

**Common examples:**
- Default postgres user: `postgresql://postgres:postgres@localhost:5432/affiliate_portal`
- Your username: `postgresql://yourname@localhost:5432/affiliate_portal`

## Step 4: Run Database Migrations

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
npm run prisma:migrate
```

This creates all the database tables.

## Step 5: Create Admin User

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

## Step 6: Verify Admin User

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
npx prisma studio
```

Open browser to `http://localhost:5555` and check the `User` table.

## Admin Credentials

- **Email:** `admin@accessfinancial.com`
- **Password:** `Admin123!`
- **Role:** `SYSTEM_ADMIN`

## Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running: `brew services list`
- Check DATABASE_URL in `backend/.env`
- Verify database exists: `psql -U postgres -l`

### Migration Errors
- Make sure database exists
- Check DATABASE_URL is correct
- Try: `npx prisma migrate reset` (⚠️ deletes all data)

### Seed Errors
- Make sure migrations are applied first
- Check database connection
- Verify Prisma client is generated: `npx prisma generate`

---

**Once database is running, run `npm run prisma:seed` to create the admin user!** 🚀
