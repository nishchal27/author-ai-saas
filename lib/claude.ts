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

/**
 * Content Translation Agent - Generates content drafts from insights
 * Now product-strategy-aware: uses marketing strategy to guide tone, style, and content
 */
export async function generateContent(
  insight: InsightExtraction,
  type: "post" | "blog" | "carousel" | "thread" | "caption",
  platform?: "linkedin" | "twitter" | "instagram" | "blog",
  brandVoice?: string,
  userTier: "standard" | "premium" = "standard",
  productContext?: ProductContext,
  strategyContext?: StrategyContext
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

  const systemPrompt = `You are a Content Translation Agent for AuthorAI. Your job is to create authentic, founder-style content from insights.

CORE PRINCIPLES:
- Write like a real founder, not a marketer
- Be honest and credible, avoid hype
- Focus on value and signal, not fluff
- Match the product's marketing strategy when provided
- Include a clear, non-pushy CTA when appropriate
- Only provide visualPrompt if a single image would materially reinforce the message for this audience (e.g. before/after, simple diagram, product screenshot concept). If the post works better as text-only, omit visualPrompt or set it to null. Never use generic metaphors (snails, cars, hourglasses) unless the angle is explicitly about speed or time.

CRITICAL: If a marketing strategy is provided, you MUST follow its tone, style, and anti-patterns. The strategy was specifically designed for this product.

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
  "visualPrompt": "Optional. Only if an image would materially reinforce the message; otherwise null."
}`

  const platformGuidance: Record<string, string> = {
    linkedin: "Professional, thoughtful, value-driven. Can be longer form.",
    twitter: "Concise, punchy, engaging. 280 char limit per tweet, use threads for longer content.",
    instagram: "Visual-first, engaging, authentic.",
    blog: "In-depth, well-structured, SEO-friendly.",
    github: "Technical, precise, documentation-style.",
    hackernews: "Technical, substantive, no marketing speak.",
  }

  const oneLiner = insight.solution || insight.coreProblem
  const userPrompt = `Generate ${type} content${platform ? ` for ${platform}` : ""} from this insight:

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

Generate the content in JSON format. Remember to follow the tone and anti-patterns from the marketing strategy.`

  const model = getModelForContent(type, userTier)
  
  const responseText = await callAI(systemPrompt, userPrompt, model, 4000)

  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("No JSON found in AI response")
  }

  const draft = JSON.parse(jsonMatch[0]) as ContentDraft
  return draft
}
