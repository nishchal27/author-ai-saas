import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { extractInsight } from "@/lib/claude"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { activityId, humanInput } = body

    if (!activityId) {
      return NextResponse.json({ error: "Activity ID is required" }, { status: 400 })
    }

    // Fetch activity
    const activity = await db.activity.findFirst({
      where: {
        id: activityId,
        userId,
      },
    })

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    // Get user brand voice and tier
    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })

    const brandVoice = user?.brandVoice ? JSON.parse(user.brandVoice).tone : undefined
    const userTier = (user?.tier === "premium" ? "premium" : "standard") as "standard" | "premium"

    // Extract insight
    const insightData = await extractInsight(
      {
        title: activity.title,
        description: activity.description || undefined,
        type: activity.type,
        humanInput,
      },
      brandVoice,
      userTier
    )

    // Save insight
    const insight = await db.insight.create({
      data: {
        userId: user!.id,
        activityId: activity.id,
        coreProblem: insightData.coreProblem,
        solution: insightData.solution,
        audience: insightData.audience,
        whyMatters: insightData.whyMatters,
        impact: insightData.impact,
        themes: insightData.themes ? JSON.stringify(insightData.themes) : null,
        status: "draft",
      },
    })

    // Mark activity as processed
    await db.activity.update({
      where: { id: activity.id },
      data: { processed: true },
    })

    return NextResponse.json({ insight })
  } catch (error) {
    console.error("Error extracting insight:", error)
    return NextResponse.json(
      { error: "Failed to extract insight" },
      { status: 500 }
    )
  }
}
