import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getLinkedInAnalytics } from "@/lib/linkedin"
import { getTwitterAnalytics } from "@/lib/twitter"
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

    // Get schedule
    const schedule = await db.schedule.findFirst({
      where: {
        id: scheduleId || undefined,
        userId: user.id,
        status: "published",
        externalId: { not: null },
      },
      include: {
        contentDraft: true,
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: "Published schedule not found" },
        { status: 404 }
      )
    }

    // Get platform integration
    const integration = user.integrations.find(
      (i) => i.type === schedule.platform && i.isActive
    )

    if (!integration || !integration.accessToken) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      )
    }

    // Fetch analytics
    let analytics: {
      views: number
      likes: number
      comments: number
      shares: number
    }

    try {
      if (schedule.platform === "linkedin") {
        analytics = await getLinkedInAnalytics(
          integration.accessToken,
          schedule.externalId!
        )
      } else if (schedule.platform === "twitter") {
        analytics = await getTwitterAnalytics(
          integration.accessToken,
          schedule.externalId!
        )
      } else {
        return NextResponse.json(
          { error: "Platform not supported" },
          { status: 400 }
        )
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to fetch analytics: ${error.message}` },
        { status: 500 }
      )
    }

    // Calculate engagement rate
    const engagement =
      analytics.likes + analytics.comments + analytics.shares
    const engagementRate =
      analytics.views > 0 ? (engagement / analytics.views) * 100 : 0

    // Save analytics
    await db.analytics.create({
      data: {
        scheduleId: schedule.id,
        platform: schedule.platform,
        views: analytics.views,
        likes: analytics.likes,
        comments: analytics.comments,
        shares: analytics.shares,
        clicks: 0, // Would need to be fetched from platform
        impressions: analytics.views,
        engagement: engagementRate,
      },
    })

    return NextResponse.json({
      success: true,
      analytics,
    })
  } catch (error) {
    console.error("Error syncing analytics:", error)
    return NextResponse.json(
      { error: "Failed to sync analytics" },
      { status: 500 }
    )
  }
}
