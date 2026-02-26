# API Reference

All endpoints are under `/api/`. Every protected route requires:
```
Authorization: Bearer <jwt_token>
```

Responses follow a consistent shape:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

---

## Auth

### `POST /api/auth/login`
Login with email and password.

**Body:**
```json
{ "email": "user@example.com", "password": "secret" }
```
**Response:** `{ token, user: { _id, name, email, role, department } }`

---

### `POST /api/auth/signup`
Create a new CUSTOMER account (final step after OTP verification).

**Body:**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "secret", "phone": "9876543210", "department": "Engineering" }
```

---

### `POST /api/auth/signup/send-otp`
Send a 6-digit OTP to the email for signup verification. OTP is bcrypt-hashed and expires in 5 minutes.

**Body:** `{ "email": "john@example.com" }`

---

### `POST /api/auth/signup/verify-otp`
Verify the signup OTP. Max 5 attempts.

**Body:** `{ "email": "john@example.com", "otp": "123456" }`

---

### `POST /api/auth/send-otp`
Send a RESET_PASSWORD OTP (used by forgot-password flow).

**Body:** `{ "email": "user@example.com" }`

---

### `POST /api/auth/verify-otp`
Verify the RESET_PASSWORD OTP.

**Body:** `{ "email": "user@example.com", "otp": "123456" }`

---

### `POST /api/auth/reset-password`
Reset password after OTP verification. Password is re-hashed by the User model pre-save hook.

**Body:** `{ "email": "user@example.com", "otp": "123456", "newPassword": "newSecret" }`

---

## Guest Houses

### `GET /api/guest-houses`
List all active guest houses. Includes today's `available` and `occupied` room counts using IST day boundaries.

**Auth:** Required

**Response:** Array of guest houses, each with:
```json
{
  "_id": "...",
  "name": "IVY Guest House",
  "location": "Haldia",
  "category": "EXECUTIVE",
  "totalRooms": 10,
  "available": 7,
  "occupied": 3
}
```

---

### `POST /api/guest-houses`
Create a guest house. **ADMIN+ only.**

**Body:** `{ "name", "location", "category": "STANDARD|EXECUTIVE|PREMIUM", "description" }`

---

### `GET /api/guest-houses/[id]`
Get a single guest house by ID.

---

### `PUT /api/guest-houses/[id]`
Update a guest house. **ADMIN+ only.**

---

### `DELETE /api/guest-houses/[id]`
Soft-delete a guest house and deactivate all its rooms. **SUPER_ADMIN only.**

---

## Rooms

### `GET /api/rooms`
List rooms. Optionally filter by `?guestHouseId=...`.

**Auth:** Required

---

### `POST /api/rooms`
Create a room. **ADMIN+ only.**

**Body:** `{ "guestHouseId", "roomNumber", "type", "capacity", "amenities" }`

Note: `(guestHouseId, roomNumber)` must be unique.

---

### `GET /api/rooms/[id]`
Get a single room.

---

### `PATCH /api/rooms/[id]`
Update a room. **ADMIN+ only.**

---

### `DELETE /api/rooms/[id]`
Soft-delete a room (sets `status: INACTIVE`). **SUPER_ADMIN only.**

---

## Bookings

### `GET /api/bookings`
List bookings.

**Auth:** Required

**Query params:**
| Param | Description |
|-------|-------------|
| `status` | Comma-separated: `PENDING,BOOKED,CHECKED_IN` |
| `guestHouseId` | Filter by guest house |

**Role behaviour:**
- `CUSTOMER` → only own bookings
- `ADMIN/SUPER_ADMIN` → all bookings

---

### `POST /api/bookings`
Create a booking. Uses a Mongoose transaction.

**Auth:** Required

**Body (ADMIN creating for a guest):**
```json
{
  "guestHouseId": "...",
  "roomId": "...",
  "guestName": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "checkInDate": "2024-03-01T14:00:00.000Z",
  "checkOutDate": "2024-03-03T11:00:00.000Z",
  "purpose": "Official visit",
  "occupancyType": "SINGLE"
}
```

**Body (CUSTOMER booking for self):** Same but `guestName`/`email` are taken from the authenticated user.

**Behaviour:**
- If guest email doesn't exist → creates a CUSTOMER user, sends credentials email
- If guest exists → sends booking confirmation email
- CUSTOMER bookings → status `PENDING`
- ADMIN bookings → status `BOOKED`

---

### `PATCH /api/bookings/[id]`
Perform an action on a booking. **ADMIN+ only** (except CANCEL which customers can do on their PENDING bookings).

**Body:** `{ "status": "APPROVE" | "REJECT" | "CHECK_IN" | "CHECK_OUT" | "CANCEL" }`

**State machine:**
| Action | From | To | Side effect |
|--------|------|----|-------------|
| `APPROVE` | PENDING | BOOKED | — |
| `REJECT` | PENDING | REJECTED | — |
| `CHECK_IN` | BOOKED | CHECKED_IN | Sets `actualCheckIn = now` |
| `CHECK_OUT` | CHECKED_IN | CHECKED_OUT | Sets `actualCheckOut = now` |
| `CANCEL` | PENDING/BOOKED | CANCELLED | — |

---

## Users

### `GET /api/users`
List users. Optional `?role=CUSTOMER` filter. Passwords excluded. **ADMIN+ only.**

---

### `POST /api/users`
Create a user.

---

### `GET /api/users/[id]`
Get a user by ID.

---

### `PATCH /api/users/[id]`
Update a user (name, email, phone, department, role, isActive).

---

## Availability

### `GET /api/availability`
Get blocked date slots for a room over a date range.

**Query params:** `?roomId=...&from=YYYY-MM-DD&to=YYYY-MM-DD`

**Response:**
```json
{
  "roomId": "...",
  "blockedSlots": [
    { "from": "2024-03-01T14:00:00Z", "to": "2024-03-03T11:00:00Z", "status": "BOOKED" }
  ]
}
```

---

## Stats

### `GET /api/dashboard-stats`
Today's overview stats using IST day boundaries.

**Auth:** Required

**Response (ADMIN):**
```json
{
  "totalRooms": 20,
  "occupiedToday": 3,
  "availableToday": 17,
  "underMaintenance": 0,
  "todayActiveBookings": 3
}
```

**Response (CUSTOMER):** Only shows stats for own bookings.

---

### `GET /api/guest-house-stats`
Per-guest-house stats with today's occupancy.

**Auth:** Required

---

### `GET /api/rooms-stats`
Per-room stats for a specific guest house.

**Query params:** `?guestHouseId=...`

**Auth:** Required
