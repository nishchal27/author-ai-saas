import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { publishToLinkedIn } from "@/lib/linkedin"
import { publishToTwitter } from "@/lib/twitter"

/**
 * n8n webhook endpoint for automation
 * This endpoint can be called by n8n workflows to:
 * - Publish scheduled content
 * - Sync analytics
 * - Trigger content generation
 */

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, scheduleId, webhookSecret } = body

    // Verify webhook secret (in production, use a secure secret)
    if (webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (action === "publish_scheduled") {
      if (!scheduleId) {
        return NextResponse.json(
          { error: "Schedule ID is required" },
          { status: 400 }
        )
      }

      // Get schedule
      const schedule = await db.schedule.findFirst({
        where: {
          id: scheduleId,
          status: "pending",
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

      if (!schedule) {
        return NextResponse.json(
          { error: "Schedule not found" },
          { status: 404 }
        )
      }

      // Check if it's time to publish
      if (new Date(schedule.scheduledAt) > new Date()) {
        return NextResponse.json({
          success: false,
          message: "Not time to publish yet",
        })
      }

      // Get platform integration
      const integration = schedule.user.integrations.find(
        (i) => i.type === schedule.platform && i.isActive
      )

      if (!integration || !integration.accessToken) {
        return NextResponse.json(
          { error: "Integration not found" },
          { status: 404 }
        )
      }

      // Publish
      let externalId: string
      try {
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
          return NextResponse.json(
            { error: "Platform not supported" },
            { status: 400 }
          )
        }

        // Update schedule
        await db.schedule.update({
          where: { id: scheduleId },
          data: {
            status: "published",
            publishedAt: new Date(),
            externalId,
          },
        })

        // Update draft
        await db.contentDraft.update({
          where: { id: schedule.contentDraftId },
          data: { status: "published", publishedAt: new Date() },
        })

        return NextResponse.json({
          success: true,
          externalId,
          message: "Published successfully",
        })
      } catch (error: any) {
        await db.schedule.update({
          where: { id: scheduleId },
          data: {
            status: "failed",
            errorMessage: error.message,
          },
        })
        throw error
      }
    }

    if (action === "sync_analytics") {
      // Sync analytics for published posts
      const schedules = await db.schedule.findMany({
        where: {
          status: "published",
          externalId: { not: null },
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

      // This would fetch analytics from platforms and update the database
      // Implementation depends on platform APIs
      return NextResponse.json({
        success: true,
        synced: schedules.length,
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("n8n webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
