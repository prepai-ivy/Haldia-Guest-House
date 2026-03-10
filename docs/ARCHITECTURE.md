# Architecture

## Overview

This is a **monolithic Next.js 15 App Router** application. The frontend (React) and backend (API routes) live in the same project. There is no separate backend server — everything runs through Next.js serverless route handlers.

```
Browser → Next.js (frontend pages)
              ↓
         Next.js API Routes (/api/*)
              ↓
         MongoDB (via Mongoose)
```

---

## Folder Structure

```
/
├── app/
│   ├── (auth)/                  # Auth pages (no sidebar layout)
│   │   ├── login/page.jsx
│   │   ├── signup/page.jsx
│   │   └── forgot-password/page.jsx
│   │
│   ├── (dashboard)/             # Protected pages (sidebar layout)
│   │   ├── dashboard/page.jsx
│   │   ├── availability/page.jsx
│   │   ├── check-in-out/page.jsx
│   │   ├── guest-houses/page.jsx
│   │   ├── guest-houses/[id]/edit/page.jsx
│   │   ├── guest-houses/new/page.jsx
│   │   ├── room-inventory/page.jsx
│   │   ├── room-inventory/new/page.jsx
│   │   ├── room-inventory/edit/[id]/page.jsx
│   │   ├── bookings/page.jsx
│   │   ├── bookings/new/page.jsx    # Admin booking form (3-step)
│   │   ├── new-request/page.jsx    # Customer booking form (1-page, wraps bookings/new)
│   │   ├── my-bookings/page.jsx    # Customer: own bookings only
│   │   ├── check-in-out/page.jsx
│   │   ├── users/page.jsx
│   │   ├── users/new/page.jsx
│   │   ├── users/edit/[id]/page.jsx
│   │   └── settings/page.jsx
│   │
│   └── api/                     # Serverless API route handlers
│       ├── auth/
│       │   ├── login/route.js
│       │   ├── signup/route.js
│       │   ├── signup/send-otp/route.js
│       │   ├── signup/verify-otp/route.js
│       │   ├── send-otp/route.js        # Reset password OTP
│       │   ├── verify-otp/route.js      # Verify reset OTP
│       │   ├── reset/send-otp/route.js  # Alt reset OTP endpoint
│       │   └── reset-password/route.js
│       ├── bookings/route.js
│       ├── bookings/[id]/route.js
│       ├── guest-houses/route.js
│       ├── guest-houses/[id]/route.js
│       ├── rooms/route.js
│       ├── rooms/[id]/route.js
│       ├── users/route.js
│       ├── users/[id]/route.js
│       ├── availability/route.js
│       ├── dashboard-stats/route.js
│       ├── guest-house-stats/route.js
│       └── rooms-stats/route.js
│
├── lib/                         # Backend utilities (server-side only)
│   ├── mongodb.js               # Mongoose connection with global caching
│   ├── auth.js                  # JWT verification helper
│   ├── api-utils.js             # Standardised response helpers
│   ├── mail.js                  # Nodemailer transporter
│   ├── emailTemplates.js        # HTML email templates
│   ├── password.js              # Random password generator
│   ├── apiClient.js             # Frontend fetch wrapper (client-side)
│   ├── models/                  # Mongoose models
│   │   ├── User.model.js
│   │   ├── Booking.model.js
│   │   ├── Room.model.js
│   │   ├── GuestHouse.model.js
│   │   ├── Otp.model.js
│   │   └── RoomMaintainence.modal.js
│   └── schemas/                 # Data transformer functions (not Zod)
│       ├── user.schema.js
│       ├── booking.schema.js
│       ├── guestHouse.schema.js
│       └── room.schema.js
│
├── services/                    # Frontend API client functions
│   ├── authApi.js
│   ├── bookingApi.js
│   ├── guestHouseApi.js
│   ├── guestHouseStatsApi.js
│   ├── dashboardApi.js
│   ├── dashboardStatsApi.js
│   ├── roomApi.js
│   ├── roomInventoryApi.js
│   ├── roomStatsApi.js
│   ├── availabilityApi.js
│   └── userApi.js
│
├── components/
│   ├── cards/                   # BookingCard, GuestHouseCard, StatsCard
│   ├── forms/                   # AddGuestHouseForm, AddRoomForm
│   ├── layout/                  # DashboardLayout, Sidebar, Header
│   └── ui/                      # shadcn/ui components
│
├── context/
│   └── AuthContext.jsx          # JWT auth state, user, isAdmin, isCustomer
│
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
│
├── utils/
│   ├── date.ts                  # formatDateIST()
│   └── roomStats.js             # calculateRoomStats()
│
├── middleware.js                # CORS headers for /api/* routes
├── tailwind.config.ts
└── tsconfig.json
```

---

## Authentication Flow

```
Login → POST /api/auth/login → JWT returned
JWT stored in localStorage/cookie (via AuthContext)
Every API call sends: Authorization: Bearer <token>
API routes call getAuthUser(request) to verify JWT
```

### OTP Flows

**Signup:**
```
POST /api/auth/signup/send-otp  → OTP emailed (bcrypt-hashed in DB, 5-min TTL)
POST /api/auth/signup/verify-otp
POST /api/auth/signup           → Create CUSTOMER account
```

**Forgot Password:**
```
POST /api/auth/send-otp         → OTP emailed
POST /api/auth/verify-otp
POST /api/auth/reset-password   → Update password (pre-save hook re-hashes)
```

---

## Booking Lifecycle

```
PENDING   → BOOKED (ADMIN approves)
PENDING   → REJECTED (ADMIN rejects)
BOOKED    → CHECKED_IN (ADMIN performs check-in, sets actualCheckIn)
CHECKED_IN → CHECKED_OUT (ADMIN performs check-out, sets actualCheckOut)
BOOKED/PENDING → CANCELLED
```

- CUSTOMER bookings start as `PENDING`
- ADMIN-created bookings start directly as `BOOKED`

---

## "Today's Data" Rule

All stats pages (dashboard, guest-houses, room-inventory, check-in-out) use the same occupancy definition to ensure consistency:

> A room is **occupied today** if:
> - `status = CHECKED_IN` (no date filter — physically present), **OR**
> - `status = BOOKED` AND `checkInDate < endOfTodayIST` AND `checkOutDate > startOfTodayIST`

All date boundaries are computed in **IST (UTC+5:30)** on both client and server:

```js
const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const nowIST = new Date(Date.now() + IST_OFFSET);
const startUTC = new Date(new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate()).getTime() - IST_OFFSET);
const endUTC   = new Date(new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate() + 1).getTime() - IST_OFFSET);
```

---

## Role-Based Access Summary

| Action | CUSTOMER | ADMIN | SUPER_ADMIN |
|--------|----------|-------|-------------|
| View own bookings | ✓ | ✓ | ✓ |
| View all bookings | — | ✓ | ✓ |
| Create booking (PENDING) | ✓ | — | — |
| Create booking (BOOKED) | — | ✓ | ✓ |
| Approve/Reject/Check-in/out | — | ✓ | ✓ |
| Manage guest houses & rooms | — | ✓ | ✓ |
| Delete guest houses/rooms/users | — | — | ✓ |
| Manage users | — | ✓ | ✓ |
