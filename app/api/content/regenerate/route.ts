import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { checkAiRateLimits } from "@/lib/rate-limit"
import { parseBody, contentRegenerateSchema } from "@/lib/validation"
import { generateContent, ProductContext, StrategyContext } from "@/lib/claude"
import type { AudienceSegment, ContentIntent, Persona } from "@/lib/content-intelligence"
import {
  assembleBrandContext,
  toLegacyProductContext,
  toLegacyStrategyContext,
} from "@/lib/brand-context/assembler"
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

    const user = await ensureUserForClerkId(userId)
    const rateLimit = await checkAiRateLimits(user.id)
    if (rateLimit) return rateLimit

    const raw = await req.json().catch(() => null)
    const parsed = parseBody(raw, contentRegenerateSchema)
    if ("error" in parsed) return parsed.error
    const { draftId, feedback } = parsed.data

    const draft = await db.contentDraft.findFirst({
      where: { id: draftId, userId: user.id },
      include: {
        insight: true,
        contentIdea: true,
        product: { include: { strategy: true } },
      },
    })

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    const insight = draft.insight
    const idea = draft.contentIdea
    const product = draft.product

    if (!insight && !idea && !draft.content) {
      return NextResponse.json(
        { error: "Draft has no insight, idea, or content to regenerate from" },
        { status: 400 }
      )
    }

    let productContext: ProductContext | undefined
    let strategyContext: StrategyContext | undefined
    let brandVoice: string | undefined

    if (product) {
      try {
        const brandCtx = await assembleBrandContext({
          userId: user.id,
          productId: product.id,
          task: "content.regenerate",
          brief: feedback?.trim() || draft.generationReason || undefined,
        })
        productContext = toLegacyProductContext(brandCtx)
        strategyContext = toLegacyStrategyContext(brandCtx) ?? undefined
        brandVoice = brandCtx.approved.voice?.tone
      } catch (e) {
        console.error("Brand context assemble failed:", e)
      }
    }

    const type = (draft.type as "post" | "blog" | "carousel" | "thread" | "caption") || "post"
    const platform = draft.platform as "linkedin" | "twitter" | "blog" | "facebook" | undefined
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
            coreProblem: idea?.objective || draft.title || "Regenerate draft",
            solution: idea?.concept || draft.content.slice(0, 1500),
            audience: idea?.audience || "audience",
            whyMatters: idea?.explanation || draft.generationReason || "Brand content",
            impact: undefined,
            themes: undefined,
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
        visualPrompt: null,
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
