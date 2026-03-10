# Haldia Guest House — Inventory Management System

Full-stack guest house booking and management system built with **Next.js 15 App Router** for **Lalbaba Engineering Group**. Handles guest bookings, room management, check-in/check-out operations, and OTP-based authentication — all in a single Next.js project with integrated API routes.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in the values — see docs/SETUP.md for details

# 3. Run development server
npm run dev
```

App runs at `http://localhost:3000`.

---

## Documentation

| File | Description |
|------|-------------|
| [docs/SETUP.md](docs/SETUP.md) | **Deployment guide — environment variables, Vercel, self-hosted** |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Project structure, data flow, auth & booking flows |
| [docs/API.md](docs/API.md) | All API endpoints with request/response shapes |
| [docs/MODELS.md](docs/MODELS.md) | MongoDB models, fields, and relationships |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Local dev setup, conventions, adding new routes/pages |

---

## User Roles

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Full access — delete guest houses, rooms, users |
| `ADMIN` | Create/edit guest houses, rooms; approve/reject/check-in/check-out bookings; manage users |
| `CUSTOMER` | Submit booking requests; view own bookings only |

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (`jsonwebtoken`) + bcrypt password hashing
- **Email**: Nodemailer via Gmail SMTP
- **UI**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Language**: JavaScript (API routes) + TypeScript (UI components)
