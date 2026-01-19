import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { publishToLinkedIn } from "@/lib/linkedin"
import { publishToTwitter } from "@/lib/twitter"

/**
 * Cron job endpoint for automated publishing
 * Call this from Vercel Cron Jobs or similar service
 * 
 * Vercel Cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/publish",
 *     "schedule": "*/15 * * * *"
 *   }]
 * }
 */
export async function GET(req: Request) {
  try {
    // Verify cron secret (set in environment)
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)

    // Find schedules ready to publish
    const schedules = await db.schedule.findMany({
      where: {
        status: "pending",
        scheduledAt: {
          lte: now,
          gte: fifteenMinutesAgo,
        },
      },
      include: {
        contentDraft: true,
        user: {
          include: {
            integrations: true,
          },
        },
      },
    })

    const results = []

    for (const schedule of schedules) {
      try {
        // Get platform integration
        const integration = schedule.user.integrations.find(
          (i) => i.type === schedule.platform && i.isActive
        )

        if (!integration || !integration.accessToken) {
          await db.schedule.update({
            where: { id: schedule.id },
            data: {
              status: "failed",
              errorMessage: `No active ${schedule.platform} integration found`,
            },
          })
          results.push({ scheduleId: schedule.id, status: "failed", reason: "No integration" })
          continue
        }

        // Publish based on platform
        let externalId: string
        if (schedule.platform === "linkedin") {
          const result = await publishToLinkedIn(
            integration.accessToken,
            schedule.contentDraft.content,
            schedule.contentDraft.visualUrl || undefined
          )
          externalId = result.id
        } else if (schedule.platform === "twitter") {
          const result = await publishToTwitter(
            integration.accessToken,
            schedule.contentDraft.content,
            schedule.contentDraft.visualUrl || undefined
          )
          externalId = result.id
        } else {
          await db.schedule.update({
            where: { id: schedule.id },
            data: {
              status: "failed",
              errorMessage: `Platform ${schedule.platform} not supported`,
            },
          })
          results.push({ scheduleId: schedule.id, status: "failed", reason: "Platform not supported" })
          continue
        }

        // Update schedule as published
        await db.schedule.update({
          where: { id: schedule.id },
          data: {
            status: "published",
            publishedAt: new Date(),
            externalId,
          },
        })

        // Update draft status
        await db.contentDraft.update({
          where: { id: schedule.contentDraftId },
          data: { status: "published", publishedAt: new Date() },
        })

        results.push({ scheduleId: schedule.id, status: "published", externalId })
      } catch (error: any) {
        await db.schedule.update({
          where: { id: schedule.id },
          data: {
            status: "failed",
            errorMessage: error.message,
          },
        })
        results.push({ scheduleId: schedule.id, status: "failed", error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      processed: schedules.length,
      results,
    })
  } catch (error) {
    console.error("Cron publish error:", error)
    return NextResponse.json(
      { error: "Failed to process scheduled content" },
      { status: 500 }
    )
  }
}
