# 🚀 Run Admin Setup Script

## What I've Done

I've created a complete setup script that will:
1. ✅ Check if PostgreSQL is installed
2. ✅ Start PostgreSQL if needed
3. ✅ Create the database
4. ✅ Generate Prisma client
5. ✅ Run migrations
6. ✅ Create admin user

## Run the Script

```bash
cd "/Users/evgenyrodionov/Desktop/Affiliate Portal/backend"
./setup-admin-complete.sh
```

## What You Need First

**PostgreSQL must be installed.** If it's not installed:

### Install PostgreSQL (macOS):
```bash
brew install postgresql@14
```

### Start PostgreSQL:
```bash
brew services start postgresql@14
```

## After Running the Script

You'll have:
- ✅ Database created: `affiliate_portal`
- ✅ All tables created
- ✅ Admin user created

**Admin Credentials:**
- Email: `admin@accessfinancial.com`
- Password: `Admin123!`

## If Script Fails

The script will tell you what's missing:
- PostgreSQL not installed → Install it
- PostgreSQL not running → Start it
- Database connection failed → Check `.env` file

---

**Run `./setup-admin-complete.sh` in the backend directory!** 🚀
