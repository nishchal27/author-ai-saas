import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"

// Determine which API to use based on available keys
const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
const hasOpenAIKey = !!process.env.OPENAI_API_KEY

if (!hasAnthropicKey && !hasOpenAIKey) {
  throw new Error("Either ANTHROPIC_API_KEY or OPENAI_API_KEY must be set")
}

// Initialize clients
let anthropicClient: Anthropic | null = null
let openaiClient: OpenAI | null = null

if (hasAnthropicKey) {
  anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  })
}

if (hasOpenAIKey) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  })
}

// Determine which provider to use (prefer Anthropic if both are available)
const useAnthropic = hasAnthropicKey
const useOpenAI = !hasAnthropicKey && hasOpenAIKey

// Export the active client for backward compatibility (strategy.ts uses this)
export const anthropic = anthropicClient

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
  visualPrompt?: string
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
 * Maps user tier to model name for the active provider
 */
function getModelForTier(userTier: "standard" | "premium" = "standard"): string {
  if (useAnthropic) {
    return userTier === "premium" 
      ? "claude-3-5-opus-20241022"
      : "claude-3-5-sonnet-20241022"
  } else if (useOpenAI) {
    // Map to OpenAI models: premium = GPT-4 Turbo, standard = GPT-4o
    // gpt-4o is the latest and best model, using it for both tiers
    return "gpt-4o"
  }
  throw new Error("No AI provider available")
}

/**
 * Maps content type and user tier to model name
 * Blog content always uses the premium model for maximum quality
 */
function getModelForContent(
  contentType: "post" | "blog" | "carousel" | "thread" | "caption",
  userTier: "standard" | "premium" = "standard"
): string {
  if (useAnthropic) {
    // Blog content always uses Opus for maximum quality
    if (contentType === "blog") {
      return "claude-3-5-opus-20241022"
    }
    // Premium tier uses Opus, standard tier uses Sonnet
    return userTier === "premium"
      ? "claude-3-5-opus-20241022"
      : "claude-3-5-sonnet-20241022"
  } else if (useOpenAI) {
    // Blog content and premium tier use GPT-4o (best model)
    // Standard tier also uses GPT-4o (cost-effective and high quality)
    return "gpt-4o"
  }
  throw new Error("No AI provider available")
}

/**
 * Unified function to call either Anthropic or OpenAI
 * Exported for use in other modules like strategy.ts
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number
): Promise<string> {
  if (useAnthropic && anthropicClient) {
    const message = await anthropicClient.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from AI")
    }
    return content.text
  } else if (useOpenAI && openaiClient) {
    const completion = await openaiClient.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content in AI response")
    }
    return content
  }
  throw new Error("No AI provider available")
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

  const systemPrompt = `You are a Core Insight Agent for AuthorAI. Your job is to extract meaningful, honest insights from real product activity.

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
  platform?: "linkedin" | "twitter" | "instagram" | "blog" | "facebook",
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

  const systemPrompt = `You are a Content Translation Agent for AuthorAI. Your job is to create authentic, audience-aware content from insights.

CORE PRINCIPLES:
- Write for the given audience segment (non-technical: simple, visual, one benefit; technical: reasoning, trade-offs, honest depth)
- Match the requested persona (founder/engineer vs product/company)
- Be honest and credible, avoid hype and generic corporate language
- Clarity over cleverness; trust over virality; intent over volume
- Match the product's marketing strategy when provided
- Include a clear, non-pushy CTA when appropriate
- Only provide visualPrompt if a single image would materially reinforce the message for this audience (e.g. before/after, simple diagram, product screenshot concept). If the post works better as text-only, omit visualPrompt or set it to null. EXCEPTION: For Instagram you MUST always provide visualPrompt (image-centric platform); the caption is secondary to the visual. Never use generic metaphors (snails, cars, hourglasses) unless the angle is explicitly about speed or time.

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
- carousel: Carousel slide copy with visual prompt
- thread: Twitter/X thread format (multiple short posts)
- caption: Short caption (50-150 words)

Output must be valid JSON:
{
  "title": "Optional title",
  "content": "The main content",
  "cta": "Optional call-to-action",
  "visualPrompt": "Optional. Only if an image would materially reinforce the message; otherwise null. For Instagram this is REQUIRED—always provide a strong image/carousel concept.",
  "whyThisContent": "One short sentence explaining why this content is suggested for this product and audience (e.g. 'This angle builds trust by showing real progress.')."
}`

  const platformGuidance: Record<string, string> = {
    linkedin: "Professional, thoughtful, value-driven. Can be longer form.",
    twitter: "Concise, punchy, engaging. 280 char limit per tweet, use threads for longer content.",
    instagram:
      "Instagram is IMAGE-CENTRIC. The primary output is a strong VISUAL CONCEPT (image or carousel). You MUST provide visualPrompt—never null for Instagram. The main content is a SHORT caption (50–150 words); the caption supports the visual, the visual is the hero. Punchy, scannable, authentic; no long paragraphs.",
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
${platform === "instagram" ? `\nINSTAGRAM: You MUST output a non-null visualPrompt (strong image or carousel concept). Keep content as a short caption (50–150 words).` : ""}
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

export interface ImageSuggestion {
  id: string
  label: string
  prompt: string
}

/**
 * Generate 3–5 image concept suggestions for a content draft.
 * Uses draft content + product context + strategy visual style.
 */
export async function generateImageSuggestions(
  draftContent: string,
  draftTitle?: string,
  productContext?: ProductContext,
  visualStyle?: string
): Promise<ImageSuggestion[]> {
  const systemPrompt = `You are an image concept advisor for AuthorAI. Given a piece of content (post, blog, etc.), suggest 3–5 distinct image concepts that would reinforce the message. Each concept should have:
- label: short human-readable name (e.g. "Before/after", "Product in use", "Data snapshot")
- prompt: a concise DALL·E–style image description (1–2 sentences, no text overlays, professional and minimal)

Output valid JSON only: an array of objects with "id", "label", "prompt". Use id like "1", "2", "3", etc.`

  const productPart = productContext
    ? `Product: ${productContext.name}. Audience: ${productContext.audience}.${productContext.audienceDetail ? ` Target: ${productContext.audienceDetail}.` : ""}`
    : ""
  const stylePart = visualStyle ? `Visual style to match: ${visualStyle}.` : ""
  const userPrompt = `Content${draftTitle ? ` (title: ${draftTitle})` : ""}:
---
${draftContent.slice(0, 2000)}
---
${productPart}
${stylePart}

Return a JSON array of 3–5 image suggestions: [{"id":"1","label":"...","prompt":"..."}, ...]`

  const model = getModelForTier("standard")
  const responseText = await callAI(systemPrompt, userPrompt, model, 1500)

  const arrayMatch = responseText.match(/\[[\s\S]*\]/)
  if (!arrayMatch) {
    throw new Error("No JSON array found in AI response")
  }
  const raw = JSON.parse(arrayMatch[0]) as { id?: string; label?: string; prompt?: string }[]
  return (Array.isArray(raw) ? raw : []).slice(0, 5).map((item, i) => ({
    id: String(item?.id ?? i + 1),
    label: String(item?.label ?? "Concept " + (i + 1)),
    prompt: String(item?.prompt ?? "").trim() || "Professional, minimal image matching the content",
  }))
}
