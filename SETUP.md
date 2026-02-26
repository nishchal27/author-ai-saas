# Founder OS - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/founderos"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Inngest (for workflow automation)
# Create account at https://inngest.com
# Functions auto-register when deployed
# No additional config needed for basic use

# Cron Secret (for legacy cron endpoint)
CRON_SECRET=your-secret-key-here

# Integration token encryption (optional but recommended for production)
# Use a random 32+ character string. If unset, tokens are stored in plaintext.
# ENCRYPTION_KEY=your-32-char-or-longer-secret

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

#### Option A: Local PostgreSQL

1. Install PostgreSQL if not already installed
2. Create a database:
```sql
CREATE DATABASE founderos;
```
3. Update `DATABASE_URL` in `.env`

#### Option B: Use a Cloud Database (Recommended for Production)

- **Vercel Postgres**: Free tier available
- **Supabase**: Free tier available
- **Neon**: Free tier available
- **Railway**: Free tier available

### 4. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 5. Set Up Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your publishable key and secret key
4. Add them to your `.env` file
5. Configure Clerk:
   - Set sign-in/sign-up URLs: `http://localhost:3000/sign-in` and `http://localhost:3000/sign-up`
   - Set after sign-in URL: `http://localhost:3000/dashboard`

### 6. Get API Keys

#### Anthropic (Claude API)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new API key
5. Add to `.env` as `ANTHROPIC_API_KEY`

#### OpenAI (DALL·E)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to API Keys
4. Create a new API key
5. Add to `.env` as `OPENAI_API_KEY`

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps After Setup

1. **Sign Up**: Create an account using Clerk
2. **Set Brand Voice**: Go to Settings and describe your brand voice
3. **Create Activity**: Add your first activity manually
4. **Extract Insight**: Click "Extract Insight" on an activity
5. **Generate Content**: Generate content from insights
6. **Review & Approve**: Review and edit content drafts

## GitHub Integration (Optional)

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Go to Settings in Founder OS
4. Enter your token and repository (format: `owner/repo`)
5. Click "Connect GitHub"
6. Use the GitHub sync feature to automatically track commits and PRs

## Production Deployment

### Recommended Platforms

1. **Vercel** (Recommended)
   - Automatic deployments from Git
   - Built-in environment variables
   - Free PostgreSQL addon available
   - Easy Clerk integration

2. **Railway**
   - Simple deployment
   - Built-in PostgreSQL
   - Environment variable management

3. **Render**
   - Free tier available
   - PostgreSQL addon
   - Easy setup

### Deployment Steps (Vercel)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)
- `ENCRYPTION_KEY` (optional; recommended for production to encrypt integration tokens)

## Verify production database (Neon / Postgres)

If you see **`PrismaClientInitializationError: FATAL: Tenant or user not found`** in production (e.g. on login or `/dashboard`), the app cannot reach the database. Fix it as follows:

1. **Check your database provider (e.g. Neon)**  
   - Ensure the project and branch in your connection string still exist.  
   - If you rotated the password or recreated the project, the old `DATABASE_URL` is invalid.

2. **Get a valid connection string**  
   - In Neon: Project → Connection details → copy the connection string (use the one that matches your branch).  
   - Ensure the username and database exist for that project.

3. **Update production env**  
   - In Vercel: Project → Settings → Environment Variables → set `DATABASE_URL` to the new value for Production (and Preview if needed).  
   - Redeploy so all runtimes use the new URL.

4. **Verify before or after**  
   - Run locally with the production URL to confirm it works:
   - **PowerShell:** `$env:DATABASE_URL="postgresql://..."; npm run db:verify`
   - **Bash:** `DATABASE_URL='postgresql://...' npm run db:verify`
   - If `db:verify` fails, the URL is wrong or the database is unreachable; fix the URL and try again.

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check if PostgreSQL is running (local)
- Verify database exists
- Check firewall settings (cloud databases)
- For **Neon**: use the steps in "Verify production database" above if you see "Tenant or user not found"

### Clerk Authentication Issues

- Verify keys are correct
- Check redirect URLs in Clerk dashboard
- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_`
- Ensure `CLERK_SECRET_KEY` starts with `sk_`

### API Key Issues

- Verify API keys are correct
- Check API key permissions
- Verify billing/credits are set up
- Check rate limits

### Build Errors

- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall
- Check Node.js version (should be 18+)
- Verify all environment variables are set

## Support

For issues or questions, check:
- README.md for architecture details
- Code comments for implementation details
- API route files for endpoint documentation
