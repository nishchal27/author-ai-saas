/**
 * Content Engine – orchestrates context → decision → generation.
 * Single entry point for the content pipeline; evaluation runs in the API after draft save.
 */

import { generateContent, ProductContext, StrategyContext } from "./claude"
import type { ContentDraft } from "./claude"
import { decideContentOptions, type DecideContentOptionsOutput } from "./content-decision"
import type { AudienceSegment, ContentIntent, Persona } from "./content-intelligence"

export interface ContentEngineContext {
  insight: {
    coreProblem: string
    solution: string
    audience: string
    whyMatters: string
    impact?: string | null
    themes?: string | null
  }
  product: {
    audience: string
    type: string
    name?: string
    strategy: { platforms: string } | null
  } | null
  productContext: ProductContext | undefined
  strategyContext: StrategyContext | undefined
  founderBio: string | null
  techStack: string | null
  brandVoice: string | undefined
  userTier: "standard" | "premium"
}

export interface ContentEngineInput {
  context: ContentEngineContext
  typeOverride?: string
  platformOverride?: string
  intent: ContentIntent
  audienceSegment?: AudienceSegment
  persona?: Persona
  reason?: string
  contextExtra?: string
}

export interface ContentEngineOutput {
  contentData: ContentDraft
  decision: DecideContentOptionsOutput
  type: string
  platform: string
}

/**
 * Run the content engine: decision layer → generation layer.
 * Evaluation is run by the API after the draft is saved.
 */
export async function runContentEngine(input: ContentEngineInput): Promise<ContentEngineOutput> {
  const {
    context,
    typeOverride,
    platformOverride,
    intent,
    audienceSegment,
    persona,
    reason,
    contextExtra,
  } = input

  const { insight, product, productContext, strategyContext, founderBio, techStack, brandVoice, userTier } = context

  let themes: string[] | undefined
  if (insight.themes) {
    try {
      themes = JSON.parse(insight.themes) as string[]
    } catch {
      themes = undefined
    }
  } else {
    themes = undefined
  }

  const insightForExtraction = {
    coreProblem: insight.coreProblem,
    solution: insight.solution,
    audience: insight.audience,
    whyMatters: insight.whyMatters,
    impact: insight.impact || undefined,
    themes,
  }

  const decision = decideContentOptions(
    product ?? { audience: "", type: "" },
    product?.strategy ?? null,
    {
      audienceSegment,
      intent,
      persona,
      insightSummary: insight.solution || insight.coreProblem,
    }
  )

  const type =
    typeOverride && ["post", "blog", "carousel", "thread", "caption"].includes(typeOverride)
      ? typeOverride
      : decision.suggestedFormat
  const platform = platformOverride ?? decision.suggestedPlatform

  const contentData = await generateContent(
    insightForExtraction,
    type as "post" | "blog" | "carousel" | "thread" | "caption",
    platform as "linkedin" | "twitter" | "blog" | "facebook",
    brandVoice,
    userTier,
    productContext,
    strategyContext,
    {
      intent,
      reason,
      context: contextExtra,
      audienceSegment: decision.audienceSegment,
      persona: decision.persona,
      toneDepth: decision.toneDepth,
      founderBio: founderBio ?? undefined,
      techStack: techStack ?? undefined,
    }
  )

  return {
    contentData,
    decision,
    type,
    platform,
  }
}
