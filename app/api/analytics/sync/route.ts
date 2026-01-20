import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { inngest } from "@/lib/inngest"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findFirst({
      where: { clerkId: userId },
      include: {
        integrations: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const { scheduleId } = body

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

      // Trigger Inngest event for analytics sync
      await inngest.send({
        name: "content/published",
        data: {
          scheduleId: schedule.id,
          externalId: schedule.externalId,
          platform: schedule.platform,
          accessToken: integration.accessToken,
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
          return inngest.send({
            name: "content/published",
            data: {
              scheduleId: schedule.id,
              externalId: schedule.externalId,
              platform: schedule.platform,
              accessToken: integration.accessToken,
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
