import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { checkAiRateLimits } from "@/lib/rate-limit"
import { parseBody, contentRepurposeSchema } from "@/lib/validation"
import { generateContent, ProductContext, StrategyContext } from "@/lib/claude"
import { decideContentOptions } from "@/lib/content-decision"
import type { AudienceSegment, ContentIntent, Persona } from "@/lib/content-intelligence"
import {
  assembleBrandContext,
  toLegacyProductContext,
  toLegacyStrategyContext,
} from "@/lib/brand-context/assembler"
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

    const user = await ensureUserForClerkId(userId)
    const rateLimit = await checkAiRateLimits(user.id)
    if (rateLimit) return rateLimit

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, contentRepurposeSchema)
    if ("error" in parsed) return parsed.error
    const {
      sourceDraftId,
      audienceSegment: audienceSegmentOverride,
      intent: intentOverride,
      persona: personaOverride,
      type: typeOverride,
      platform: platformOverride,
    } = parsed.data

    const sourceDraft = await db.contentDraft.findFirst({
      where: { id: sourceDraftId, userId: user.id },
      include: {
        insight: true,
        contentIdea: true,
        product: { include: { strategy: true } },
      },
    })

    if (!sourceDraft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    const insight = sourceDraft.insight
    const idea = sourceDraft.contentIdea
    const product = sourceDraft.product
    const targetProductId = sourceDraft.productId

    let productContext: ProductContext | undefined
    let strategyContext: StrategyContext | undefined
    let brandCtxIdentity: { audience: string; type: string } | null = null
    let brandVoice: string | undefined

    if (product) {
      try {
        const brandCtx = await assembleBrandContext({
          userId: user.id,
          productId: product.id,
          task: "content.repurpose",
        })
        productContext = toLegacyProductContext(brandCtx)
        strategyContext = toLegacyStrategyContext(brandCtx) ?? undefined
        brandCtxIdentity = {
          audience: brandCtx.identity.audience,
          type: brandCtx.identity.type,
        }
        brandVoice = brandCtx.approved.voice?.tone
      } catch (e) {
        console.error("Brand context assemble failed:", e)
      }
    }

    const intentForDecision: ContentIntent =
      (intentOverride as ContentIntent) || (sourceDraft.intent as ContentIntent) || "product_trust"

    const decision = decideContentOptions(
      brandCtxIdentity ?? product ?? { audience: "", type: "" },
      product?.strategy ?? null,
      {
        audienceSegment: audienceSegmentOverride as AudienceSegment | undefined,
        intent: intentForDecision,
        persona: personaOverride as Persona | undefined,
        insightSummary:
          insight?.solution ||
          insight?.coreProblem ||
          idea?.concept ||
          sourceDraft.content.slice(0, 400),
      }
    )

    const type =
      typeOverride && ["post", "blog", "carousel", "thread", "caption"].includes(typeOverride)
        ? typeOverride
        : decision.suggestedFormat
    const platform = platformOverride ?? decision.suggestedPlatform

    if (!brandVoice && user.brandVoice) {
      try {
        brandVoice = JSON.parse(user.brandVoice).tone
      } catch {
        brandVoice = undefined
      }
    }
    const userTier = (user.tier === "premium" ? "premium" : "standard") as "standard" | "premium"

    const contentData = await generateContent(
      insight
        ? {
            coreProblem: insight.coreProblem,
            solution: insight.solution,
            audience: insight.audience,
            whyMatters: insight.whyMatters,
            impact: insight.impact || undefined,
            themes: insight.themes ? JSON.parse(insight.themes) : undefined,
          }
        : {
            coreProblem: idea?.objective || sourceDraft.title || "Repurpose draft",
            solution: idea?.concept || sourceDraft.content.slice(0, 1500),
            audience: idea?.audience || "audience",
            whyMatters:
              idea?.explanation || sourceDraft.generationReason || "Brand content",
            impact: undefined,
            themes: undefined,
          },
      type as "post" | "blog" | "carousel" | "thread" | "caption",
      platform as "linkedin" | "twitter" | "blog" | "facebook" | undefined,
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
        insightId: insight?.id ?? null,
        contentIdeaId: idea?.id ?? sourceDraft.contentIdeaId ?? null,
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
