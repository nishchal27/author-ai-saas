import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ProductContext, StrategyContext } from "@/lib/claude"
import type { AudienceSegment, ContentIntent, Persona } from "@/lib/content-intelligence"
import { runContentEngine } from "@/lib/content-engine"
import { evaluateContent } from "@/lib/content-evaluation"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      insightId,
      type: typeOverride,
      platform: platformOverride,
      productId,
      intent,
      audienceSegment: audienceSegmentOverride,
      persona: personaOverride,
      reason,
      context,
    } = body

    if (!insightId) {
      return NextResponse.json(
        { error: "Insight ID is required" },
        { status: 400 }
      )
    }

    // Get user with active product
    const user = await db.user.findFirst({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch insight
    const insight = await db.insight.findFirst({
      where: {
        id: insightId,
        userId: user.id,
      },
    })

    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 })
    }

    // Get product context and strategy
    // Use provided productId, or insight's productId, or user's active product
    const targetProductId = productId || insight.productId || user.activeProductId
    
    let productContext: ProductContext | undefined
    let strategyContext: StrategyContext | undefined

    let product: { audience: string; type: string; name?: string; strategy: { platforms: string } | null } | null = null

    if (targetProductId) {
      const productRow = await db.product.findFirst({
        where: { id: targetProductId, userId: user.id },
        include: { strategy: true },
      })

      if (productRow) {
        product = productRow
        productContext = {
          name: productRow.name,
          type: productRow.type,
          industry: productRow.industry,
          audience: productRow.audience,
          stage: productRow.stage,
          description: productRow.description || undefined,
          audienceDetail: productRow.audienceDetail ?? undefined,
        }

        if (productRow.strategy) {
          try {
            strategyContext = {
              tone: JSON.parse(productRow.strategy.tone),
              platforms: JSON.parse(productRow.strategy.platforms),
              proofTypes: JSON.parse(productRow.strategy.proofTypes),
              cadence: JSON.parse(productRow.strategy.cadence),
              antiPatterns: JSON.parse(productRow.strategy.antiPatterns),
            }
          } catch (e) {
            console.error("Error parsing strategy:", e)
          }
        }
      }
    }

    let brandVoice: string | undefined
    try {
      const bv = (user as any).brandVoice
      brandVoice = bv ? JSON.parse(bv).tone : undefined
    } catch {
      brandVoice = undefined
    }
    const userTier = (user.tier === "premium" ? "premium" : "standard") as "standard" | "premium"
    const founderBio = (user as any).founderBio ?? null
    let techStack: string | null = null
    const productWithTech = product as { techStackJson?: string | null } | null
    if (productWithTech?.techStackJson) {
      try {
        const arr = JSON.parse(productWithTech.techStackJson) as { name: string; version?: string; note?: string }[]
        techStack = arr.map((t) => [t.name, t.version, t.note].filter(Boolean).join(" — ")).join("; ")
      } catch {}
    }

    const intentForDecision = (intent as ContentIntent) || "product_trust"

    const { contentData, decision, type, platform } = await runContentEngine({
      context: {
        insight: {
          coreProblem: insight.coreProblem,
          solution: insight.solution,
          audience: insight.audience,
          whyMatters: insight.whyMatters,
          impact: insight.impact,
          themes: insight.themes,
        },
        product,
        productContext,
        strategyContext,
        founderBio,
        techStack,
        brandVoice,
        userTier,
      },
      typeOverride,
      platformOverride,
      intent: intentForDecision,
      audienceSegment: audienceSegmentOverride as AudienceSegment | undefined,
      persona: personaOverride as Persona | undefined,
      reason,
      contextExtra: context,
    })

    // Save draft with product link, intent/reason/context, and content intelligence fields
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
        generationReason: reason || null,
        audienceContext: context || null,
        whyThisContent: contentData.whyThisContent || null,
        audienceSegment: decision.audienceSegment,
        persona: decision.persona,
        suggestedFormat: decision.suggestedFormat,
        suggestedPlatform: decision.suggestedPlatform,
      },
    })

    // Evaluation layer: rate draft for platform and goal fit
    let evaluationScore: number | null = null
    let evaluationNote: string | null = null
    try {
      const evaluation = await evaluateContent(
        contentData.content,
        platform || "linkedin",
        intentForDecision,
        reason ?? context ?? undefined
      )
      evaluationScore = evaluation.score
      evaluationNote = evaluation.note || null
      await db.contentDraft.update({
        where: { id: draft.id },
        data: { evaluationScore, evaluationNote },
      })
    } catch (e) {
      console.error("Content evaluation failed:", e)
    }

    // Check if platform is recommended
    let platformWarning: string | null = null
    if (platform && strategyContext?.platforms) {
      const platformRec = strategyContext.platforms.find(
        p => p.platform.toLowerCase() === platform.toLowerCase()
      )
      if (platformRec?.priority === "avoid") {
        platformWarning = `Note: ${platform} is not recommended for this product. Consider ${strategyContext.platforms.filter(p => p.priority === "primary").map(p => p.platform).join(" or ")} instead.`
      }
    }

    return NextResponse.json({
      draft: {
        ...draft,
        evaluationScore: evaluationScore ?? draft.evaluationScore,
        evaluationNote: evaluationNote ?? draft.evaluationNote,
      },
      platformWarning,
      strategyApplied: !!strategyContext,
      suggestedFormat: decision.suggestedFormat,
      suggestedPlatform: decision.suggestedPlatform,
      reasoningSummary: decision.reasoningSummary,
    })
  } catch (error) {
    console.error("Error generating content:", error)
    const message = error instanceof Error ? error.message : "Failed to generate content"
    return NextResponse.json(
      { error: "Failed to generate content", details: message },
      { status: 500 }
    )
  }
}
