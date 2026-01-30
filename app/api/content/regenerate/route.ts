import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { generateContent, ProductContext, StrategyContext } from "@/lib/claude"
import type { AudienceSegment, ContentIntent, Persona } from "@/lib/content-intelligence"
import { NextResponse } from "next/server"

/**
 * POST /api/content/regenerate
 * Regenerate a draft's content using the same insight and options, with optional user feedback for better output.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { draftId, feedback } = body as { draftId: string; feedback?: string }

    if (!draftId) {
      return NextResponse.json(
        { error: "draftId is required" },
        { status: 400 }
      )
    }

    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const draft = await db.contentDraft.findFirst({
      where: { id: draftId, userId: user.id },
      include: {
        insight: true,
        product: { include: { strategy: true } },
      },
    })

    if (!draft || !draft.insight) {
      return NextResponse.json(
        { error: "Draft or linked insight not found" },
        { status: 404 }
      )
    }

    const insight = draft.insight
    const product = draft.product

    let productContext: ProductContext | undefined
    let strategyContext: StrategyContext | undefined

    if (product) {
      productContext = {
        name: product.name,
        type: product.type,
        industry: product.industry,
        audience: product.audience,
        stage: product.stage,
        description: product.description || undefined,
        audienceDetail: product.audienceDetail ?? undefined,
      }
      if (product.strategy) {
        try {
          strategyContext = {
            tone: JSON.parse(product.strategy.tone),
            platforms: JSON.parse(product.strategy.platforms),
            proofTypes: JSON.parse(product.strategy.proofTypes),
            cadence: JSON.parse(product.strategy.cadence),
            antiPatterns: JSON.parse(product.strategy.antiPatterns),
          }
        } catch (e) {
          console.error("Error parsing strategy:", e)
        }
      }
    }

    const type = (draft.type as "post" | "blog" | "carousel" | "thread" | "caption") || "post"
    const platform = draft.platform as "linkedin" | "twitter" | "instagram" | "blog" | "facebook" | undefined
    const brandVoice = user.brandVoice ? JSON.parse(user.brandVoice).tone : undefined
    const userTier = (user.tier === "premium" ? "premium" : "standard") as "standard" | "premium"

    const contentData = await generateContent(
      {
        coreProblem: insight.coreProblem,
        solution: insight.solution,
        audience: insight.audience,
        whyMatters: insight.whyMatters,
        impact: insight.impact || undefined,
        themes: insight.themes ? JSON.parse(insight.themes) : undefined,
      },
      type,
      platform,
      brandVoice,
      userTier,
      productContext,
      strategyContext,
      {
        intent: (draft.intent as ContentIntent) || undefined,
        audienceSegment: (draft.audienceSegment as AudienceSegment) || undefined,
        persona: (draft.persona as Persona) || undefined,
        toneDepth: undefined,
        reason: draft.generationReason || undefined,
        context: draft.audienceContext || undefined,
        feedback: feedback?.trim() || undefined,
      }
    )

    const updated = await db.contentDraft.update({
      where: { id: draftId },
      data: {
        title: contentData.title || null,
        content: contentData.content,
        visualPrompt: contentData.visualPrompt || null,
        cta: contentData.cta || null,
        whyThisContent: contentData.whyThisContent || null,
        version: draft.version + 1,
      },
    })

    return NextResponse.json({ draft: updated })
  } catch (error) {
    console.error("Error regenerating content:", error)
    return NextResponse.json(
      { error: "Failed to regenerate content" },
      { status: 500 }
    )
  }
}
