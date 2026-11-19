import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Lightweight Prisma connectivity check (SELECT 1).
 * - Available in development.
 * - In production, requires Authorization: Bearer <CRON_SECRET>.
 * Never returns connection strings, hosts, or stack traces.
 */
function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true
  }
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return false
  }
  const header = request.headers.get("authorization")
  return header === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  const started = Date.now()
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({
      ok: true,
      ms: Date.now() - started,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const isConnectionError =
      (err instanceof Error && err.name === "PrismaClientInitializationError") ||
      message.includes("FATAL") ||
      message.includes("Can't reach database server") ||
      message.includes("P1001") ||
      message.includes("P1017") ||
      message.includes("Tenant or user not found")

    if (isConnectionError) {
      console.error(
        "[health/db] Database connection failed. Check DATABASE_URL / DIRECT_URL (pooled vs session/direct) and network reachability."
      )
    } else {
      console.error("[health/db] Database check failed.")
    }

    return NextResponse.json(
      {
        ok: false,
        error: "database_unavailable",
        ms: Date.now() - started,
      },
      { status: 503 }
    )
  }
}
