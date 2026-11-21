import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import {
  isCronBearerAuthorized,
  unauthorizedCronResponse,
} from "@/lib/cron-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Database readiness check (SELECT 1).
 *
 * - Development: open (no secret) so local setup is easy.
 * - Production: requires Authorization: Bearer <CRON_SECRET>.
 *   Missing/empty CRON_SECRET fails closed.
 *
 * Never returns connection strings, hosts, or stack traces.
 */
function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true
  }
  return isCronBearerAuthorized(request.headers.get("authorization"))
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedCronResponse()
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
