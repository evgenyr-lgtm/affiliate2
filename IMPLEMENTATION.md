# Implementation Guide

## Overview

This is a comprehensive Affiliate Portal system built with Next.js (frontend) and NestJS (backend). The system includes full authentication, referral tracking, commission management, and admin controls.

## Architecture

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (access + refresh tokens)
- **Security**: reCAPTCHA v3, Rate limiting, RBAC
- **Email**: Nodemailer with template system
- **Integration**: Zoho Desk API

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Forms**: React Hook Form + Zod validation
- **Security**: reCAPTCHA v3 integration

## Setup Instructions

### 1. Database Setup

```bash
cd backend
# Create .env file with DATABASE_URL
npx prisma migrate dev
npx prisma generate
```

### 2. Backend Setup

```bash
cd backend
npm install
# Configure .env file (see backend/.env.example)
npm run start:dev
```

Backend will run on http://localhost:4000

### 3. Frontend Setup

```bash
cd frontend
npm install
# Configure environment variables
npm run dev
```

Frontend will run on http://localhost:3000

### 4. Initial Configuration

After first run, you'll need to:

1. **Create System Admin User** (via database or seed script)
2. **Configure Settings** via admin panel:
   - Default Affiliate URL
   - reCAPTCHA keys
   - Manager notification emails
   - Email templates
3. **Set up Zoho Desk** credentials (optional)

## Key Features Implemented

### ✅ Authentication
- User registration with email verification
- Login with JWT tokens
- Password reset flow
- Role-based access control (RBAC)
- reCAPTCHA v3 protection

### ✅ Affiliate Management
- Registration with approval workflow
- Affiliate dashboard
- Referral link generation
- Profile management

### ✅ Referral System
- Manual referral entry
- Affiliate link tracking (cookie-based)
- Referral status management
- Payment tracking

### ✅ Admin Panel
- Affiliate management (approve/reject)
- Commission rate management
- Referral management
- System settings
- Email template management

### ✅ Email System
- Email verification
- Password reset emails
- Application status notifications
- Payment notifications
- Internal notifications

### ✅ Security
- JWT authentication
- reCAPTCHA v3
- Rate limiting
- Password strength validation
- RBAC guards

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new affiliate
- `POST /api/auth/login` - Login
- `GET /api/auth/verify-email` - Verify email
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password (authenticated)

### Affiliate
- `GET /api/affiliate/dashboard` - Get dashboard data
- `GET /api/affiliate/link` - Get affiliate link
- `PUT /api/affiliate/profile` - Update profile

### Referrals
- `POST /api/referrals/manual` - Create manual referral (authenticated)
- `POST /api/referrals/from-link` - Create referral from link (public)
- `GET /api/referrals` - Get referrals (filtered by role)
- `GET /api/referrals/:id` - Get referral by ID
- `PUT /api/referrals/:id` - Update referral (admin)
- `DELETE /api/referrals/:id` - Delete referral (admin)

### Admin
- `GET /api/admin/affiliates` - Get all affiliates
- `PUT /api/admin/affiliates/:id/status` - Update affiliate status
- `PUT /api/admin/affiliates/:id/commission` - Update commission

### Settings
- `GET /api/settings` - Get all settings
- `GET /api/settings/:key` - Get setting by key
- `PUT /api/settings/:key` - Update setting (system admin)

### Documents
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get document by ID
- `POST /api/documents` - Create document (admin)
- `DELETE /api/documents/:id` - Delete document (admin)

## Database Schema

### Core Models
- **User**: Authentication and user data
- **Affiliate**: Affiliate partner information
- **Referral**: Referral submissions
- **Document**: Brand materials
- **Setting**: System configuration
- **EmailTemplate**: Email templates
- **AuditLog**: Audit trail

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
RECAPTCHA_SECRET_KEY=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
ZOHO_DESK_API_URL=...
ZOHO_DESK_ORG_ID=...
ZOHO_DESK_API_KEY=...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
```

## Next Steps

### To Complete Implementation:

1. **Frontend Pages**:
   - Complete admin panel UI
   - Referral form with affiliate link tracking
   - Account settings page
   - Email template management UI
   - Export functionality (CSV, XLSX, PDF)

2. **Backend Enhancements**:
   - Complete Zoho Desk integration
   - File upload for documents and avatars
   - Export service (CSV, XLSX, PDF generation)
   - Enhanced commission calculation
   - Cookie-based affiliate tracking middleware

3. **Additional Features**:
   - Social sharing functionality
   - Advanced reporting
   - Email queue system (Bull/BullMQ)
   - Redis session management
   - Maintenance mode middleware

4. **Testing**:
   - Unit tests
   - Integration tests
   - E2E tests

5. **Deployment**:
   - Docker configuration
   - CI/CD pipeline
   - Production environment setup

## Notes

- The system uses soft deletes (deletedAt) for data retention
- Email templates support variable replacement
- All admin actions are logged in AuditLog
- reCAPTCHA can be disabled in development by not setting the secret key
- Zoho Desk integration is optional and will gracefully fail if not configured
