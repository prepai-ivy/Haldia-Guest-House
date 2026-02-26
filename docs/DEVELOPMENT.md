# Development Guide

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas account (or local MongoDB)
- Gmail account with an App Password for email sending

---

## Environment Variables

Create a `.env.local` file in the project root. **Never commit this file.**

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-long-random-secret-key
JWT_EXPIRES_IN=7d

# Email (Gmail SMTP)
EMAIL_ID=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password

# CORS (optional — defaults to *)
CLIENT_URL=http://localhost:3000
```

### Getting a Gmail App Password

1. Enable 2-Factor Authentication on your Google account
2. Go to **Google Account → Security → App passwords**
3. Create a new app password for "Mail"
4. Use the generated 16-character password as `EMAIL_PASS`

---

## Installation

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Project Conventions

### API Routes

All API routes live in `app/api/*/route.js`. Each file exports named HTTP method handlers:

```js
export async function GET(request) { ... }
export async function POST(request) { ... }
export async function PATCH(request) { ... }
```

Every route starts with:
```js
await connectToDatabase();
const authUser = getAuthUser(request); // returns null if unauthenticated
```

Use response helpers from `lib/api-utils.js`:
```js
return successResponse(data);          // 200
return successResponse(data, 201);     // 201
return errorResponse("message", 400);  // 400
return unauthorizedResponse();         // 401
return forbiddenResponse();            // 403
return notFoundResponse();             // 404
```

### Frontend API Calls

Frontend pages fetch data through functions in `api/*.js`, which call `lib/apiClient.js`. The API client:
- Automatically attaches the JWT from localStorage
- Throws on non-OK responses

```js
import { fetchGuestHouses } from "@/api/guestHouseApi";
const houses = await fetchGuestHouses();
```

### IST Date Boundaries

When filtering "today's" data, always compute IST boundaries explicitly:

```js
const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const nowIST = new Date(Date.now() + IST_OFFSET);
const startUTC = new Date(
  new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate()).getTime() - IST_OFFSET
);
const endUTC = new Date(
  new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate() + 1).getTime() - IST_OFFSET
);
```

This applies on both the server (API routes) and client (page-level filtering).

---

## Adding a New API Route

1. Create `app/api/<resource>/route.js`
2. Connect to DB and verify auth at the top
3. Use `lib/models/` for DB operations
4. Return responses via `lib/api-utils.js` helpers
5. Add a corresponding fetch function in `api/<resource>Api.js`

Example skeleton:
```js
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-utils";
import MyModel from "@/lib/models/MyModel.model";

export async function GET(request) {
  try {
    await connectToDatabase();
    const authUser = getAuthUser(request);
    if (!authUser) return unauthorizedResponse();

    const data = await MyModel.find({}).lean();
    return successResponse(data);
  } catch (err) {
    console.error("[MyModel GET]", err);
    return errorResponse("Internal server error", 500);
  }
}
```

---

## Adding a New Page

1. Create `app/(dashboard)/<page-name>/page.jsx`
2. Wrap with `<DashboardLayout>` for sidebar/header
3. Use `useAuth()` from `context/AuthContext.jsx` to get `user`, `isAdmin`, `isCustomer`
4. Restrict by role if needed

---

## Known Gotchas

| Issue | Fix |
|-------|-----|
| `another code/` folder causes TypeScript errors | It's excluded in `tsconfig.json` — don't remove that exclusion |
| Mongoose `OverwriteModelError` in dev (hot reload) | Models use `mongoose.models.X \|\| mongoose.model("X", schema)` pattern |
| Hydration errors | Don't nest `<p>` inside `<p>` in JSX — use `<div>` or `<span>` |
| IST mismatch in stats | Always use the IST boundary helper above, not `setHours(0,0,0,0)` which uses browser timezone |
| Gmail "less secure" error | Use App Password, not account password |

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add all `.env.local` variables in Vercel's Environment Variables settings
4. Deploy

### Self-hosted

```bash
npm run build
npm start
```

Set environment variables in your server environment before starting.
