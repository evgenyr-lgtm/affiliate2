# Affiliate Portal - Access Financial

A comprehensive affiliate management system with referral tracking, commission management, and full admin controls.

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, React Query, Zod
- **Backend**: NestJS, PostgreSQL, Prisma ORM, Redis
- **Authentication**: JWT (access + refresh tokens)
- **Security**: reCAPTCHA v3, Rate limiting, RBAC
- **Integrations**: Zoho Desk, Email (SMTP/Transactional)

## Project Structure

```
.
├── frontend/          # Next.js application
├── backend/           # NestJS application
└── shared/            # Shared types and utilities
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- npm or yarn

### Installation

```bash
npm run install:all
```

### Environment Setup

Create `.env` files in both `frontend/` and `backend/` directories. See `.env.example` files for required variables.

### Database Setup

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### Running Development Servers

```bash
npm run dev
```

This will start both frontend (http://localhost:3000) and backend (http://localhost:4000) concurrently.

## Features

- ✅ User registration & approval workflow
- ✅ Referral tracking (links + manual entry)
- ✅ Commission management (percent/fixed)
- ✅ Admin panel (marketing & sales)
- ✅ Zoho Desk integration
- ✅ Automated email notifications
- ✅ Exportable reports (CSV, XLSX, PDF)
- ✅ Brand materials management
- ✅ GDPR compliant with audit logs

## User Roles

- **Affiliate Partner**: View dashboard, generate links, submit referrals
- **Marketing Admin**: Approve affiliates, set commission terms, manage content
- **Sales Admin**: Review referrals, negotiate commissions, update status
- **System Admin**: Global settings, maintenance mode, email routing
