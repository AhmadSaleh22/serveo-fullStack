# Serveo Deployment Guide

Deploy Serveo for free using Neon (Database) + Render (API) + Vercel (Frontend).

---

## Prerequisites

- GitHub account with your code pushed
- Neon account (https://neon.tech)
- Render account (https://render.com)
- Vercel account (https://vercel.com)

---

## Step 1: Database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click **"Create Project"**
3. Settings:
   - Project name: `serveo`
   - Region: `aws-eu-central-1` (Frankfurt - closest to Egypt)
   - PostgreSQL version: 16
4. Click **"Create Project"**
5. Copy the **Connection String** (it looks like):
   ```
   postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/serveo?sslmode=require
   ```
6. Save this - you'll need it for Render

---

## Step 2: API (Render)

1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Settings:
   - **Name**: `serveo-api`
   - **Region**: `Frankfurt (EU Central)`
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     cd ../.. && npm install -g pnpm && pnpm install && pnpm --filter @repo/shared build && cd apps/api && pnpm build && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command**:
     ```bash
     node dist/main.js
     ```
   - **Instance Type**: `Free`

5. Add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your Neon connection string |
   | `JWT_SECRET` | (click "Generate" or use `openssl rand -base64 32`) |
   | `JWT_REFRESH_SECRET` | (click "Generate") |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `FRONTEND_URL` | `https://serveo.vercel.app` (update after Vercel deploy) |
   | `BASE_URL` | `https://serveo.vercel.app` |
   | `TWILIO_ACCOUNT_SID` | Your Twilio SID |
   | `TWILIO_AUTH_TOKEN` | Your Twilio token |
   | `TWILIO_PHONE_NUMBER` | Your Twilio number |

6. Click **"Create Web Service"**
7. Wait for deployment (takes 5-10 minutes)
8. Copy your API URL: `https://serveo-api.onrender.com`

---

## Step 3: Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web`
   - **Build Command**: (leave default or use)
     ```bash
     cd ../.. && npm install -g pnpm && pnpm install && pnpm --filter @repo/shared build && cd apps/web && pnpm build
     ```
   - **Output Directory**: `.next`

5. Add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://serveo-api.onrender.com` |
   | `NEXT_PUBLIC_BASE_URL` | `https://serveo.vercel.app` |

6. Click **"Deploy"**
7. Wait for deployment
8. Your app is live at: `https://serveo.vercel.app`

---

## Step 4: Update CORS

After Vercel deploys, update the `FRONTEND_URL` on Render:

1. Go to Render → serveo-api → Environment
2. Update `FRONTEND_URL` to your actual Vercel URL
3. Click "Save Changes" (auto-redeploys)

---

## Step 5: Run Database Migrations

The migrations run automatically during Render build. If you need to run manually:

```bash
# In Render Shell or locally with production DATABASE_URL
npx prisma migrate deploy
```

---

## Custom Domain (Optional)

### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your domain: `serveo.com`
3. Update DNS records as instructed

### Render (API)
1. Go to Service Settings → Custom Domain
2. Add: `api.serveo.com`
3. Update DNS records

Then update environment variables:
- Render: `FRONTEND_URL=https://serveo.com`
- Vercel: `NEXT_PUBLIC_API_URL=https://api.serveo.com`

---

## Troubleshooting

### API Cold Start (Render Free Tier)
- Free tier sleeps after 15 minutes of inactivity
- First request takes ~30 seconds to wake up
- This is normal for free tier

### Database Connection Issues
- Ensure `?sslmode=require` is in DATABASE_URL
- Check Neon dashboard for connection limits

### CORS Errors
- Verify `FRONTEND_URL` matches your Vercel domain exactly
- Include protocol: `https://serveo.vercel.app`

### Build Failures
- Check that all dependencies are in package.json
- Verify pnpm workspace structure is correct

---

## Monitoring

- **Render**: Dashboard shows logs, metrics, deploy history
- **Vercel**: Analytics, function logs, deploy previews
- **Neon**: Query stats, connection monitoring

---

## Estimated Costs

| Service | Free Tier Limits | Paid Upgrade |
|---------|------------------|--------------|
| Neon | 512MB storage, 1 project | $19/mo for Pro |
| Render | 750 hours/mo, sleeps | $7/mo for always-on |
| Vercel | 100GB bandwidth | $20/mo for Pro |

**Total Free Tier**: $0/month (suitable for MVP/testing)

---

## Quick Commands

```bash
# Local development
pnpm dev

# Build all packages
pnpm build

# Run migrations locally
cd apps/api && npx prisma migrate dev

# Generate Prisma client
cd apps/api && npx prisma generate
```
