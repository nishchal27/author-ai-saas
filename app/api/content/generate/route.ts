import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { checkAiRateLimits } from "@/lib/rate-limit"
import { parseBody, contentGenerateSchema } from "@/lib/validation"
import { ProductContext, StrategyContext } from "@/lib/claude"
import type { AudienceSegment, ContentIntent, Persona } from "@/lib/content-intelligence"
import { runContentEngine } from "@/lib/content-engine"
import { evaluateContent } from "@/lib/content-evaluation"
import {
  assembleBrandContext,
  toLegacyProductContext,
  toLegacyStrategyContext,
} from "@/lib/brand-context/assembler"
import { shouldRunAiReview } from "@/lib/ai/quality"
import { toAiPublicError } from "@/lib/ai/public-error"
import { hasAnyAiProviderKey } from "@/lib/env"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)

    if (!hasAnyAiProviderKey()) {
      const pub = toAiPublicError(new Error("not configured"))
      return NextResponse.json(
        { error: pub.error, code: pub.code },
        { status: pub.status }
      )
    }

    const rateLimit = await checkAiRateLimits(user.id)
    if (rateLimit) return rateLimit

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, contentGenerateSchema)
    if ("error" in parsed) return parsed.error
    const {
      insightId,
      ideaId,
      type: typeOverride,
      platform: platformOverride,
      productId,
      intent,
      audienceSegment: audienceSegmentOverride,
      persona: personaOverride,
      reason,
      context,
    } = parsed.data

    const insight = insightId
      ? await db.insight.findFirst({
          where: { id: insightId, userId: user.id },
        })
      : null

    if (insightId && !insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 })
    }

    const idea = ideaId
      ? await db.contentIdea.findFirst({
          where: { id: ideaId, userId: user.id },
        })
      : null

    if (ideaId && !idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 })
    }

    if (idea && productId && idea.productId !== productId) {
      return NextResponse.json(
        { error: "Idea does not belong to the specified product" },
        { status: 400 }
      )
    }

    const requestedProductId =
      productId || idea?.productId || insight?.productId || user.activeProductId || null

    if (idea && requestedProductId && idea.productId !== requestedProductId) {
      return NextResponse.json(
        { error: "Idea/product mismatch" },
        { status: 400 }
      )
    }

    // Ownership: never attach a foreign productId to drafts or AI context.
    let targetProductId: string | null = null
    if (requestedProductId) {
      const ownedProduct = await db.product.findFirst({
        where: { id: requestedProductId, userId: user.id },
        select: { id: true },
      })
      if (!ownedProduct) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
      targetProductId = ownedProduct.id
    }

    let productContext: ProductContext | undefined
    let strategyContext: StrategyContext | undefined
    let product: {
      audience: string
      type: string
      name?: string
      strategy: { platforms: string } | null
    } | null = null
    let brandVoice: string | undefined
    let founderBio: string | null = user.founderBio ?? null
    let techStack: string | null = null

    if (targetProductId) {
      try {
        const brandCtx = await assembleBrandContext({
          userId: user.id,
          productId: targetProductId,
          task: "content.generate",
          brief: context,
        })
        productContext = toLegacyProductContext(brandCtx)
        strategyContext = toLegacyStrategyContext(brandCtx) ?? undefined
        product = {
          audience: brandCtx.identity.audience,
          type: brandCtx.identity.type,
          name: brandCtx.identity.name,
          strategy: brandCtx.strategy
            ? { platforms: JSON.stringify(brandCtx.strategy.platforms ?? []) }
            : null,
        }
        brandVoice =
          brandCtx.approved.voice?.tone ||
          (() => {
            try {
              return user.brandVoice ? JSON.parse(user.brandVoice).tone : undefined
            } catch {
              return undefined
            }
          })()
        founderBio = brandCtx.untrusted.founderBio ?? founderBio
        techStack = brandCtx.untrusted.techStack ?? null
      } catch (e) {
        console.error("Brand context assemble failed:", e)
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
    }

    if (!brandVoice && user.brandVoice) {
      try {
        brandVoice = JSON.parse(user.brandVoice).tone
      } catch {
        brandVoice = undefined
      }
    }
    const userTier = (user.tier === "premium" ? "premium" : "standard") as
      | "standard"
      | "premium"

    const intentForDecision = (intent as ContentIntent) || "product_trust"

    const insightPayload = insight
      ? {
          coreProblem: insight.coreProblem,
          solution: insight.solution,
          audience: insight.audience,
          whyMatters: insight.whyMatters,
          impact: insight.impact,
          themes: insight.themes,
        }
      : {
          coreProblem: idea?.objective || idea?.title || "Content idea",
          solution: idea?.concept || context || "",
          audience: idea?.audience || product?.audience || "audience",
          whyMatters: idea?.explanation || reason || "Brand content",
          impact: null,
          themes: idea ? JSON.stringify([idea.platform, idea.format]) : null,
        }

    const { contentData, decision, type, platform } = await runContentEngine({
      context: {
        insight: insightPayload,
        product,
        productContext,
        strategyContext,
        founderBio,
        techStack,
        brandVoice,
        userTier,
        userId: user.id,
        brandId: targetProductId || undefined,
      },
      typeOverride: typeOverride || idea?.format,
      platformOverride: platformOverride || idea?.platform,
      intent: intentForDecision,
      audienceSegment: audienceSegmentOverride as AudienceSegment | undefined,
      persona: personaOverride as Persona | undefined,
      reason: reason || idea?.objective,
      contextExtra: context || idea?.concept,
    })

    const draft = await db.contentDraft.create({
      data: {
        userId: user.id,
        productId: targetProductId || null,
        insightId: insight?.id ?? null,
        contentIdeaId: idea?.id ?? null,
        type,
        platform: platform || null,
        title: contentData.title || idea?.title || null,
        content: contentData.content,
        visualPrompt: null,
        cta: contentData.cta || null,
        status: "draft",
        intent: intentForDecision,
        generationReason: reason || idea?.objective || null,
        audienceContext: context || idea?.audience || null,
        whyThisContent: contentData.whyThisContent || null,
        audienceSegment: decision.audienceSegment,
        persona: decision.persona,
        suggestedFormat: decision.suggestedFormat,
        suggestedPlatform: decision.suggestedPlatform,
        generationMetaJson: idea
          ? JSON.stringify({ source: "content.generate", ideaId: idea.id })
          : insight
            ? JSON.stringify({ source: "content.generate", insightId: insight.id })
            : null,
      },
    })

    if (idea && idea.status !== "converted") {
      await db.contentIdea.updateMany({
        where: { id: idea.id, userId: user.id, productId: idea.productId },
        data: { status: "converted" },
      })
    }

    let evaluationScore: number | null = null
    let evaluationNote: string | null = null
    const shouldAiReview = shouldRunAiReview({
      qualityPolicy: "deterministic_then_optional_review",
      contentType: type,
    })
    if (shouldAiReview) {
      try {
        const evaluation = await evaluateContent(
          contentData.content,
          platform || "linkedin",
          intentForDecision,
          reason ?? context ?? undefined,
          { userId: user.id, brandId: targetProductId || undefined }
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
    }

    let platformWarning: string | null = null
    if (platform && strategyContext?.platforms) {
      const platformRec = strategyContext.platforms.find(
        (p) => p.platform.toLowerCase() === platform.toLowerCase()
      )
      if (platformRec?.priority === "avoid") {
        platformWarning = `Note: ${platform} is not recommended for this product. Consider ${strategyContext.platforms
          .filter((p) => p.priority === "primary")
          .map((p) => p.platform)
          .join(" or ")} instead.`
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
    const pub = toAiPublicError(error)
    return NextResponse.json(
      { error: pub.error, code: pub.code },
      { status: pub.status }
    )
  }
}
