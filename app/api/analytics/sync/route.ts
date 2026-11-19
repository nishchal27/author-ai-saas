import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getDecryptedIntegration } from "@/lib/crypto"
import { ensureUserForClerkId } from "@/lib/users"
import { parseBody, analyticsSyncSchema } from "@/lib/validation"
import { inngest } from "@/lib/inngest"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const appUser = await ensureUserForClerkId(userId)
    const user = await db.user.findUnique({
      where: { id: appUser.id },
      include: { integrations: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = parseBody(raw, analyticsSyncSchema)
    if ("error" in parsed) return parsed.error
    const { scheduleId } = parsed.data

    if (scheduleId) {
      // Sync specific schedule
      const schedule = await db.schedule.findFirst({
        where: {
          id: scheduleId,
          userId: user.id,
          status: "published",
          externalId: { not: null },
        },
        include: {
          user: {
            include: {
              integrations: true,
            },
          },
        },
      })

      if (!schedule) {
        return NextResponse.json(
          { error: "Published schedule not found" },
          { status: 404 }
        )
      }

      const integration = schedule.user.integrations.find(
        (i) => i.type === schedule.platform && i.isActive
      )

      if (!integration || !integration.accessToken || !schedule.externalId) {
        return NextResponse.json(
          { error: "Integration not found" },
          { status: 404 }
        )
      }
      const decrypted = getDecryptedIntegration(integration)
      if (!decrypted.accessToken) {
        return NextResponse.json(
          { error: "Integration not found" },
          { status: 404 }
        )
      }

      // Trigger Inngest event for analytics sync
      await inngest.send({
        name: "content/published",
        data: {
          scheduleId: schedule.id,
          externalId: schedule.externalId,
          platform: schedule.platform,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Analytics sync triggered",
      })
    } else {
      // Sync all published schedules for user
      const schedules = await db.schedule.findMany({
        where: {
          userId: user.id,
          status: "published",
          externalId: { not: null },
        },
        include: {
          user: {
            include: {
              integrations: true,
            },
          },
        },
      })

      const events = schedules
        .map((schedule) => {
          const integration = schedule.user.integrations.find(
            (i) => i.type === schedule.platform && i.isActive
          )
          if (!integration || !integration.accessToken || !schedule.externalId) {
            return null
          }
          const decrypted = getDecryptedIntegration(integration)
          if (!decrypted.accessToken) return null
          return inngest.send({
            name: "content/published",
            data: {
              scheduleId: schedule.id,
              externalId: schedule.externalId,
              platform: schedule.platform,
            },
          })
        })
        .filter(Boolean)

      await Promise.all(events)

      return NextResponse.json({
        success: true,
        triggered: events.length,
        message: "Analytics sync triggered for all published content",
      })
    }
  } catch (error) {
    console.error("Error syncing analytics:", error)
    return NextResponse.json(
      { error: "Failed to sync analytics" },
      { status: 500 }
    )
  }
}
