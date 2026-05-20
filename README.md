# Watch & Earn Platform - Complete Code Review & Enhanced Edition

## Overview

A production-ready Telegram Mini App (TMA) built with **Next.js 16**, **NestJS 11**, and **PostgreSQL** via **Supabase**. Users earn rewards by watching ads, completing sponsor tasks, claiming daily bonuses, and referring friends.

---

## Architecture Review

### Tech Stack
| Layer | Technology | Free Hosting |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) | Vercel |
| **Backend** | NestJS 11 (TypeScript) | Render |
| **Database** | PostgreSQL | Supabase |
| **Ads SDK** | Monetag | monetag.com |
| **Auth** | Telegram initData (HMAC-SHA256) | - |

### Directory Structure
```
mini-app/
├── backend/                  # NestJS API
│   ├── prisma/schema.prisma  # All DB models
│   └── src/modules/
│       ├── auth/             # Telegram login + JWT
│       ├── user/             # Profile, stats, leaderboard, daily bonus
│       ├── ad/               # Ad reward claiming
│       ├── withdrawal/       # Payout requests
│       ├── admin/            # Dashboard, user management
│       ├── tasks/            # Sponsor tasks CRUD
│       ├── transfer/         # P2P balance transfers
│       └── notification/     # In-app notifications
└── frontend/                 # Next.js TMA
    └── src/app/
        ├── page.tsx          # Home (ads, balance, daily bonus, VIP)
        ├── history/          # Transaction history
        ├── leaderboard/      # Top earners ranking
        ├── wallet/           # Withdrawals + P2P transfer
        ├── referrals/        # Referral invite system
        ├── profile/          # User settings + account
        ├── tasks/            # Sponsor tasks
        └── admin/            # Admin dashboard, users, withdrawals
```

---

## Security Improvements Made

1. **Telegram initData validation** - Now checks `auth_date` expiry (max 24h) and has proper error handling
2. **Self-referral prevention** - Backend validates referrer's Telegram ID != user's ID
3. **Referral code parsing** - Extracts `start_param` from Telegram initData and passes to backend
4. **CORS hardening** - Restricted to known Vercel/Render domains
5. **Input validation** - All DTOs use class-validator with `whitelist`, `transform`, `forbidNonWhitelisted`

---

## Features (All Pages)

### Frontend Pages (12 total)

| Page | Features |
|---|---|
| **Home (/)** | Balance card, daily bonus claim, watch ads, VIP tier badge, quick tasks, dark mode, 5-item bottom nav |
| **History (/history)** | Tabs (All/Earnings/Withdrawals/Bonuses), pagination, skeleton loaders, animated empty state |
| **Leaderboard (/leaderboard)** | Podium (gold/silver/bronze), top 20 list, user rank badge, staggered animations |
| **Wallet (/wallet)** | Balance display, withdrawal form with validation, "Send to Friends" card |
| **Transfer (/wallet/transfer)** | P2P balance transfer, user lookup, history, success animation |
| **Referrals (/referrals)** | Referral link, copy button, Telegram share, how-it-works steps |
| **Profile (/profile)** | Avatar, VIP badge, stats grid, referral code, dark mode toggle, logout |
| **Tasks (/tasks)** | Category tabs, status flow (GO→VERIFYING→CLAIM→DONE), progress bar, bonus card |
| **Admin (/admin)** | Stats dashboard, recent withdrawals, quick actions |
| **Admin Users (/admin/users)** | Search, paginated user list, ban/unban functionality |
| **Admin Withdrawals (/admin/withdrawals)** | Status filter tabs, approve/reject/paid actions, pagination |

### Backend Modules (8 total)

| Module | Endpoints |
|---|---|
| **Auth** | POST /auth/telegram |
| **User** | GET /user/profile, /user/stats, /user/leaderboard, /user/transactions, POST /user/daily-bonus |
| **Ad** | POST /ad/reward |
| **Withdrawal** | POST /withdrawal/request, GET /withdrawal/history |
| **Admin** | GET /admin/stats, /admin/users, /admin/withdrawals, POST /admin/withdrawal/:id/status, /admin/user/:id/ban |
| **Tasks** | GET /tasks, POST /tasks/:id/claim, GET /tasks/stats |
| **Transfer** | POST /transfer, GET /transfer/history, GET /transfer/balance-check/:username |
| **Notification** | GET /notifications, PATCH /notifications/:id/read, POST /notifications/read-all, GET /notifications/unread-count |

---

## Revenue & Publishing Enhancements

### Revenue Optimizations
1. **VIP Tier System** - Users with streaks get multipliers (10% per tier, up to 50% at Tier 5)
2. **Daily Bonus Streak** - Base $0.01 + $0.001 per streak day, multiplied by VIP tier
3. **P2P Transfers** - User-to-user transfers with zero fees encourage engagement
4. **Sponsor Tasks** - Earn from partner integrations (channels, mini-apps, surveys, offers)
5. **Referral Commission** - 10% on ALL referral earnings (ads + tasks + bonuses)

### Publishing Checklist
- [ ] Set `your_bot` to your actual bot username in `referrals/page.tsx`
- [ ] Update Monetag SDK zone ID (11017565) in `layout.tsx`
- [ ] Configure Supabase PostgreSQL and copy connection string
- [ ] Set `TELEGRAM_BOT_TOKEN` from @BotFather
- [ ] Generate strong `JWT_SECRET`
- [ ] Deploy backend to Render with Dockerfile
- [ ] Deploy frontend to Vercel with `NEXT_PUBLIC_API_URL`
- [ ] Add bot deep linking: `https://t.me/your_bot/appname?start=REFCODE`

---

## Deployment Guide

### 1. Database (Supabase)
1. Create project at [supabase.com](https://supabase.com)
2. Project Settings → Database → Connection string (Transaction mode, port 6543)
3. Set `DATABASE_URL` in backend environment

### 2. Backend (Render)
1. Create Web Service → Connect GitHub repo
2. Select **Docker** runtime
3. Environment variables:
   - `DATABASE_URL` (Supabase connection string)
   - `JWT_SECRET` (run: `openssl rand -base64 32`)
   - `TELEGRAM_BOT_TOKEN` (from @BotFather)
   - `PORT` = 3001

### 3. Frontend (Vercel)
1. New Project → Connect GitHub repo
2. Root Directory: `frontend`
3. Environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com/api`

### 4. Monetag Integration
1. Register at [publishers.monetag.com](https://publishers.monetag.com)
2. Create a Rewarded Ads zone
3. Copy SDK script tag → paste in `frontend/src/app/layout.tsx`
4. Update `data-zone` value in layout.tsx

---

## Anti-Fraud Measures

- **Backend-only reward calculation** - Frontend only triggers, backend validates
- **5-second cooldown** between ad rewards
- **Daily limit** - Max 20 ads per user per day
- **Auth date expiry** - initData expires after 24 hours
- **Self-referral prevention** - Cannot use own referral code
- **Atomic transactions** - All balance changes in Prisma transactions
- **Manual withdrawal approval** - Admin reviews all payout requests

---

## Local Development

```bash
# Start all services with Docker
docker-compose up

# Or run individually:
# Backend: cd backend && npm run start:dev
# Frontend: cd frontend && npm run dev

# Database migrations
cd backend && npx prisma db push
```

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:6543/db
JWT_SECRET=your_random_secret_here
TELEGRAM_BOT_TOKEN=123456:ABCdefGhIJKlmNoPQRsTUVwxYZ
PORT=3001
```

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```