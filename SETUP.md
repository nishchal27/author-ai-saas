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

## Staging deployment (Vercel + Supabase)

Use a **separate** staging stack from production: separate Vercel project (or Preview env), separate Supabase project/branch, and a **separate Clerk application** (or isolated staging instance). Do not reuse production secrets.

### Vercel project settings

| Setting | Value |
|---------|--------|
| Framework | Next.js (auto-detected) |
| Node.js | **≥ 18.17** (matches `package.json` `engines`) |
| Install command | `npm install` (default) |
| Build command | `npm run build` → runs `prisma generate && next build` |
| Output | Next.js default (no custom `output: export`) |
| Root directory | repository root |
| `vercel.json` | **Not present** — none required for Next.js. **No Vercel Cron jobs are defined in-repo.** |

Do **not** invent a Vercel Cron schedule. Scheduled publishing, when enabled, is owned by **Inngest** (`*/5 * * * *` inside `lib/inngest.ts` for `check-scheduled-content`). The HTTP route `GET /api/cron/publish` is a **manual ops trigger** protected by `Authorization: Bearer <CRON_SECRET>`; it is not wired to a Vercel cron config in this repository.

### Required vs optional environment variables (staging)

Set these in the Vercel project → Settings → Environment Variables for the **Staging / Preview / Production** target you use for staging. Mark secrets as Sensitive.

**Required for staging runtime**

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Supabase **pooled** URL (often port `6543`) with `pgbouncer=true` when required |
| `DIRECT_URL` | Supabase **session/direct** URL (often port `5432`) for migrations |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Staging Clerk app publishable key |
| `CLERK_SECRET_KEY` | Staging Clerk app secret key |
| `NEXT_PUBLIC_APP_URL` | Staging URL, e.g. `https://varabhi-staging.vercel.app` |
| `ENCRYPTION_KEY` | ≥ 16 characters; required at runtime (`NODE_ENV=production`) |
| `CRON_SECRET` | Non-empty; Bearer secret for `/api/cron/*` and prod-mode `/api/health/db` |

**Optional (feature-gated — omit for a manual-workflow-only staging)**

| Variable | Notes |
|----------|--------|
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `OPENROUTER_API_KEY` | AI features only; **not** required for build or manual brand → ideas → drafts → planner |
| `OPENROUTER_APP_TITLE` / `AI_MODEL_*` | Optional model overrides |
| `INNGEST_SIGNING_KEY` / `INNGEST_EVENT_KEY` | Only if enabling Inngest background jobs |

**Never set in staging/production**

| Variable | Notes |
|----------|--------|
| `ALLOW_PLAINTEXT_TOKENS` | Dev-only plaintext token storage |
| `POPULATE_*` | Seed scripts only |

Build vs runtime: core DB + Clerk vars must be available to the Vercel **build**. `ENCRYPTION_KEY` / `CRON_SECRET` are enforced at **runtime** (see `lib/env.ts`); still set them before serving traffic.

### Supabase connection configuration

1. Create a staging Supabase project (or isolated branch).
2. **Settings → Database → Connection string**:
   - **Transaction pooler** → `DATABASE_URL` (Prisma Client at runtime). Prefer including `pgbouncer=true` when using the pooler.
   - **Session / direct** → `DIRECT_URL` (Prisma migrate / introspection). Prefer IPv4-reachable session pooler if `db.<ref>.supabase.co` is IPv6-only from your network.
3. Confirm both URLs point at the **same** staging database.
4. Run migrations with the staging `DIRECT_URL` (see below) **before** relying on the app against that DB.

### Clerk staging configuration

1. Create a **separate** Clerk application for staging (do not share production keys).
2. Copy staging `pk_` / `sk_` into Vercel env.
3. Clerk Dashboard → URLs:
   - Application / home: staging `NEXT_PUBLIC_APP_URL`
   - Sign-in / Sign-up: `https://<staging-host>/sign-in` and `/sign-up`
   - After sign-in / sign-up: `/dashboard`
4. Add the staging host to allowed origins / redirect allowlists.
5. Prefer Clerk **development** instance for early staging, or a dedicated production-type staging app if you need prod-like auth behavior — keep it isolated from real users.

### Migration procedure (staging)

**Forward (required after schema changes, and once on first staging DB):**

```bash
# From a trusted machine or CI, with staging DIRECT_URL (+ DATABASE_URL) in env:
npx prisma migrate deploy
# or: npm run db:migrate:deploy
```

Then verify:

```bash
npx prisma migrate status
npx prisma validate
```

**Do not** use `prisma db push` or `migrate reset` against staging/shared data.

**Rollback considerations**

- Prisma does not auto-generate down migrations. Rollback = restore a Supabase backup / point-in-time recovery, **or** apply a carefully reviewed new forward migration that reverses the change.
- Keep migration history in git; never rewrite already-applied migration files.
- Order of operations for risky deploys: backup → `migrate deploy` → deploy app revision that expects the new schema (or deploy app first only when migrations are backward-compatible).

### Inngest (optional on staging)

- App **boots and serves** the core product without Inngest keys.
- `/api/inngest` is always present and Clerk-public; without `INNGEST_SIGNING_KEY`, do not expose it as a trusted automation endpoint in Inngest Cloud.
- If you enable Inngest later: create a staging Inngest app, set signing/event keys, sync to `https://<staging-host>/api/inngest`, and ensure the Vercel plan allows `maxDuration` ≥ 60s for that route.

### Post-deploy smoke checks

1. `GET https://<staging-host>/api/health` → `{ "ok": true, "status": "alive" }` (no auth)
2. `GET https://<staging-host>/api/health/db` with `Authorization: Bearer <CRON_SECRET>` → `{ "ok": true, ... }`
3. `GET https://<staging-host>/api/cron/publish` **without** Bearer → `401`
4. Signed-out `/dashboard` → redirect to Clerk sign-in
5. Sign in → complete manual brand → pillars → ideas → draft → planner (no AI keys required)

### Exact manual steps (checklist)

**Supabase**

1. Create staging project  
2. Copy pooler URL → `DATABASE_URL`  
3. Copy session/direct URL → `DIRECT_URL`  
4. From local/CI with those vars: `npx prisma migrate deploy`  
5. Confirm `migrate status` is up to date  

**Clerk**

1. Create staging Clerk app  
2. Configure sign-in/up URLs and after-auth `/dashboard` for the staging host  
3. Copy keys into Vercel  

**Vercel**

1. Import the Git repository; Framework = Next.js  
2. Set Node ≥ 18.17  
3. Build command = `npm run build` (do not remove `prisma generate`)  
4. Add all **required** env vars (and optional AI/Inngest only if testing those features)  
5. Deploy  
6. Set `NEXT_PUBLIC_APP_URL` to the deployed URL if it changed; redeploy if needed  
7. Run smoke checks above  

**Do not** add a Vercel Cron entry unless you intentionally wire one to `/api/cron/publish` with the Bearer secret — that schedule is **not** defined in this repo today.

---

## Production Deployment

### Recommended platforms

Vercel, Railway, or Render with a managed Postgres provider. Prefer the same checklist as staging, with isolated production credentials.

### Checklist (before / during deploy)

1. Set all **required always** + **required production** variables from `.env.example`
2. Set AI / Inngest keys only for features you enable
3. Run **`npx prisma migrate deploy`** against production `DIRECT_URL` / migration connection
4. Deploy the Next.js build (`npm run build` → `npm start`, or your host’s build command)
5. Confirm `GET /api/health` returns `{ ok: true }`
6. Confirm `GET /api/health/db` with Bearer cron secret returns `{ ok: true }`
7. Sync / verify the Inngest app points at `https://<your-domain>/api/inngest` **only if** Inngest is enabled

This guide does **not** claim the app is production-ready merely because env vars exist — complete live browser verification on staging before a broad beta.

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

- Node 18+ (Clerk requires ≥ 18.17)
- `npm install`, clear `.next` if needed
- Core vars (`DATABASE_URL`, `DIRECT_URL`, Clerk keys) must be present for `npm run build`
- `ENCRYPTION_KEY` and `CRON_SECRET` are enforced at **production runtime**, not during the Next.js build collect phase (so local/CI builds can succeed before deploy secrets are injected)
- On Vercel: set production env vars in the project dashboard; build command should remain `npm run build` (runs `prisma generate && next build`)
- After deploy, run **`npx prisma migrate deploy`** against the production migration URL (`DIRECT_URL`) before serving traffic
- `/api/inngest` sets `maxDuration = 60` for serverless compatibility; ensure your Vercel plan allows ≥ 60s functions if using Inngest there

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
