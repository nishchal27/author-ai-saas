/**
 * Content Decision Pipeline – Audience → Intent → Persona → Tone/Depth → Format → Platform.
 * Does not generate copy; only decides how and where so generateContent can be driven by these outputs.
 */

import {
  type AudienceSegment,
  type ContentIntent,
  type Persona,
  type ContentFormat,
  getDefaultAudienceSegment,
  getSuggestedFormats,
  getDefaultPlatformsForSegment,
  CONTENT_FORMAT_LABELS,
} from "./content-intelligence"
import type { SupportedPlatform } from "./constants"

export interface ProductForDecision {
  audience: string
  type: string
  name?: string
}

export interface StrategyForDecision {
  platforms?: string // JSON: { platform, priority, reasoning }[]
}

export interface DecideContentOptionsInput {
  audienceSegment?: AudienceSegment
  intent: ContentIntent
  persona?: Persona
  /** Optional: for repurposing, pass source insight context */
  insightSummary?: string
}

export interface DecideContentOptionsOutput {
  /** Resolved segment (from input or inferred from product) */
  audienceSegment: AudienceSegment
  /** Resolved persona (from input or default for intent) */
  persona: Persona
  /** Primary suggested format */
  suggestedFormat: ContentFormat
  /** All suggested formats in order (first is primary) */
  suggestedFormats: ContentFormat[]
  /** Primary suggested platform (first of suggestedPlatforms) */
  suggestedPlatform: SupportedPlatform
  /** Suggested platforms in order; strategy primary/secondary filtered by segment */
  suggestedPlatforms: SupportedPlatform[]
  /** Tone and depth guidance for the generator */
  toneDepth: string
  /** 1–2 sentences for UI: why this format and platform */
  reasoningSummary: string
}

const VALID_PLATFORMS: SupportedPlatform[] = [
  "linkedin",
  "twitter",
  "facebook",
  "blog",
]

function parseStrategyPlatforms(strategy: StrategyForDecision): { platform: string; priority: string }[] {
  if (!strategy?.platforms) return []
  try {
    const arr = JSON.parse(strategy.platforms) as { platform?: string; priority?: string }[]
    return Array.isArray(arr)
      ? arr
          .filter((p) => p.platform && p.priority !== "avoid")
          .map((p) => ({ platform: String(p.platform).toLowerCase(), priority: String(p.priority ?? "secondary") }))
      : []
  } catch {
    return []
  }
}

/** Default persona when not provided: founder_engineer for build/engineering intents, product_company for trust/feature */
function getDefaultPersonaForIntent(intent: ContentIntent): Persona {
  const founderIntents: ContentIntent[] = [
    "engineering_credibility",
    "build_in_public",
    "lessons_learned",
    "founder_narrative",
  ]
  return founderIntents.includes(intent) ? "founder_engineer" : "product_company"
}

/** Tone/depth guidance by segment and persona (for Claude prompt). */
function getToneDepth(
  segment: AudienceSegment,
  persona: Persona,
  intent: ContentIntent
): string {
  if (segment === "non_technical") {
    return "Short, clear, one main benefit. Minimal cognitive load. Prefer visuals; avoid long text and technical jargon. Simple language, trust-oriented."
  }
  // technical
  if (persona === "founder_engineer") {
    return "Text-first, honest depth. Include reasoning, trade-offs, and lessons. First-person, real experiences. No marketing fluff; clarity over cleverness."
  }
  return "Text-first, substance over polish. Clear outcomes and reasoning. Avoid hype; trust and credibility over virality."
}

/**
 * Content decision pipeline: Audience → Intent → Persona → Tone/Depth → Format → Platform.
 * Returns suggested format, platform(s), tone/depth, and reasoning for UI.
 */
export function decideContentOptions(
  product: ProductForDecision,
  strategy: StrategyForDecision | null,
  input: DecideContentOptionsInput
): DecideContentOptionsOutput {
  const audienceSegment: AudienceSegment =
    input.audienceSegment ?? getDefaultAudienceSegment(product.audience, product.type)
  const persona: Persona =
    input.persona ?? getDefaultPersonaForIntent(input.intent)

  const suggestedFormats = getSuggestedFormats(audienceSegment, input.intent)
  const suggestedFormat = suggestedFormats[0] ?? "post"

  const segmentPlatforms = getDefaultPlatformsForSegment(audienceSegment)
  const strategyPlatforms = parseStrategyPlatforms(strategy ?? {})

  // Prefer strategy primary/secondary that are in segment's list; then segment list order
  const primaryFromStrategy = strategyPlatforms
    .filter((p) => p.priority === "primary")
    .map((p) => p.platform)
  const secondaryFromStrategy = strategyPlatforms
    .filter((p) => p.priority === "secondary")
    .map((p) => p.platform)

  const ordered: SupportedPlatform[] = []
  const seen = new Set<string>()
  const toPlatform = (p: string): SupportedPlatform | null =>
    VALID_PLATFORMS.includes(p as SupportedPlatform) ? (p as SupportedPlatform) : null
  for (const p of primaryFromStrategy) {
    const plat = toPlatform(p)
    if (plat && segmentPlatforms.includes(plat) && !seen.has(p)) {
      ordered.push(plat)
      seen.add(p)
    }
  }
  for (const p of secondaryFromStrategy) {
    const plat = toPlatform(p)
    if (plat && segmentPlatforms.includes(plat) && !seen.has(p)) {
      ordered.push(plat)
      seen.add(p)
    }
  }
  for (const p of segmentPlatforms) {
    if (!seen.has(p)) ordered.push(p)
  }

  const suggestedPlatforms = ordered.length ? ordered : segmentPlatforms
  const suggestedPlatform = suggestedPlatforms[0] ?? "linkedin"

  const toneDepth = getToneDepth(audienceSegment, persona, input.intent)

  const reasoningSummary =
    audienceSegment === "non_technical"
      ? `For non-technical readers we suggest a ${CONTENT_FORMAT_LABELS[suggestedFormat].toLowerCase()} on ${suggestedPlatform}; short and visual works best.`
      : `For technical readers we suggest a ${CONTENT_FORMAT_LABELS[suggestedFormat].toLowerCase()} on ${suggestedPlatform}; text and depth fit this audience.`

  return {
    audienceSegment,
    persona,
    suggestedFormat,
    suggestedFormats,
    suggestedPlatform,
    suggestedPlatforms,
    toneDepth,
    reasoningSummary,
  }
}
