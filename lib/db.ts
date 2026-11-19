import { PrismaClient } from "@prisma/client"
import { assertRequiredEnv } from "@/lib/env"

/**
 * Single Prisma client instance for the Next.js runtime.
 *
 * Supabase:
 * - DATABASE_URL should be the transaction pooler (:6543) with pgbouncer=true
 * - DIRECT_URL should be session pooler (:5432) or a reachable direct host (wired via schema directUrl)
 *
 * Never log connection strings or credentials.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate required env once per process (names only; never logs values).
try {
  assertRequiredEnv()
} catch (error) {
  if (process.env.NODE_ENV === "production") {
    throw error
  }
  console.warn(
    "[db]",
    error instanceof Error ? error.message : "Environment configuration incomplete"
  )
}

function withConnectionGuards(url: string | undefined): string | undefined {
  if (!url) return url
  try {
    const parsed = new URL(url)
    // Fail fast instead of hanging on unreachable hosts (e.g. IPv6-only direct).
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "10")
    }
    // Bound how long we wait for a pool connection under load.
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "10")
    }
    // Transaction pooler: keep Prisma's connection footprint small.
    const isPooler =
      parsed.hostname.includes("pooler") ||
      parsed.port === "6543" ||
      parsed.searchParams.get("pgbouncer") === "true"
    if (isPooler && !parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "1")
    }
    return parsed.toString()
  } catch {
    return url
  }
}

function createPrismaClient() {
  const url = withConnectionGuards(process.env.DATABASE_URL)
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    ...(url
      ? {
          datasources: {
            db: { url },
          },
        }
      : {}),
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

// Export as 'prisma' for backward compatibility
export const prisma = db
