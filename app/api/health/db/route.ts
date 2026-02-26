import { db } from "@/lib/db"
import { NextResponse } from "next/server"

/**
 * Health check for database connectivity.
 * Returns 200 when the database is reachable, 503 when it is not.
 * Use for monitoring or debugging "Tenant or user not found" / PrismaClientInitializationError.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const isConnectionError =
      (err instanceof Error && err.name === "PrismaClientInitializationError") ||
      message.includes("FATAL") ||
      message.includes("Tenant or user not found")

    if (isConnectionError) {
      console.error(
        "[health/db] Database connection failed. Check DATABASE_URL (Neon: verify project/branch/user and connection string).",
        message
      )
    } else {
      console.error("[health/db] Database check failed:", message)
    }

    return NextResponse.json(
      { ok: false, error: "database_unavailable" },
      { status: 503 }
    )
  }
}
