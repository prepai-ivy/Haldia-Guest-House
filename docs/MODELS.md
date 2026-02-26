# Database Models

All models use Mongoose with MongoDB. Stored in `lib/models/`.

---

## User

**File:** `lib/models/User.model.js`

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required |
| `email` | String | Required, unique, lowercased |
| `password` | String | Required, bcrypt-hashed on save |
| `role` | String | `SUPER_ADMIN` \| `ADMIN` \| `CUSTOMER` (default) |
| `phone` | String | Optional |
| `department` | String | Optional |
| `isActive` | Boolean | Default `true`. Soft-delete flag |
| `createdAt` | Date | Auto (timestamps) |
| `updatedAt` | Date | Auto (timestamps) |

**Hooks:**
- `pre('save')` — bcrypt-hashes password if modified
- `comparePassword(candidate)` — instance method for login verification

---

## GuestHouse

**File:** `lib/models/GuestHouse.model.js`

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required |
| `location` | String | Required |
| `category` | String | `STANDARD` \| `EXECUTIVE` \| `PREMIUM` |
| `description` | String | Optional |
| `isActive` | Boolean | Default `true`. Soft-delete flag |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

---

## Room

**File:** `lib/models/Room.model.js`

| Field | Type | Notes |
|-------|------|-------|
| `guestHouseId` | ObjectId → GuestHouse | Required |
| `roomNumber` | String/Number | Required |
| `type` | String | e.g. `AC`, `NON-AC` |
| `capacity` | Number | |
| `amenities` | [String] | |
| `status` | String | `ACTIVE` \| `INACTIVE` (soft-delete) |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Indexes:**
- Compound unique: `{ guestHouseId, roomNumber }` — room numbers are unique per guest house

---

## Booking

**File:** `lib/models/Booking.model.js`

| Field | Type | Notes |
|-------|------|-------|
| `guestHouseId` | ObjectId → GuestHouse | Required |
| `roomId` | ObjectId → Room | Required |
| `userId` | ObjectId → User | The guest |
| `checkInDate` | Date | Scheduled check-in |
| `checkOutDate` | Date | Scheduled check-out |
| `actualCheckIn` | Date | Set when CHECK_IN action is performed |
| `actualCheckOut` | Date | Set when CHECK_OUT action is performed |
| `purpose` | String | |
| `department` | String | |
| `status` | String | See status lifecycle below |
| `createdBy` | ObjectId → User | Who created the booking |
| `createdByRole` | String | Role at time of creation |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Status lifecycle:**
```
PENDING → BOOKED → CHECKED_IN → CHECKED_OUT
PENDING → REJECTED
BOOKED/PENDING → CANCELLED
```

**Indexes:**
- Compound: `{ roomId, checkInDate, checkOutDate, status }` — used for overlap queries
- Individual: `actualCheckIn`, `actualCheckOut`, `status`

**Hooks:**
- `pre('validate')` — throws if `checkOutDate <= checkInDate`

---

## Otp

**File:** `lib/models/Otp.model.js`

| Field | Type | Notes |
|-------|------|-------|
| `email` | String | Required |
| `otp` | String | bcrypt-hashed 6-digit OTP |
| `purpose` | String | `SIGNUP` \| `RESET_PASSWORD` |
| `attempts` | Number | Failed attempts counter (max 5) |
| `expiresAt` | Date | TTL index — MongoDB auto-deletes after expiry (5 min) |

---

## RoomMaintainence *(note: typo preserved from source)*

**File:** `lib/models/RoomMaintainence.modal.js`

| Field | Type | Notes |
|-------|------|-------|
| `roomId` | ObjectId → Room | Required |
| `startDate` | Date | |
| `endDate` | Date | |
| `reason` | String | |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

---

## Relationships

```
GuestHouse
  └── Room (many, via guestHouseId)
       └── Booking (many, via roomId)
            └── User (one, via userId)

User
  └── Booking (many, via userId or createdBy)

Otp
  └── (linked by email only, no ObjectId ref)
```
