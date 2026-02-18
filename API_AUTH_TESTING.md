# API Authentication Testing Guide

All API routes now require a valid Supabase authentication token in the `Authorization` header.

## How to Get a Valid Auth Token

### Option 1: From the Browser Console (Easiest)

1. **Sign in to your app** at `/reflect` using the magic link
2. **Open Browser DevTools** (F12 or Cmd+Option+I)
3. **Run this in the console:**

```javascript
// Get the current session
const { data: { session } } = await supabase.auth.getSession()
console.log('Access Token:', session.access_token)
```

4. **Copy the access_token** - it looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM3NTQzNjk1...
```

### Option 2: From Supabase Dashboard

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click on a user
3. Click **"Generate Access Token"** (for testing only)

### Option 3: Programmatically

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Sign in with email/password or magic link
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Get the access token
const token = data.session?.access_token
```

---

## cURL Test Commands

### 1. Test WITHOUT Auth Token (Should FAIL with 401)

```bash
# Create Player - FAILS
curl -X POST http://localhost:3000/api/player/create \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

# Expected Response:
# {"error":"Missing or invalid authorization header"}
# Status: 401
```

```bash
# Get Player State - FAILS
curl -X GET http://localhost:3000/api/player/state \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

# Expected Response:
# {"error":"Missing or invalid authorization header"}
# Status: 401
```

```bash
# Earn Stardust - FAILS
curl -X POST http://localhost:3000/api/stardust/earn \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "reason": "Test"}' \
  -w "\nStatus: %{http_code}\n"

# Expected Response:
# {"error":"Missing or invalid authorization header"}
# Status: 401
```

```bash
# Spend Stardust - FAILS
curl -X POST http://localhost:3000/api/stardust/spend \
  -H "Content-Type: application/json" \
  -d '{"secret_code": "TEST_SECRET"}' \
  -w "\nStatus: %{http_code}\n"

# Expected Response:
# {"error":"Missing or invalid authorization header"}
# Status: 401
```

---

### 2. Test WITH Valid Auth Token (Should SUCCEED)

**IMPORTANT:** Replace `YOUR_ACCESS_TOKEN_HERE` with a real token from one of the methods above.

```bash
# Set your token as a variable (easier to reuse)
export AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM3NTQzNjk1..."
```

```bash
# Create Player - SUCCEEDS
curl -X POST http://localhost:3000/api/player/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -w "\nStatus: %{http_code}\n"

# Expected Response:
# {"player":{"id":"uuid-here","email":"user@example.com","stardust_balance":50,...},"message":"Player created successfully"}
# Status: 201 (or 200 if already exists)
```

```bash
# Get Player State - SUCCEEDS
curl -X GET http://localhost:3000/api/player/state \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -w "\nStatus: %{http_code}\n"

# Expected Response:
# {"player":{"email":"user@example.com","stardust_balance":50},"secrets":[...]}
# Status: 200
```

```bash
# Earn Stardust - SUCCEEDS
curl -X POST http://localhost:3000/api/stardust/earn \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"amount": 100, "reason": "Test reward"}' \
  -w "\nStatus: %{http_code}\n"

# Expected Response:
# {"new_balance":150,"transaction":{...}}
# Status: 200
```

```bash
# Spend Stardust - SUCCEEDS (if you have a valid secret_code)
curl -X POST http://localhost:3000/api/stardust/spend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"secret_code": "MYSTERY_001"}' \
  -w "\nStatus: %{http_code}\n"

# Expected Response (if secret exists and user has enough stardust):
# {"secret":{...},"new_balance":100}
# Status: 200
```

---

## What Changed?

### Before
- API routes accepted `player_id` in request body/query
- No authentication required
- Anyone could access/modify any player's data

### After
- All routes require `Authorization: Bearer <token>` header
- Uses `withAuth()` middleware to verify JWT token
- Extracts user email from token
- Looks up player by authenticated email
- **Users can only access their own data**

### Security Benefits
✅ No player_id spoofing - users can't impersonate others
✅ Token-based authentication via Supabase
✅ Automatic token expiration
✅ Centralized auth logic in middleware

---

## Testing Flow

1. **Start your dev server:** `npm run dev`
2. **Get a token** (use Option 1 above)
3. **Run FAIL tests** to confirm auth is required
4. **Run SUCCESS tests** with your token
5. **Verify** responses match expected output

## Troubleshooting

**401 Error:** Token is invalid or expired
- Get a fresh token
- Check Authorization header format: `Bearer <token>`

**404 Player not found:** Player doesn't exist yet
- Call `/api/player/create` first with auth token

**400 Bad Request:** Check request body format matches API requirements
