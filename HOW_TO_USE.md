# Lalbaba Guest House Management System — User Guide

This guide explains how to use the Lalbaba Guest House Management System. It is written in simple language so anyone can follow it, even without any technical background.

---

## What is this system?

This is an online system to manage rooms and bookings for Lalbaba Guest Houses. It allows:

- **Employees (Customers)** to request a room and track their bookings
- **Admins** to approve/reject booking requests and manage check-in/check-out
- **Super Admins** to manage everything — guest houses, rooms, users, and bookings

---

## Who can use this system?

There are three types of users:

| User Type | What they can do |
|-----------|-----------------|
| **Customer** | Sign up, request a room, track their own bookings |
| **Admin** | Approve/reject bookings, check guests in and out, manage rooms |
| **Super Admin** | Everything an Admin can do, plus manage guest houses, rooms, and users |

---

## Getting Started

### Step 1 — Open the App

Open the app in your web browser. You will see the **Login** screen.

---

### Step 2 — Create an Account (Customers only)

If you are a new employee and need to create your own account:

1. On the Login screen, click **"Create account"**
2. Fill in your details:
   - **Name** — Your full name
   - **Email** — Your work email address
   - **Department** — Your department (e.g. Engineering, HR)
   - **Password** — Choose a password (at least 6 characters)
   - **Confirm Password** — Type the same password again
   - **Phone** — Your phone number (optional)
3. Click **"Verify"** next to the email field — a 6-digit OTP will be sent to your email
4. Check your email, enter the OTP in the box, and click **"Verify OTP"**
5. Once your email is verified, click **"Create Account"**
6. You will be redirected to the Login screen — now log in with your email and password

> **Note:** New accounts created this way are automatically given **Customer** access. If you need Admin access, contact your Super Admin.

---

### Step 3 — Log In

1. Enter your **Email** and **Password**
2. Click **"Sign In"**
3. You will be taken to your Dashboard

---

### Forgot Your Password?

1. On the Login screen, click **"Forgot password?"**
2. Enter your email address and click **"Send OTP"**
3. Check your email for the OTP code
4. Enter the OTP and click **"Verify OTP"**
5. Enter your new password and confirm it
6. Click **"Reset Password"** — you can now log in with the new password

---

## For Customers

### Your Dashboard

After logging in, you will see your personal dashboard showing:

- **Available Rooms** — How many rooms are free right now
- **Occupied Rooms** — How many rooms are currently in use
- **Pending Requests** — Your booking requests waiting for approval
- **Guest Houses** — All available guest house properties
- **My Recent Bookings** — Your last 3 booking requests

---

### How to Request a Room

1. Click **"New Request"** in the left menu (or from the dashboard)
2. Select a **Guest House** from the dropdown
3. Select an **Available Room** from the dropdown (rooms load based on the guest house you chose)
4. Pick your **Check-in and Check-out dates** from the calendar
   - Dates that are already booked will appear greyed out — you cannot select them
   - You can book up to 3 months in advance
5. Set your **Check-in Time** (default is 2:00 PM) and **Check-out Time** (default is 11:00 AM)
6. Write the **Purpose of your visit** in the text box
7. Click **"Submit Request"**

Your request will be sent to the Admin for approval. You will receive a confirmation on screen.

> **Tip:** Your name, email, and department are filled in automatically from your profile.

---

### Track Your Bookings

Click **"My Bookings"** in the left menu to see all your booking requests.

At the top you will see:
- **Total Requests** — All bookings you have ever made
- **Booked** — Requests that have been approved
- **Active Stay** — You are currently checked in

Each booking card shows the room number, guest house, check-in/check-out dates, department, purpose, and current status.

**Booking Statuses explained:**

| Status | What it means |
|--------|--------------|
| **Pending Approval** | Your request has been submitted and is waiting for Admin to review |
| **Booked** | Admin approved your request — your room is confirmed |
| **Checked In** | You have been checked into the room |
| **Checked Out** | Your stay is complete |
| **Rejected** | Admin did not approve the request |
| **Cancelled** | The booking was cancelled |

---

### Check Room Availability

Click **"Room Availability"** in the left menu to see which rooms are free across all guest houses. Each guest house card shows:

- Total rooms
- How many are available (green)
- How many are occupied (red)
- Utilization percentage

---

## For Admins

Admins have everything Customers have, plus the ability to manage bookings and check in/out guests.

---

### Your Dashboard

Your dashboard shows:

- **Available Rooms** — Rooms free right now
- **Occupied Rooms** — Rooms currently in use
- **Today's Arrivals** — Guests arriving today
- **Pending Requests** — Booking requests waiting for your action
- **Today's Check-ins** — Guests you need to check in today (with Approve/Check-in buttons)

---

### Managing Bookings

Click **"All Bookings"** (Admins) or **"Booking Management"** (Super Admin) in the left menu.

You will see all booking requests. Use the:
- **Search box** — to find a booking by guest name, department, or purpose
- **Filter button** — to show only bookings with a specific status (e.g. only Pending)

**Actions you can take on each booking:**

| Booking Status | Actions Available |
|----------------|-------------------|
| Pending Approval | **Approve** or **Reject** |
| Booked | **Check In** or **Cancel** |
| Checked In | **Check Out** |

---

### Creating a Booking for a Guest

If a guest does not have an account, you can create the booking on their behalf:

1. Click **"New Booking"** (top right of the Bookings page) or **"Allocate Room"** (top right of the header)
2. **Step 1 — Accommodation & Dates:**
   - Select the Guest House
   - Select the Room
   - Pick check-in and check-out dates
   - Set check-in and check-out times
   - Click **"Continue"**
3. **Step 2 — Guest Information:**
   - Enter Guest Name, Email, Department
   - Select Occupancy Type (Single or Double)
   - Click **"Continue"**
4. **Step 3 — Purpose & Confirmation:**
   - Write the purpose of the visit
   - Review the booking summary
   - Click **"Submit Request"**

---

### Check In / Check Out

Click **"Check In/Out"** in the left menu. This page is split into two sections:

**Awaiting Check-in:**
- Shows all guests who have a confirmed booking (Booked status) and are arriving today
- Click **"Check In"** on a card to check the guest in

**Currently Staying:**
- Shows all guests currently checked in
- Click **"Check Out"** on a card to check the guest out

---

### Room Inventory

Click **"Room Inventory"** in the left menu to see all rooms.

- Use the **Guest House buttons** at the top to switch between properties
- Stats show Total Rooms, Available, Occupied, and Under Maintenance counts
- Rooms are grouped by floor
- Each room card shows the room number, type, status, capacity, and amenities (WiFi, TV, AC, Attached Bath)
- Click **"Allocate"** on any room to create a booking for that specific room

---

## For Super Admins

Super Admins can do everything Admins can, plus manage the full system.

---

### Managing Guest Houses

Click **"Guest Houses"** in the left menu.

**To add a new guest house:**
1. Click **"Add Guest House"**
2. Fill in the name, location, category, and other details
3. Save

**To edit a guest house:**
- Click the **Edit** button on the guest house card

**To delete a guest house:**
- Click the **Delete** button — a confirmation message will appear
- Confirm to permanently delete the guest house and all its rooms

> **Warning:** Deleting a guest house also deletes all rooms inside it. This cannot be undone.

---

### Managing Rooms

Click **"Room Inventory"** in the left menu.

**To add a room:**
1. Click **"Add Room"**
2. Fill in room number, floor, type, capacity, amenities, and guest house
3. Save

**To edit a room:**
- Click the **Edit** (pencil) icon on the room card

**To delete a room:**
- Click the **Delete** (trash) icon — confirm when prompted

---

### Managing Users

Click **"User Management"** in the left menu.

You will see a list of all users in the system with their name, email, department, role, and status.

Use the:
- **Search box** — to find a user by name, email, or department
- **Filter button** — to show only users with a specific role

**To add a new user:**
1. Click **"Add User"**
2. Fill in their details and set their role
3. Save — the user can then log in with their email and password

**To edit a user:**
- Click the three-dot menu (**⋮**) on the user's row/card → **"Edit User"**

**To change a user's role:**
- Click **⋮** → **"Change Role"**
- Select the new role from the dropdown (Customer, Admin, or Super Admin)
- Click **"Save Changes"**

**To deactivate a user:**
- Click **⋮** → **"Deactivate"**
- Confirm — the user will no longer be able to log in

---

## Navigating the App

### The Sidebar (Left Menu)

The sidebar on the left side shows all the pages you have access to based on your role.

- On **desktop/laptop** — the sidebar is always visible on the left
- On **mobile/tablet** — tap the **menu icon (☰)** at the top left to open the sidebar, and tap **✕** to close it

### Logging Out

In the sidebar, scroll to the bottom. You will see your name and a **"Sign Out"** button. Click it to log out safely.

---

## Tips for Mobile Users

- The app works on phones and tablets
- Tap the **☰ menu icon** at the top left to open the navigation menu
- All booking cards, forms, and tables are designed to work on small screens
- The calendar date picker works with touch — tap a date to select check-in, then tap again for check-out

---

## Quick Reference — What Can Each Role Do?

| Feature | Customer | Admin | Super Admin |
|---------|----------|-------|-------------|
| Log in / Sign up | Yes | Yes | Yes |
| View dashboard | Yes (personal) | Yes (full) | Yes (full) |
| Request a room | Yes | Yes | Yes |
| View own bookings | Yes | Yes | Yes |
| View all bookings | No | Yes | Yes |
| Approve / Reject bookings | No | Yes | Yes |
| Check In / Check Out guests | No | Yes | Yes |
| View room availability | Yes | Yes | Yes |
| Add / Edit rooms | No | No | Yes |
| Delete rooms | No | No | Yes |
| Add / Edit guest houses | No | No | Yes |
| Delete guest houses | No | No | Yes |
| Add / Edit users | No | No | Yes |
| Change user roles | No | No | Yes |
| Deactivate users | No | No | Yes |

---

## Need Help?

If you face any issues or cannot log in, contact your system administrator or the IT support team.
