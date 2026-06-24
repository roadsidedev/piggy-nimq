# Piggy Deployment Guide

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Vercel     │────▶│   Railway API    │────▶│   Neon DB   │
│   (Client)   │     │   (Hono Server)  │     │  (Postgres) │
└─────────────┘     └──────────────────┘     └─────────────┘
```

| Service | Provider | Purpose |
|---------|----------|---------|
| **Frontend** | Vercel | React SPA, static assets, CDN |
| **Backend** | Railway | Hono API server, auto-migration |
| **Database** | Neon | Serverless Postgres |

---

## Prerequisites

1. **Neon account** — https://neon.tech
2. **Railway account** — https://railway.app
3. **Vercel account** — https://vercel.com
4. **GitHub repo** — push code to GitHub first

---

## Step 1: Create Neon Database

1. Go to https://neon.tech → Sign in
2. Click **Create Project**
   - Project name: `piggy`
   - Region: closest to your users
   - Leave "Compute auto-suspend" at default
3. Copy the **Connection string** (the one with `?sslmode=require`)
4. Save it — you'll need it for Railway

```
postgresql://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/piggy?sslmode=require
```

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to https://railway.app → Sign in with GitHub
2. Click **New Project** → **Deploy from GitHub Repo**
3. Select your `piggy` repo
4. Railway will auto-detect the monorepo — it may fail initially, that's fine

### 2.2 Configure Service

1. In the Railway dashboard, go to **Settings**
2. Set **Root Directory** to `.` (root of monorepo)
3. Set **Build Command** to:
   ```
   npm install --legacy-peer-deps && npm run build --workspace=@piggy/server
   ```
4. Set **Start Command** to:
   ```
   node server/dist/index.js
   ```

### 2.3 Add Environment Variables

Go to **Variables** tab and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | From Neon step 1 |
| `SESSION_SECRET` | `<random-hex-64>` | Generate with: `openssl rand -hex 32` |
| `SESSION_EXPIRY_HOURS` | `720` | 30 days |
| `CLIENT_ORIGIN` | `https://your-app.vercel.app` | Your Vercel URL |
| `PORT` | `3001` | Railway assigns this automatically |
| `NODE_ENV` | `production` | |

### 2.4 Generate SESSION_SECRET

Run locally:
```bash
openssl rand -hex 32
```

Or in Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.5 First Deploy

1. Railway will auto-deploy on push to `main`
2. The server will auto-migrate the database on startup
3. Check logs for:
   ```
   [DB] Running migrations...
   [DB] Migrations complete
   Piggy API server starting on port 3001
   ```

### 2.6 Verify

```bash
curl https://your-service.up.railway.app/health
# {"status":"ok","timestamp":"...","env":"production"}
```

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to https://vercel.com → Sign in with GitHub
2. Click **Add New** → **Project**
3. Import your `piggy` repo
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./client`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Output Directory**: `dist`

### 3.2 Add Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-service.up.railway.app` |
| `VITE_PAYMASTER_URL` | Your paymaster URL (or leave blank) |
| `VITE_PAYMASTER_API_KEY` | Your paymaster API key (or leave blank) |
| `VITE_POLYGON_RPC_URL` | `https://polygon-rpc.com` (or custom) |
| `VITE_POLYGON_AMOY_RPC_URL` | `https://rpc-amoy.polygon.technology` |
| `VITE_USE_TESTNET` | `true` |

### 3.3 Deploy

1. Click **Deploy**
2. Vercel will build and deploy
3. Note the deployment URL (e.g., `piggy-xxx.vercel.app`)

### 3.4 Update Railway CORS

Go back to Railway → Variables → Update `CLIENT_ORIGIN`:
```
https://piggy-xxx.vercel.app
```

Railway will auto-redeploy.

---

## Step 4: Generate Drizzle Migrations (First Time Only)

Before the first deployment, generate the migration files:

```bash
cd server
npm install --legacy-peer-deps
npx drizzle-kit generate
```

This creates SQL files in `server/drizzle/`. Commit them to git:

```bash
git add server/drizzle/
git commit -m "chore: add initial drizzle migrations"
git push
```

Railway will run these migrations automatically on startup.

---

## Step 5: Verify End-to-End

1. Open your Vercel URL
2. Connect wallet (Nimiq Pay)
3. Check browser console — should see no 401 errors
4. Create a goal → should persist (check Railway logs)
5. Refresh page → data should survive

---

## Auto-Migration on Deploy

The server runs `drizzle-kit migrate` on every startup:

```
server/src/index.ts
  └─ main()
       └─ runMigrations()  // drizzle-orm/node-postgres/migrator
            └─ reads server/drizzle/*.sql
            └─ applies pending migrations
```

**To add a new migration:**
1. Edit `server/src/db/schema.ts`
2. Run `npx drizzle-kit generate` in `/server`
3. Commit the new SQL file in `server/drizzle/`
4. Push to `main` — Railway auto-deploys and applies migration

---

## Environment Variables Reference

### Server (Railway)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Neon connection string |
| `SESSION_SECRET` | Yes | — | 64-char hex for session signing |
| `SESSION_EXPIRY_HOURS` | No | `720` | Session TTL (30 days) |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | CORS allowed origin |
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | `production` disables error details |

### Client (Vercel)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:3001` | Backend API URL |
| `VITE_PAYMASTER_URL` | No | `""` | Gas sponsorship endpoint |
| `VITE_PAYMASTER_API_KEY` | No | `""` | Paymaster API key |
| `VITE_POLYGON_RPC_URL` | No | `https://polygon-rpc.com` | Polygon mainnet RPC |
| `VITE_POLYGON_AMOY_RPC_URL` | No | `https://rpc-amoy.polygon.tech` | Amoy testnet RPC |
| `VITE_USE_TESTNET` | No | `true` | Use testnet by default |

---

## Troubleshooting

### Migration fails on startup
- Check `DATABASE_URL` is correct and includes `?sslmode=require`
- Check Neon database is not paused (free tier pauses after inactivity)
- Check Railway logs for the specific error

### CORS errors
- Ensure `CLIENT_ORIGIN` in Railway matches your Vercel URL exactly
- Must include `https://` and no trailing slash

### Build fails on Railway
- Check that `server/drizzle/` directory is committed to git
- Ensure `npm install --legacy-peer-deps` runs (some deps have peer conflicts)

### 401 on all API requests
- Check `SESSION_SECRET` is set and is at least 32 characters
- Check `VITE_API_URL` in Vercel matches your Railway service URL
