import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { generateContent, ProductContext, StrategyContext } from "@/lib/claude"
import { decideContentOptions } from "@/lib/content-decision"
import type { AudienceSegment, ContentIntent, Persona } from "@/lib/content-intelligence"
import { NextResponse } from "next/server"

/**
 * POST /api/content/repurpose
 * Create a new draft from an existing one, preserving intent but adjusting tone/depth/format for a new audience or persona.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      sourceDraftId,
      audienceSegment: audienceSegmentOverride,
      intent: intentOverride,
      persona: personaOverride,
      type: typeOverride,
      platform: platformOverride,
    } = body

    if (!sourceDraftId) {
      return NextResponse.json(
        { error: "sourceDraftId is required" },
        { status: 400 }
      )
    }

    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const sourceDraft = await db.contentDraft.findFirst({
      where: { id: sourceDraftId, userId: user.id },
      include: {
        insight: true,
        product: { include: { strategy: true } },
      },
    })

    if (!sourceDraft || !sourceDraft.insight) {
      return NextResponse.json(
        { error: "Draft or linked insight not found" },
        { status: 404 }
      )
    }

    const insight = sourceDraft.insight
    const product = sourceDraft.product
    const targetProductId = sourceDraft.productId

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

    const intentForDecision: ContentIntent =
      (intentOverride as ContentIntent) || (sourceDraft.intent as ContentIntent) || "product_trust"

    const decision = decideContentOptions(
      product ?? { audience: "", type: "" },
      product?.strategy ?? null,
      {
        audienceSegment: audienceSegmentOverride as AudienceSegment | undefined,
        intent: intentForDecision,
        persona: personaOverride as Persona | undefined,
        insightSummary: insight.solution || insight.coreProblem,
      }
    )

    const type =
      typeOverride && ["post", "blog", "carousel", "thread", "caption"].includes(typeOverride)
        ? typeOverride
        : decision.suggestedFormat
    const platform = platformOverride ?? decision.suggestedPlatform

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
      type as "post" | "blog" | "carousel" | "thread" | "caption",
      platform as "linkedin" | "twitter" | "instagram" | "blog" | "facebook" | undefined,
      brandVoice,
      userTier,
      productContext,
      strategyContext,
      {
        intent: intentForDecision,
        audienceSegment: decision.audienceSegment,
        persona: decision.persona,
        toneDepth: decision.toneDepth,
      }
    )

    const draft = await db.contentDraft.create({
      data: {
        userId: user.id,
        productId: targetProductId || null,
        insightId: insight.id,
        type,
        platform: platform || null,
        title: contentData.title || null,
        content: contentData.content,
        visualPrompt: null,
        cta: contentData.cta || null,
        status: "draft",
        intent: intentForDecision,
        whyThisContent: contentData.whyThisContent || null,
        audienceSegment: decision.audienceSegment,
        persona: decision.persona,
        suggestedFormat: decision.suggestedFormat,
        suggestedPlatform: decision.suggestedPlatform,
        sourceDraftId: sourceDraftId,
      },
    })

    return NextResponse.json({
      draft,
      reasoningSummary: decision.reasoningSummary,
    })
  } catch (error) {
    console.error("Error repurposing content:", error)
    return NextResponse.json(
      { error: "Failed to repurpose content" },
      { status: 500 }
    )
  }
}
