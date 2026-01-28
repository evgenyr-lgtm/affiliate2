# 🗄️ Firebase Cloud SQL Database Setup

## Your Database Details

- **Project:** `af-affiliate-portal`
- **Region:** `us-east4` (Northern Virginia)
- **Instance:** `af-affiliate-portal-instance`
- **Database:** `af-affiliate-portal-database`

## Quick Setup Steps

### 1. Get Database Password

In Firebase/Google Cloud Console:
1. Go to **Cloud SQL** → **af-affiliate-portal-instance**
2. Go to **Users** tab
3. Set/reset password for `postgres` user
4. **Save the password!**

### 2. Get Instance IP (for Direct Connection)

1. In Cloud SQL instance → **Overview**
2. Copy the **Public IP** address
3. Go to **Connections** → **Authorized networks**
4. Click **Add network** and add your current IP

### 3. Update backend/.env

Edit `backend/.env` and set:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@INSTANCE_IP:5432/af-affiliate-portal-database?schema=public"
```

Replace:
- `YOUR_PASSWORD` → The postgres password you set
- `INSTANCE_IP` → The Public IP from step 2

### 4. Run Setup Script

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
./setup-firebase-db.sh
```

This will:
- ✅ Generate Prisma client
- ✅ Run migrations (create tables)
- ✅ Create admin user

## Admin Credentials

After setup completes:
- **Email:** `admin@accessfinancial.com`
- **Password:** `Admin123!`

## Alternative: Manual Setup

If you prefer manual steps:

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"

# 1. Generate Prisma client
npx prisma generate

# 2. Run migrations
npx prisma migrate deploy

# 3. Create admin user
npm run prisma:seed
```

## Verify Connection

```bash
cd backend
npx prisma studio
```

Opens database browser at `http://localhost:5555`

---

**Update DATABASE_URL in backend/.env, then run ./setup-firebase-db.sh!** 🚀
