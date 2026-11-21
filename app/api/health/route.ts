import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Minimal liveness probe — no database, no secrets, no internal details.
 * Safe for load balancers and uptime checks.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "alive",
  })
}
