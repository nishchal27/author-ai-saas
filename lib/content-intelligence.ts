/**
 * Content Intelligence Layer – shared vocabulary for audience, intent, and persona.
 * Used by content-decision pipeline, generate API, and UI.
 * Platform is a consequence of audience + intent + persona, not a driver.
 */

import type { SupportedPlatform } from "./constants"

// ============================================
// AUDIENCE SEGMENT (non-negotiable)
// ============================================

export const AUDIENCE_SEGMENTS = ["non_technical", "technical"] as const
export type AudienceSegment = (typeof AUDIENCE_SEGMENTS)[number]

export const AUDIENCE_SEGMENT_LABELS: Record<AudienceSegment, string> = {
  non_technical: "Non-technical",
  technical: "Technical",
}

export const AUDIENCE_SEGMENT_DESCRIPTIONS: Record<AudienceSegment, string> = {
  non_technical:
    "NGOs, event organizers, trainers, community leaders, general users. Problem-focused, prefer clarity and visuals, trust familiar channels (e.g. Facebook).",
  technical:
    "Developers, engineers, founders, indie hackers. Skeptical, pattern-seeking, want reasoning and trade-offs, prefer text and depth.",
}

// ============================================
// CONTENT INTENT (core abstraction)
// ============================================

export const CONTENT_INTENTS = [
  "engineering_credibility",
  "build_in_public",
  "product_trust",
  "feature_announcement",
  "lessons_learned",
  "case_study",
  "seo_long_term",
  "founder_narrative",
] as const

export type ContentIntent = (typeof CONTENT_INTENTS)[number]

export const CONTENT_INTENT_LABELS: Record<ContentIntent, string> = {
  engineering_credibility: "Engineering credibility",
  build_in_public: "Build in public",
  product_trust: "Product trust",
  feature_announcement: "Feature announcement",
  lessons_learned: "Lessons learned",
  case_study: "Case study",
  seo_long_term: "SEO / long-term value",
  founder_narrative: "Founder narrative",
}

export const CONTENT_INTENT_DESCRIPTIONS: Record<ContentIntent, string> = {
  engineering_credibility: "Show technical depth and honest trade-offs.",
  build_in_public: "Share progress, decisions, and real updates.",
  product_trust: "Build trust through reliability and clear outcomes.",
  feature_announcement: "Announce a feature with clear benefit.",
  lessons_learned: "Share what you learned (mistakes, fixes, takeaways).",
  case_study: "Tell a concrete story with results.",
  seo_long_term: "Evergreen, search-friendly content.",
  founder_narrative: "First-person story and perspective.",
}

// ============================================
// PERSONA
// ============================================

export const PERSONAS = ["founder_engineer", "product_company"] as const
export type Persona = (typeof PERSONAS)[number]

export const PERSONA_LABELS: Record<Persona, string> = {
  founder_engineer: "Founder / Engineer",
  product_company: "Product / Company",
}

export const PERSONA_DESCRIPTIONS: Record<Persona, string> = {
  founder_engineer:
    "Human, first-person, honest experiences, mistakes and lessons, contextual product mentions.",
  product_company:
    "Benefit-driven, trust-oriented, clear outcomes, simple language, reliability and ease.",
}

// ============================================
// FORMAT (content type)
// ============================================

export const CONTENT_FORMATS = ["post", "blog", "carousel", "thread", "caption"] as const
export type ContentFormat = (typeof CONTENT_FORMATS)[number]

export const CONTENT_FORMAT_LABELS: Record<ContentFormat, string> = {
  post: "Post",
  blog: "Blog",
  carousel: "Carousel",
  thread: "Thread",
  caption: "Caption",
}

// ============================================
// MAPPING: Product → default audience segment
// ============================================

/** Product audience codes that map to technical segment */
const TECHNICAL_AUDIENCE_CODES = new Set([
  "developers",
  "enterprise", // IT teams
  "creators",  // often technical
])

/** Product types that typically serve non-technical audiences */
const NON_TECHNICAL_PRODUCT_TYPES = new Set([
  "ngo",
  "event",
  "coaching",
  "physical",
  "course", // can be either; default non-technical for broad courses
])

/**
 * Infer default audience segment from product audience and type.
 * Used when user does not explicitly choose segment.
 */
export function getDefaultAudienceSegment(
  productAudience: string,
  productType: string
): AudienceSegment {
  const audienceLower = productAudience?.toLowerCase().trim() ?? ""
  const typeLower = productType?.toLowerCase().trim() ?? ""

  if (TECHNICAL_AUDIENCE_CODES.has(audienceLower)) {
    return "technical"
  }
  if (NON_TECHNICAL_PRODUCT_TYPES.has(typeLower)) {
    return "non_technical"
  }
  // smb_owners, consumers, professionals, learners → default non_technical for safety
  if (["smb_owners", "consumers", "learners", "professionals"].includes(audienceLower)) {
    return "non_technical"
  }
  // api, saas (devtools) → technical
  if (["api", "saas"].includes(typeLower) && (audienceLower === "" || audienceLower.includes("dev"))) {
    return "technical"
  }
  return "non_technical"
}

// ============================================
// SUGGESTED FORMATS BY SEGMENT + INTENT
// ============================================

/** Default format per segment when intent does not specify */
const DEFAULT_FORMAT_BY_SEGMENT: Record<AudienceSegment, ContentFormat> = {
  non_technical: "post",
  technical: "post",
}

/** Intent → preferred format(s); first is primary */
const FORMAT_BY_INTENT: Partial<Record<ContentIntent, ContentFormat[]>> = {
  lessons_learned: ["blog", "post"],
  case_study: ["post", "carousel"],
  seo_long_term: ["blog"],
  founder_narrative: ["post", "thread"],
  build_in_public: ["post", "thread"],
  engineering_credibility: ["post", "blog"],
  product_trust: ["post", "caption"],
  feature_announcement: ["post", "caption"],
}

export function getSuggestedFormats(
  segment: AudienceSegment,
  intent: ContentIntent
): ContentFormat[] {
  const byIntent = FORMAT_BY_INTENT[intent]
  if (byIntent?.length) {
    return byIntent
  }
  return [DEFAULT_FORMAT_BY_SEGMENT[segment]]
}

// ============================================
// SUGGESTED PLATFORMS BY SEGMENT
// ============================================

/** Non-technical: prefer visual / familiar channels */
const PLATFORMS_NON_TECHNICAL: SupportedPlatform[] = [
  "facebook",
  "instagram",
  "linkedin", // still used by many SMBs
  "blog",
]

/** Technical: prefer text-first, dev-adjacent */
const PLATFORMS_TECHNICAL: SupportedPlatform[] = [
  "linkedin",
  "twitter",
  "blog",
]

export function getDefaultPlatformsForSegment(
  segment: AudienceSegment
): SupportedPlatform[] {
  return segment === "technical" ? PLATFORMS_TECHNICAL : PLATFORMS_NON_TECHNICAL
}
