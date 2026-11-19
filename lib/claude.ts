import Anthropic from "@anthropic-ai/sdk"
import { hasAnyAiProviderKey } from "@/lib/env"
import { completeText, MODEL_CATALOG, resolveTaskModel } from "@/lib/ai"

function preferAnthropic(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

function preferOpenAI(): boolean {
  return !process.env.ANTHROPIC_API_KEY && !!process.env.OPENAI_API_KEY
}

function preferOpenRouter(): boolean {
  return (
    !process.env.ANTHROPIC_API_KEY &&
    !process.env.OPENAI_API_KEY &&
    !!process.env.OPENROUTER_API_KEY
  )
}

/** Lazy Anthropic accessor kept for rare direct callers; prefer executeAi / callAI. */
export const anthropic = {
  get messages() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured")
    }
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages
  },
} as Anthropic

export interface InsightExtraction {
  coreProblem: string
  solution: string
  audience: string
  whyMatters: string
  impact?: string
  themes?: string[]
}

export interface ContentDraft {
  title?: string
  content: string
  cta?: string
  whyThisContent?: string
}

// Product context for AI-generated content
export interface ProductContext {
  name: string
  type: string
  industry: string
  audience: string
  stage: string
  description?: string
  audienceDetail?: string  // Optional: "who exactly?" e.g. college students trying to lose weight
}

// Marketing strategy context
export interface StrategyContext {
  tone: {
    style: string
    examples: string[]
    avoid: string[]
  }
  platforms: {
    platform: string
    priority: string
    reasoning: string
  }[]
  proofTypes: string[]
  cadence: {
    frequency: string
    postsPerWeek: number
  }
  antiPatterns: {
    pattern: string
    reasoning: string
  }[]
}

/**
 * Maps user tier to model name for the active provider.
 */
export function getModelForTier(userTier: "standard" | "premium" = "standard"): string {
  if (!hasAnyAiProviderKey() && !process.env.OPENROUTER_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY, OPENAI_API_KEY, or OPENROUTER_API_KEY must be set")
  }
  return resolveTaskModel("content.generate", { premium: userTier === "premium" })
}

/**
 * Maps content type and user tier to model name via the central task registry.
 * Blog content always uses the premium model for maximum quality.
 */
function getModelForContent(
  contentType: "post" | "blog" | "carousel" | "thread" | "caption",
  userTier: "standard" | "premium" = "standard"
): string {
  if (!hasAnyAiProviderKey() && !process.env.OPENROUTER_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY, OPENAI_API_KEY, or OPENROUTER_API_KEY must be set")
  }
  return resolveTaskModel("content.generate", {
    premium: userTier === "premium",
    contentType,
  })
}

/**
 * Unified text generation via central AI orchestration adapters.
 * Prefer `executeAi({ task })` for new code.
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number
): Promise<string> {
  if (!hasAnyAiProviderKey() && !process.env.OPENROUTER_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY, OPENAI_API_KEY, or OPENROUTER_API_KEY must be set")
  }

  const provider = preferAnthropic()
    ? "anthropic"
    : preferOpenAI()
      ? "openai"
      : preferOpenRouter()
        ? "openrouter"
        : "anthropic"

  // If a legacy Anthropic snapshot id is passed, remap to current catalog defaults.
  const remappedModel =
    model.includes("claude-3-5-opus") || model.includes("claude-3-opus")
      ? MODEL_CATALOG.anthropic.premium()
      : model.includes("claude-3-5-sonnet") || model.includes("claude-3-sonnet")
        ? MODEL_CATALOG.anthropic.standard()
        : model.includes("claude-3-5-haiku") || model.includes("claude-3-haiku")
          ? MODEL_CATALOG.anthropic.fast()
          : model

  return completeText({
    system: systemPrompt,
    user: userPrompt,
    model: remappedModel,
    maxTokens,
    provider,
  })
}

/**
 * Core Insight Agent - Extracts structured insights from activity data
 * Now product-aware: considers product context when extracting insights
 */
export async function extractInsight(
  activityData: {
    title: string
    description?: string
    type: string
    humanInput?: {
      whatChanged?: string
      whoBenefited?: string
      whyMatters?: string
    }
  },
  brandVoice?: string,
  userTier: "standard" | "premium" = "standard",
  productContext?: ProductContext
): Promise<InsightExtraction> {
  const productGuidance = productContext ? `
PRODUCT CONTEXT (use this to frame insights appropriately):
- Product: ${productContext.name}
- Type: ${productContext.type}
- Industry: ${productContext.industry}
- Target Audience: ${productContext.audience}
${productContext.audienceDetail ? `- Specific target: ${productContext.audienceDetail}` : ""}
- Stage: ${productContext.stage}
${productContext.description ? `- Description: ${productContext.description}` : ""}

Frame the insight in a way that resonates with ${productContext.audience}. 
Consider the ${productContext.type} industry context when identifying themes.
` : ""

  const systemPrompt = `You are a Core Insight Agent for Varabhi. Your job is to extract meaningful, honest insights from real product activity.

Principles:
- Be honest and signal-based, never fabricate success
- Focus on problem → solution framing
- Identify who benefits and why it matters
- Extract themes that could resonate with the target audience
- Keep insights grounded in the actual activity
- Frame insights appropriately for the product's audience and industry

Output must be valid JSON matching this structure:
{
  "coreProblem": "What problem does this solve?",
  "solution": "How does this activity solve it?",
  "audience": "Who benefits from this?",
  "whyMatters": "Why is this significant?",
  "impact": "What's the potential or actual impact?",
  "themes": ["theme1", "theme2"]
}`

  const userPrompt = `Extract insights from this activity:

Title: ${activityData.title}
Type: ${activityData.type}
Description: ${activityData.description || "No description provided"}

${activityData.humanInput?.whatChanged ? `What changed: ${activityData.humanInput.whatChanged}` : ""}
${activityData.humanInput?.whoBenefited ? `Who benefited: ${activityData.humanInput.whoBenefited}` : ""}
${activityData.humanInput?.whyMatters ? `Why it matters: ${activityData.humanInput.whyMatters}` : ""}
${productGuidance}
${brandVoice ? `Brand voice preferences: ${brandVoice}` : ""}

Extract the core insight in JSON format.`

  const model = getModelForTier(userTier)
  
  const responseText = await callAI(systemPrompt, userPrompt, model, 2000)

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("No JSON found in AI response")
  }

  const insight = JSON.parse(jsonMatch[0]) as InsightExtraction
  return insight
}

export interface ContentGenerationOptions {
  intent?: string
  reason?: string
  context?: string
  /** Content Intelligence: who and how */
  audienceSegment?: "non_technical" | "technical"
  persona?: "founder_engineer" | "product_company"
  toneDepth?: string
  /** User feedback for regeneration: e.g. "less corporate", "more concrete" */
  feedback?: string
  /** Build in public: founder bio and product tech stack for richer context */
  founderBio?: string
  techStack?: string
}

/**
 * Content Translation Agent - Generates content drafts from insights
 * Now product-strategy-aware: uses marketing strategy to guide tone, style, and content
 */
export async function generateContent(
  insight: InsightExtraction,
  type: "post" | "blog" | "carousel" | "thread" | "caption",
  platform?: "linkedin" | "twitter" | "blog" | "facebook",
  brandVoice?: string,
  userTier: "standard" | "premium" = "standard",
  productContext?: ProductContext,
  strategyContext?: StrategyContext,
  options?: ContentGenerationOptions
): Promise<ContentDraft> {
  // Build strategy-aware guidance
  let strategyGuidance = ""
  if (strategyContext) {
    const toneGuidance = strategyContext.tone ? `
TONE & VOICE (from product strategy):
- Style: ${strategyContext.tone.style}
- Good examples: ${strategyContext.tone.examples?.join(", ") || "N/A"}
- AVOID: ${strategyContext.tone.avoid?.join(", ") || "N/A"}
` : ""

    const proofGuidance = strategyContext.proofTypes?.length ? `
PROOF TYPES TO USE: ${strategyContext.proofTypes.join(", ")}
` : ""

    const antiPatternGuidance = strategyContext.antiPatterns?.length ? `
ANTI-PATTERNS TO AVOID:
${strategyContext.antiPatterns.map(ap => `- ${ap.pattern}: ${ap.reasoning}`).join("\n")}
` : ""

    // Check if this platform is recommended
    const platformRec = platform ? strategyContext.platforms?.find(
      p => p.platform.toLowerCase() === platform.toLowerCase()
    ) : null
    
    const platformWarning = platformRec?.priority === "avoid" 
      ? `\nWARNING: ${platform} is NOT recommended for this product. Reason: ${platformRec.reasoning}. If proceeding anyway, be extra careful to adapt the content appropriately.`
      : ""

    strategyGuidance = `
${toneGuidance}
${proofGuidance}
${antiPatternGuidance}
${platformWarning}
`
  }

  // Build product context
  const productGuidance = productContext ? `
PRODUCT CONTEXT:
- Product: ${productContext.name}
- Type: ${productContext.type}
- Industry: ${productContext.industry}  
- Target Audience: ${productContext.audience}
${productContext.audienceDetail ? `- Specific target: ${productContext.audienceDetail}` : ""}
- Stage: ${productContext.stage}
${productContext.description ? `- Description: ${productContext.description}` : ""}
` : ""

  const audiencePersonaBlock =
    options?.audienceSegment || options?.persona || options?.toneDepth
      ? `
AUDIENCE & PERSONA (Content Intelligence – follow strictly):
${options.audienceSegment === "non_technical" ? `- Audience: NON-TECHNICAL (NGOs, event organizers, trainers, general users). Problem-focused, low patience for long text. Prefer clarity, simplicity, one clear benefit. Trust familiar channels; avoid jargon and technical depth.` : ""}
${options.audienceSegment === "technical" ? `- Audience: TECHNICAL (developers, engineers, founders). Skeptical, pattern-seeking. Include reasoning, trade-offs, lessons. Prefer text and depth; avoid marketing language and hype.` : ""}
${options.persona === "founder_engineer" ? `- Persona: FOUNDER/ENGINEER. Human, first-person, honest experiences. Mistakes, fixes, lessons. Product mentions are contextual, not salesy.` : ""}
${options.persona === "product_company" ? `- Persona: PRODUCT/COMPANY. Benefit-driven, trust-oriented, clear outcomes. Simple language, reliability and ease.` : ""}
${options.toneDepth ? `- Tone & depth: ${options.toneDepth}` : ""}
`
      : ""

  const systemPrompt = `You are a Content Translation Agent for Varabhi. Your job is to create authentic, audience-aware content from insights.

CORE PRINCIPLES:
- Write for the given audience segment (non-technical: simple, visual, one benefit; technical: reasoning, trade-offs, honest depth)
- Match the requested persona (founder/engineer vs product/company)
- Be honest and credible, avoid hype and generic corporate language
- Clarity over cleverness; trust over virality; intent over volume
- Match the product's marketing strategy when provided
- Include a clear, non-pushy CTA when appropriate

NEVER USE (sounds like generic AI/corporate filler):
- "Hello, fellow [audience]!" or similar greetings
- "We're committed to..." / "Transparency isn't just a buzzword" / "X and Y aren't just buzzwords for us"
- Long lists of abstract virtues; prefer one concrete example or one clear benefit
- Overly smooth, polished paragraphs; vary sentence length, use short punchy lines where it fits
- Generic sign-offs like "Let's build together" unless the post is explicitly about collaboration
Write like a human: specific, concrete, one clear idea per paragraph. If the insight mentions real details (e.g. "performance issues", "incremental optimization"), use those words—don't replace them with vague marketing speak.

CRITICAL: If a marketing strategy is provided, you MUST follow its tone, style, and anti-patterns. The strategy was specifically designed for this product.
${audiencePersonaBlock}

Content types:
- post: Medium-length social post (200-500 words)
- blog: Full blog post draft (800-1500 words)
- carousel: Carousel slide copy
- thread: Twitter/X thread format (multiple short posts)
- caption: Short caption (50-150 words)

Output must be valid JSON:
{
  "title": "Optional title",
  "content": "The main content",
  "cta": "Optional call-to-action",
  "whyThisContent": "One short sentence explaining why this content is suggested for this product and audience (e.g. 'This angle builds trust by showing real progress.')."
}`

  const platformGuidance: Record<string, string> = {
    linkedin: "Professional, thoughtful, value-driven. Can be longer form.",
    twitter: "Concise, punchy, engaging. 280 char limit per tweet, use threads for longer content.",
    blog: "In-depth, well-structured, SEO-friendly.",
    facebook: "Community-oriented, shareable, conversational. Mix of value and connection.",
    github: "Technical, precise, documentation-style.",
    hackernews: "Technical, substantive, no marketing speak.",
  }

  const oneLiner = insight.solution || insight.coreProblem
  const intentBlock = options?.intent || options?.reason || options?.context
    ? `
INTENT / REASON / CONTEXT (user-provided):
${options.intent ? `- Intent: ${options.intent}` : ""}
${options.reason ? `- Reason: ${options.reason}` : ""}
${options.context ? `- Context: ${options.context}` : ""}
`
    : ""
  const founderTechBlock =
    options?.founderBio || options?.techStack
      ? `
FOUNDER / BUILD IN PUBLIC (use where relevant; do not force):
${options.founderBio ? `- Founder bio: ${options.founderBio}` : ""}
${options.techStack ? `- Product tech stack: ${options.techStack}` : ""}
`
      : ""
  const feedbackBlock = options?.feedback
    ? `
USER FEEDBACK FOR THIS VERSION (apply strictly):
${options.feedback}
Revise the content to address this feedback while keeping the same insight and platform.
`
    : ""
  const userPrompt = `Generate ${type} content${platform ? ` for ${platform}` : ""} from this insight:
${feedbackBlock}
${audiencePersonaBlock}
${intentBlock}
${founderTechBlock}
INSIGHT:
- Problem: ${insight.coreProblem}
- Solution: ${insight.solution}
- Audience: ${insight.audience}
- Why it matters: ${insight.whyMatters}
${insight.impact ? `- Impact: ${insight.impact}` : ""}
${insight.themes ? `- Themes: ${insight.themes.join(", ")}` : ""}
${productContext ? `\nProduct: ${productContext.name}. Audience: ${productContext.audience}.${productContext.audienceDetail ? ` Specific target: ${productContext.audienceDetail}.` : ""} One-line angle: ${oneLiner}.` : ""}
${productGuidance}
${strategyGuidance}
${platform && platformGuidance[platform] ? `\nPLATFORM GUIDANCE: ${platformGuidance[platform]}` : ""}
${brandVoice ? `\nBRAND VOICE OVERRIDE: ${brandVoice}` : ""}

Generate the content in JSON format. Remember to follow the tone and anti-patterns from the marketing strategy. Include whyThisContent: one short sentence explaining why this content is suggested.`

  const model = getModelForContent(type, userTier)
  
  const responseText = await callAI(systemPrompt, userPrompt, model, 4000)

  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("No JSON found in AI response")
  }

  const draft = JSON.parse(jsonMatch[0]) as ContentDraft
  return draft
}
