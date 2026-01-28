# 🔐 Setup Login Credentials

## Admin Credentials

The seed file creates an admin user with these credentials:
- **Email:** `admin@accessfinancial.com`
- **Password:** `Admin123!`

## ⚠️ Issue: Database Not Seeded

If you can't login, the database likely hasn't been seeded yet. Follow these steps:

### Step 1: Start the Backend

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
npm install  # If not done already
npm run start:dev
```

Wait for the server to start (you'll see "Nest application successfully started").

### Step 2: Seed the Database

In a **new terminal window**, run:

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
npm run prisma:seed
```

You should see:
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

### Step 3: Verify Database Connection

Make sure your `.env` file in the `backend` directory has the correct database URL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/affiliate_portal"
```

### Step 4: Try Login Again

1. Make sure backend is running on `http://localhost:4000`
2. Go to the frontend login page
3. Use:
   - Email: `admin@accessfinancial.com`
   - Password: `Admin123!`

## Alternative: Create Admin User Manually

If seeding doesn't work, you can create the admin user manually using Prisma Studio:

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
npx prisma studio
```

Then:
1. Open the `User` table
2. Click "Add record"
3. Fill in:
   - email: `admin@accessfinancial.com`
   - password: (hash it first - see below)
   - role: `SYSTEM_ADMIN`
   - emailVerified: `true`

### Hash Password Manually

Run this in Node.js:
```javascript
const bcrypt = require('bcrypt');
bcrypt.hash('Admin123!', 10).then(hash => console.log(hash));
```

## Check Backend Logs

If login still fails, check the backend terminal for errors. Common issues:
- Database connection failed
- JWT secret not set in `.env`
- CORS issues

---

**Most likely fix: Run `npm run prisma:seed` in the backend directory!** 🚀
