# Varabhi — Setup Guide

Authoritative environment template: [`.env.example`](./.env.example).  
Product/architecture docs: [`docs/README.md`](./docs/README.md).

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with real values. **Never commit `.env`.**

#### Required always

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma runtime Postgres URL (pooled OK) |
| `DIRECT_URL` | Migrations / introspection URL (`schema.prisma` `directUrl`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser key |
| `CLERK_SECRET_KEY` | Clerk server key |
| `NEXT_PUBLIC_APP_URL` | Public app URL (local or production) |

#### Required in production (`NODE_ENV=production`)

| Variable | Purpose |
|----------|---------|
| `ENCRYPTION_KEY` | Encrypt integration tokens (16+ characters). Fail-closed without it. |
| `CRON_SECRET` | Non-empty Bearer secret for `/api/cron/*` and production `/api/health/db` |

Empty `CRON_SECRET` is rejected — the app will **not** accept `Authorization: Bearer undefined`.

#### Optional — AI providers

At least one is required **only when using AI features** (brand summarize, AI ideas, AI drafts, strategy refinement):

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY` (+ optional `OPENROUTER_APP_TITLE`)

Optional model overrides: `AI_MODEL_*` (see `lib/ai/MODELS.md`).

The app boots and supports manual brand/pillar/idea/planner workflows without AI keys.

#### Optional — Inngest (scheduled publishing / background jobs)

| Variable | Purpose |
|----------|---------|
| `INNGEST_SIGNING_KEY` | Verifies Inngest → app requests (`/api/inngest`) |
| `INNGEST_EVENT_KEY` | Allows the app to send events to Inngest |

`/api/inngest` is excluded from Clerk session requirements so Inngest Cloud can reach it. **Signing verification remains enabled** via the Inngest SDK — do not treat this as an open unsigned webhook.

#### Development-only

| Variable | Purpose |
|----------|---------|
| `ALLOW_PLAINTEXT_TOKENS=1` | Allow integration tokens without `ENCRYPTION_KEY` in **non-production only** |
| `POPULATE_CLERK_ID` / `NEXT_PUBLIC_SEED_CLERK_ID` | Seed script user id |
| `POPULATE_CLEAN=1` | Wipe seedable rows before populate |

### 3. Database Setup

#### Option A: Local PostgreSQL

```sql
CREATE DATABASE varabhi;
```

Set both `DATABASE_URL` and `DIRECT_URL` (they may be identical locally).

#### Option B: Cloud Postgres (Supabase, Neon, etc.)

- `DATABASE_URL` → pooled connection (often port `6543`, with `pgbouncer=true` when required)
- `DIRECT_URL` → session/direct connection (often port `5432`) for migrations

### 4. Initialize Database

#### Development (preferred)

```bash
npx prisma generate
npx prisma migrate dev
# or: npm run db:migrate
```

`prisma migrate dev` applies pending migrations and keeps the migration history in sync.

#### Development (schema prototyping only)

```bash
npm run db:push
```

`db push` does **not** replace migrations for shared or production databases.

#### Production / staging (required)

```bash
npx prisma migrate deploy
# or: npm run db:migrate:deploy
```

**Do not use `prisma db push` in production.**

Then verify:

```bash
npx prisma migrate status
npx prisma validate
npm run db:verify
```

### 5. Clerk Authentication

1. Create an application at [clerk.com](https://clerk.com)
2. Copy publishable + secret keys into `.env`
3. Set sign-in / sign-up URLs to your app (e.g. `http://localhost:3000/sign-in`)
4. After sign-in URL: `/dashboard`

### 6. AI API keys (optional until you need AI)

Configure one or more providers listed in `.env.example`. Phase 5 AI quality/provider setup remains separate from this foundation.

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Health checks

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `GET /api/health` | Liveness (no DB) | None |
| `GET /api/health/db` | Readiness (`SELECT 1`) | Dev: open · Prod: `Authorization: Bearer <CRON_SECRET>` |
| `GET /api/cron/publish` | Manual Inngest trigger (legacy) | `Authorization: Bearer <CRON_SECRET>` |

## First Steps After Setup

1. Sign up with Clerk
2. Add your brand (onboarding)
3. Open Brand Studio and complete the profile
4. Add pillars / ideas manually (no AI required)
5. Use Content Planner for the week

## GitHub / social integrations (optional)

Requires `ENCRYPTION_KEY` (or `ALLOW_PLAINTEXT_TOKENS=1` in development only).  
Tokens are stored encrypted in production. Publishing remains out of MVP marketing promise for V2 beta.

## Production Deployment

### Recommended platforms

Vercel, Railway, or Render with a managed Postgres provider.

### Checklist (before / during deploy)

1. Set all **required always** + **required production** variables from `.env.example`
2. Set AI / Inngest keys only for features you enable
3. Run **`npx prisma migrate deploy`** against production `DIRECT_URL` / migration connection
4. Deploy the Next.js build (`npm run build` → `npm start`, or your host’s build command)
5. Confirm `GET /api/health` returns `{ ok: true }`
6. Confirm `GET /api/health/db` with Bearer cron secret returns `{ ok: true }`
7. Sync / verify the Inngest app points at `https://<your-domain>/api/inngest`

This guide does **not** claim the app is production-ready merely because env vars exist — complete Phase 5.1 journey fixes and a verified production build before a broad beta.

### Environment variables for production (summary)

Required: `DATABASE_URL`, `DIRECT_URL`, Clerk keys, `NEXT_PUBLIC_APP_URL`, `ENCRYPTION_KEY`, `CRON_SECRET`.  
Feature-gated: AI keys, `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`.

## Verify production database

If you see `PrismaClientInitializationError` / “Tenant or user not found”:

1. Confirm the provider project/branch still exists
2. Refresh `DATABASE_URL` and `DIRECT_URL`
3. Redeploy
4. Locally: `npm run db:verify` with the production URL

## Troubleshooting

### Database

- Check both `DATABASE_URL` and `DIRECT_URL`
- Prefer `migrate deploy` over `db push` on shared DBs
- Confirm network / IP allowlists for cloud Postgres

### Clerk

- Publishable key starts with `pk_`, secret with `sk_`
- Redirect URLs match the deployed host

### Cron / health unauthorized

- Ensure `CRON_SECRET` is non-empty
- Send header: `Authorization: Bearer <exact CRON_SECRET>`

### Inngest

- App URL must include `/api/inngest`
- Signing key must match the Inngest dashboard environment
- Unsigned or wrong-key requests are rejected by the Inngest serve handler

### Build

- Node 18+
- `npm install`, clear `.next` if needed
- Ensure required env vars are present for production builds that import `lib/db`

## npm scripts (database)

| Script | Use |
|--------|-----|
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev` (local) |
| `npm run db:migrate:deploy` | `prisma migrate deploy` (prod/staging) |
| `npm run db:validate` | `prisma validate` |
| `npm run db:push` | Schema push (local prototyping only) |
| `npm run db:verify` | Connectivity check script |
| `npm run db:studio` | Prisma Studio |
