# Haldia Guest House — Next.js

Full-stack guest house booking and management system built with **Next.js 15 App Router**. Handles guest bookings, room management, check-in/check-out operations, and OTP-based authentication — all in a single Next.js project with integrated API routes.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in MONGODB_URI, JWT_SECRET, EMAIL_ID, EMAIL_PASS

# 3. Run development server
npm run dev
```

App runs at `http://localhost:3000`.

---

## Documentation

| File | Description |
|------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Project structure, data flow, folder layout |
| [docs/API.md](docs/API.md) | All API endpoints with request/response shapes |
| [docs/MODELS.md](docs/MODELS.md) | MongoDB models, fields, and relationships |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Dev setup, environment variables, deployment |

---

## User Roles

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Full access — delete guest houses, rooms, users |
| `ADMIN` | Create/edit guest houses, rooms; approve/reject/check-in/check-out bookings |
| `CUSTOMER` | Submit booking requests; view own bookings only |

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (`jsonwebtoken`) + bcrypt password hashing
- **Email**: Nodemailer via Gmail SMTP
- **UI**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Language**: JavaScript (API routes) + TypeScript (UI components)
