import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get all published schedules
    const schedules = await db.schedule.findMany({
      where: {
        userId: user.id,
        status: "published",
      },
      include: {
        contentDraft: true,
        analytics: {
          orderBy: {
            recordedAt: "desc",
          },
        },
      },
    })

    // Calculate totals
    let totalViews = 0
    let totalLikes = 0
    let totalComments = 0
    let totalShares = 0
    let totalClicks = 0
    let totalImpressions = 0
    const platformStats: Record<string, any> = {}
    const topPosts: any[] = []

    schedules.forEach((schedule) => {
      const latestAnalytics = schedule.analytics[0]
      if (latestAnalytics) {
        totalViews += latestAnalytics.views
        totalLikes += latestAnalytics.likes
        totalComments += latestAnalytics.comments
        totalShares += latestAnalytics.shares
        totalClicks += latestAnalytics.clicks
        totalImpressions += latestAnalytics.impressions

        // Platform stats
        if (!platformStats[schedule.platform]) {
          platformStats[schedule.platform] = {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            clicks: 0,
            impressions: 0,
          }
        }
        platformStats[schedule.platform].views += latestAnalytics.views
        platformStats[schedule.platform].likes += latestAnalytics.likes
        platformStats[schedule.platform].comments += latestAnalytics.comments
        platformStats[schedule.platform].shares += latestAnalytics.shares
        platformStats[schedule.platform].clicks += latestAnalytics.clicks
        platformStats[schedule.platform].impressions += latestAnalytics.impressions

        // Top posts
        const engagement =
          latestAnalytics.likes +
          latestAnalytics.comments +
          latestAnalytics.shares
        topPosts.push({
          id: schedule.id,
          title: schedule.contentDraft.title,
          content: schedule.contentDraft.content,
          platform: schedule.platform,
          publishedAt: schedule.publishedAt,
          engagement,
          views: latestAnalytics.views,
        })
      }
    })

    // Sort top posts by engagement
    topPosts.sort((a, b) => b.engagement - a.engagement)

    // Calculate average engagement rate
    const averageEngagement =
      totalImpressions > 0
        ? ((totalLikes + totalComments + totalShares) / totalImpressions) * 100
        : 0

    return NextResponse.json({
      analytics: {
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        totalClicks,
        totalImpressions,
        averageEngagement,
        topPosts,
        platformStats,
      },
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
