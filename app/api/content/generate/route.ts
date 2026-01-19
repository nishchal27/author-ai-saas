import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { generateContent } from "@/lib/claude"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { insightId, type, platform } = body

    if (!insightId || !type) {
      return NextResponse.json(
        { error: "Insight ID and type are required" },
        { status: 400 }
      )
    }

    // Fetch insight
    const insight = await db.insight.findFirst({
      where: {
        id: insightId,
        userId: (await db.user.findFirst({ where: { clerkId: userId } }))!.id,
      },
    })

    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 })
    }

    // Get user brand voice and tier
    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })

    const brandVoice = user?.brandVoice ? JSON.parse(user.brandVoice).tone : undefined
    const userTier = (user?.tier === "premium" ? "premium" : "standard") as "standard" | "premium"

    // Generate content
    const contentData = await generateContent(
      {
        coreProblem: insight.coreProblem,
        solution: insight.solution,
        audience: insight.audience,
        whyMatters: insight.whyMatters,
        impact: insight.impact || undefined,
        themes: insight.themes ? JSON.parse(insight.themes) : undefined,
      },
      type as "post" | "blog" | "carousel" | "thread" | "caption",
      platform as "linkedin" | "twitter" | "instagram" | "blog" | undefined,
      brandVoice,
      userTier
    )

    // Save draft
    const draft = await db.contentDraft.create({
      data: {
        userId: user!.id,
        insightId: insight.id,
        type,
        platform: platform || null,
        title: contentData.title || null,
        content: contentData.content,
        visualPrompt: contentData.visualPrompt || null,
        cta: contentData.cta || null,
        status: "draft",
      },
    })

    return NextResponse.json({ draft })
  } catch (error) {
    console.error("Error generating content:", error)
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    )
  }
}
