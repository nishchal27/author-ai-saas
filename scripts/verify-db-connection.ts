/**
 * Verify database connectivity using DATABASE_URL.
 * Use this to confirm your production connection string works before or after updating Vercel env.
 *
 * Usage:
 *   npm run db:verify
 *   # Or with production URL (no quotes in PowerShell; use .env.production.local or export on Unix):
 *   $env:DATABASE_URL="postgresql://..."; npm run db:verify
 */

import { PrismaClient } from "@prisma/client"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("DATABASE_URL is not set.")
    process.exit(1)
  }

  // Redact password in logs
  const safeUrl = url.replace(/:[^:@]+@/, ":****@")
  console.log("Checking connection to:", safeUrl)

  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: ["error"],
  })

  try {
    await prisma.$queryRaw`SELECT 1`
    console.log("Database connection OK.")
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("Database connection failed:", message)
    if (message.includes("Tenant or user not found") || message.includes("FATAL")) {
      console.error("\nThis usually means:")
      console.error("  - The user or project in the URL does not exist (e.g. Neon project/branch deleted).")
      console.error("  - The password was rotated; generate a new connection string in your DB provider dashboard.")
      console.error("  - You are using a connection string from a different environment (e.g. staging vs production).")
      console.error("\nFix: In Neon (or your provider), verify the project/branch and copy the correct connection string, then set DATABASE_URL in Vercel and redeploy.")
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
