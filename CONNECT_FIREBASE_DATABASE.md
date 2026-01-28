# 🔗 Connect to Firebase Cloud SQL Database

## Your Cloud SQL Instance Details

Based on your Firebase setup:
- **Project ID:** `af-affiliate-portal`
- **Region:** `us-east4` (Northern Virginia)
- **Instance ID:** `af-affiliate-portal-instance`
- **Database Name:** `af-affiliate-portal-database`
- **Service ID:** `af-affiliate-portal-service`

## Step 1: Get Database Credentials

You need to:
1. Set a password for the `postgres` user in Cloud SQL
2. Get the instance connection name or IP address

### In Firebase Console:
1. Go to **Firebase Console** → **Project Settings** → **Data Connect**
2. Or go to **Google Cloud Console** → **SQL** → **af-affiliate-portal-instance**
3. Set/reset the `postgres` user password
4. Note the **Public IP** address (if using direct connection)

## Step 2: Update DATABASE_URL

Edit `backend/.env` and update `DATABASE_URL` with one of these options:

### Option A: Cloud SQL Proxy (Recommended for Local Development)

1. **Install Cloud SQL Proxy:**
   ```bash
   curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
   chmod +x cloud-sql-proxy
   sudo mv cloud-sql-proxy /usr/local/bin/
   ```

2. **Start Cloud SQL Proxy:**
   ```bash
   cloud-sql-proxy af-affiliate-portal:us-east4:af-affiliate-portal-instance
   ```
   Keep this running in a separate terminal.

3. **Update DATABASE_URL in `backend/.env`:**
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/af-affiliate-portal-database?schema=public"
   ```

### Option B: Direct Connection (Easier, but requires IP whitelist)

1. **Get Instance IP:**
   - Go to Google Cloud Console → SQL → af-affiliate-portal-instance
   - Copy the **Public IP** address

2. **Whitelist Your IP:**
   - In Cloud SQL instance → **Connections** → **Authorized networks**
   - Add your current IP address

3. **Update DATABASE_URL in `backend/.env`:**
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@INSTANCE_PUBLIC_IP:5432/af-affiliate-portal-database?schema=public"
   ```
   Replace:
   - `YOUR_PASSWORD` with the postgres user password
   - `INSTANCE_PUBLIC_IP` with the actual IP address

## Step 3: Run Migrations and Create Admin User

Once DATABASE_URL is configured:

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create admin user
npm run prisma:seed
```

## Step 4: Verify Connection

Test the connection:
```bash
cd backend
npx prisma studio
```

This will open Prisma Studio at `http://localhost:5555` where you can see your database.

## Admin Credentials (After Seeding)

- **Email:** `admin@accessfinancial.com`
- **Password:** `Admin123!`

## Quick Setup Script

After updating DATABASE_URL, run:
```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
./setup-admin-complete.sh
```

---

**Update DATABASE_URL in `backend/.env` with your Cloud SQL credentials, then run migrations and seed!** 🚀
