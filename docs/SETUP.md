# Setup & Deployment Guide

This guide covers everything needed to deploy the Haldia Guest House app — from getting credentials to running in production.

---

## Environment Variables

Create a `.env.local` file in the project root. **Never commit this file.**

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-long-random-secret-key-minimum-32-chars
JWT_EXPIRES_IN=7d

# Email — Gmail SMTP
EMAIL_ID=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
```

---

## How to Get Each Variable

### `MONGODB_URI` — MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign in
2. Create a free cluster (M0 tier is free)
3. Under **Database Access** → Add a new database user with a password
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all) or your server's IP
5. Click **Connect** on your cluster → **Drivers** → copy the connection string
6. Replace `<password>` with your database user's password and `<dbname>` with your database name (e.g. `haldia-guest-house`)

Example:
```
MONGODB_URI=mongodb+srv://admin:mypassword@cluster0.abc123.mongodb.net/haldia-guest-house?retryWrites=true&w=majority
```

---

### `JWT_SECRET` — JSON Web Token Secret

This is a private key used to sign and verify authentication tokens. It must be:
- At least 32 characters long
- Random and secret — never share it

**Generate one using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Or use any random string generator. Example:
```
JWT_SECRET=a8f3c92b1d7e4f6a0b5c8d2e9f3a7b1c4d8e2f6a0b9c3d7e1f5a8b2c6d0e4f8
```

---

### `JWT_EXPIRES_IN` — Token Expiry

How long login sessions last before requiring re-login.

| Value | Duration |
|-------|----------|
| `1d` | 1 day |
| `7d` | 7 days (recommended) |
| `30d` | 30 days |

```
JWT_EXPIRES_IN=7d
```

---

### `EMAIL_ID` and `EMAIL_PASS` — Gmail SMTP

The app sends OTP emails using a Gmail account via SMTP (port 465, SSL).

**`EMAIL_ID`** — your Gmail address:
```
EMAIL_ID=youremail@gmail.com
```

**`EMAIL_PASS`** — you **must** use a Gmail App Password, not your regular account password:

#### How to get a Gmail App Password:
1. Enable **2-Factor Authentication** on your Google account at [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Go to **Google Account → Security → 2-Step Verification → App passwords** (scroll to the bottom)
3. Select app: **Mail**, device: **Other** → type a name like `Guest House`
4. Click **Generate** — copy the 16-character password shown
5. Use that as `EMAIL_PASS` (no spaces):

```
EMAIL_PASS=abcdabcdabcdabcd
```

> Regular account passwords will not work. Gmail requires App Passwords for SMTP access.

---

## Deployment

### Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps — zero config required.

1. Push your code to a GitHub repository
2. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub
3. Click **New Project** → import your repository
4. Under **Environment Variables**, add all the variables from your `.env.local`
5. Click **Deploy**

Vercel automatically:
- Runs `npm run build`
- Deploys API routes as serverless functions
- Gives you a `https://` URL

**After first deploy:** Set `CLIENT_URL` to your Vercel domain (e.g. `https://haldia-guest-house.vercel.app`) and redeploy.

---

### Option 2: Self-Hosted (VPS / On-premise Server)

Requirements: Node.js 18+, npm 9+

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd Haldia-Guest-House-nextjs

# 2. Install dependencies
npm install

# 3. Create .env.local with your production values
nano .env.local

# 4. Build for production
npm run build

# 5. Start the server
npm start
```

The app runs on port `3000` by default. To use a different port:
```bash
PORT=8080 npm start
```

#### Running with PM2 (process manager — keeps app alive after restart)

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start npm --name "guest-house" -- start

# Save to auto-start on reboot
pm2 save
pm2 startup
```

#### Nginx Reverse Proxy (if using a domain)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## First-Time Setup After Deploy

After the app is running for the first time, you need to create the initial `SUPER_ADMIN` user. There is no signup flow for admins — use a database tool (MongoDB Compass or Atlas UI) to manually insert a user:

1. Open your MongoDB Atlas cluster → **Browse Collections** → your database
2. Open the `users` collection → **Insert Document**:

```json
{
  "name": "Admin Name",
  "email": "admin@yourdomain.com",
  "password": "<bcrypt-hash-of-your-password>",
  "role": "SUPER_ADMIN",
  "isActive": true
}
```

To generate a bcrypt hash for your password, run:
```bash
node -e "const b=require('bcryptjs'); b.hash('yourpassword', 10).then(console.log)"
```

> Alternatively, sign up normally through the app (which creates a CUSTOMER account), then update the `role` field to `SUPER_ADMIN` directly in the database.

---

## Environment Variable Checklist

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Min 32 chars, random |
| `JWT_EXPIRES_IN` | No | Defaults to `7d` |
| `EMAIL_ID` | Yes | Gmail address |
| `EMAIL_PASS` | Yes | Gmail App Password (16 chars) |
