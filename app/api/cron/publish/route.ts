import { NextResponse } from "next/server"
import { inngest } from "@/lib/inngest"
import {
  isCronBearerAuthorized,
  unauthorizedCronResponse,
} from "@/lib/cron-auth"

/**
 * Legacy cron job endpoint — triggers Inngest function manually.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 * Missing/empty CRON_SECRET fails closed (never matches Bearer undefined).
 *
 * Prefer Inngest's built-in cron for scheduled publishing in production.
 * This endpoint remains for ops / compatibility triggers.
 */
export async function GET(req: Request) {
  try {
    if (!isCronBearerAuthorized(req.headers.get("authorization"))) {
      return unauthorizedCronResponse()
    }

    await inngest.send({
      name: "inngest/function.invoked",
      data: {
        function_id: "check-scheduled-content",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Inngest function triggered (runs automatically via cron)",
    })
  } catch (error) {
    console.error("Cron publish error:", error)
    return NextResponse.json(
      { error: "Failed to trigger scheduled publish check" },
      { status: 500 }
    )
  }
}
