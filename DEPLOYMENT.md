# Piggy Deployment Guide

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Vercel     │────▶│  Render (API)    │────▶│   Neon DB   │
│   (Client)   │     │  (Hono Server)   │     │  (Postgres) │
└─────────────┘     └──────────────────┘     └─────────────┘
                         │
                    ┌────┴────┐
                    │  Cron   │  (daily recurring reminders)
                    └─────────┘
```

| Service | Provider | Purpose |
|---------|----------|---------|
| **Frontend** | Vercel | React SPA, static assets, CDN |
| **Backend** | Render | Hono API server, auto-migration |
| **Cron** | Render | Daily recurring deposit reminders |
| **Database** | Neon | Serverless Postgres |

---

## Prerequisites

1. **Neon account** — https://neon.tech
2. **Render account** — https://render.com (connect GitHub)
3. **Vercel account** — https://vercel.com
4. **GitHub repo** — push code to GitHub first

---

## Step 1: Create Neon Database

1. Go to https://neon.tech → Sign in
2. Click **Create Project**
   - Project name: `piggy`
   - Region: closest to your users
3. Copy the **Connection string** (with `?sslmode=require`)
4. Save it — you'll need it for Render

```
postgresql://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/piggy?sslmode=require
```

---

## Step 2: Deploy Backend to Render

### Option A: Deploy via Blueprint (render.yaml)

The project includes a `render.yaml` that defines both services. When you connect your repo, Render auto-detects it:

1. Go to https://dashboard.render.com → **New** → **Blueprint**
2. Select your `piggy` repo
3. Render reads `render.yaml` and creates both services:
   - `piggy-api` (web server)
   - `piggy-cron` (cron job)
4. During setup, fill in the required env vars:
   - `DATABASE_URL` — from Neon
   - `CLIENT_ORIGIN` — your Vercel URL (set after Step 3)

### Option B: Deploy Manually

#### 2.1 Create Web Service

1. Go to https://dashboard.render.com → **New** → **Web Service**
2. Select your `piggy` repo
3. Configure:
   - **Name**: `piggy-api`
   - **Region**: Frankfurt (or closest)
   - **Branch**: `main`
   - **Root Directory**: `.` (root of monorepo)
   - **Runtime**: `Node`
   - **Build Command**:
     ```
     npm install --legacy-peer-deps && npm run build --workspace=@piggy/server
     ```
   - **Start Command**:
     ```
     node server/dist/index.js
     ```
   - **Plan**: Free

#### 2.2 Add Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | From Neon |
| `SESSION_SECRET` | `<random-64-hex>` | Generate via `openssl rand -hex 32` |
| `SESSION_EXPIRY_HOURS` | `720` | 30 days |
| `CLIENT_ORIGIN` | `https://your-app.vercel.app` | Set to your Vercel URL after Step 3 |
| `NODE_ENV` | `production` | |

Generate `SESSION_SECRET`:
```bash
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2.3 First Deploy

1. Click **Create Web Service**
2. Render builds and deploys automatically
3. Check logs for:
   ```
   [DB] Pushing schema to database...
   [DB] Schema push complete
   Piggy API server starting on port 10000
   ```

#### 2.4 Verify

```bash
curl https://piggy-api.onrender.com/health
# {"status":"ok","timestamp":"...","env":"production"}
```

---

## Step 3: Create Cron Job on Render

1. Go to https://dashboard.render.com → **New** → **Cron Job**
2. Select your `piggy` repo
3. Configure:
   - **Name**: `piggy-cron`
   - **Region**: same as web service
   - **Branch**: `main`
   - **Root Directory**: `.`
   - **Runtime**: `Node`
   - **Build Command**:
     ```
     npm install --legacy-peer-deps
     ```
   - **Start Command**:
     ```
     npx tsx server/src/cron.ts
     ```
   - **Schedule**: `0 9 * * *` (daily at 9 AM)
   - **Plan**: Free
4. Add env vars: `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Project

1. Go to https://vercel.com → **Add New** → **Project**
2. Import your `piggy` repo
3. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./client`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Output Directory**: `dist`

### 4.2 Add Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://piggy-api.onrender.com` |
| `VITE_PAYMASTER_URL` | (leave blank for now) |
| `VITE_PAYMASTER_API_KEY` | (leave blank) |
| `VITE_USE_TESTNET` | `true` |

### 4.3 Deploy

1. Click **Deploy**
2. Note the deployment URL (e.g., `piggy-xxx.vercel.app`)

### 4.4 Update Render CORS

Go back to Render → **piggy-api** → **Environment** → Update `CLIENT_ORIGIN`:
```
https://piggy-xxx.vercel.app
```

Render will auto-redeploy the web service.

---

## Step 5: Verify End-to-End

1. Open your Vercel URL
2. Connect wallet (Nimiq Pay)
3. Check browser console — no 401 errors
4. Create a goal → check Render logs for DB write
5. Refresh page — data should survive

---

## Auto-Migration on Deploy

The server runs `drizzle-kit push` on every startup — it syncs the schema to Neon without needing migration files:

```
server/src/index.ts
  └─ main()
       └─ runMigrations()
            └─ exec("npx drizzle-kit push")  // schema sync
```

**To update the schema:**
1. Edit `server/src/db/schema.ts`
2. Commit and push — Render auto-deploys
3. `drizzle-kit push` diffs the schema and applies changes

---

## Environment Variables Reference

### Server (Render)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Neon connection string |
| `SESSION_SECRET` | Yes | — | 64-char hex for session signing |
| `SESSION_EXPIRY_HOURS` | No | `720` | Session TTL (30 days) |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | CORS allowed origin |
| `PORT` | No | `10000` | Render assigns this |
| `NODE_ENV` | No | `development` | `production` hides error details |

### Client (Vercel)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:3001` | Backend API URL |
| `VITE_PAYMASTER_URL` | No | `""` | Gas sponsorship endpoint |
| `VITE_PAYMASTER_API_KEY` | No | `""` | Paymaster API key |
| `VITE_USE_TESTNET` | No | `true` | Use testnet by default |

---

## Troubleshooting

### Migration fails on startup
- Check `DATABASE_URL` includes `?sslmode=require`
- Neon free tier pauses after inactivity — wake it up in Neon dashboard
- `drizzle-kit push` is non-destructive; safe to re-run

### CORS errors
- Ensure `CLIENT_ORIGIN` in Render matches your Vercel URL exactly
- Must include `https://` and no trailing slash

### Build fails on Render
- Ensure `npm install --legacy-peer-deps` runs (peer dep conflicts)
- If using a monorepo, verify `rootDir: .` is set

### 401 on all API requests
- Check `SESSION_SECRET` is set and ≥ 32 characters
- Check `VITE_API_URL` in Vercel matches your Render service URL

### Free tier — Render spins down after inactivity
- The free Render web service sleeps after 15 minutes of inactivity
- First request after idle takes 30-60s to spin up
- Consider the **Starter** ($7/mo) plan for no sleep
