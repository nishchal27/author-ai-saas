import { PrismaClient } from "@prisma/client"

/**
 * Single Prisma client instance. Uses DATABASE_URL from env.
 * If you see PrismaClientInitializationError / "Tenant or user not found", run GET /api/health/db
 * and follow SETUP.md "Verify production database" to fix DATABASE_URL.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

// Export as 'prisma' for backward compatibility
export const prisma = db
