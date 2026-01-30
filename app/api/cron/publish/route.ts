import { NextResponse } from "next/server"
import { inngest } from "@/lib/inngest"

/**
 * Legacy cron job endpoint - now triggers Inngest function
 * This endpoint is kept for backward compatibility
 * 
 * Vercel Cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/publish",
 *     "schedule": "*\/5 * * * *"
 *   }]
 * }
 * 
 * Note: Inngest handles scheduling automatically via cron functions.
 * This endpoint can trigger Inngest manually if needed.
 */
export async function GET(req: Request) {
  try {
    // Verify cron secret (set in environment)
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Trigger Inngest function manually (though it runs automatically via cron)
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
      { error: "Failed to trigger Inngest function" },
      { status: 500 }
    )
  }
}
