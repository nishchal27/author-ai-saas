import Anthropic from "@anthropic-ai/sdk"

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set")
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
 * Determines which Claude model to use based on user tier
 * Premium tier uses Opus 4.5, Standard tier uses Sonnet 4.5
 */
function getModelForTier(userTier: "standard" | "premium" = "standard"): string {
  return userTier === "premium" 
    ? "claude-3-5-opus-20241022"
    : "claude-3-5-sonnet-20241022"
}

/**
 * Determines which Claude model to use based on content type and user tier
 * Blog content always uses Opus 4.5 for maximum quality
 * Premium tier uses Opus 4.5, Standard tier uses Sonnet 4.5 for other content
 */
function getModelForContent(
  contentType: "post" | "blog" | "carousel" | "thread" | "caption",
  userTier: "standard" | "premium" = "standard"
): string {
  // Blog content always uses Opus for maximum quality
  if (contentType === "blog") {
    return "claude-3-5-opus-20241022"
  }
  
  // Premium tier uses Opus, standard tier uses Sonnet
  return userTier === "premium"
    ? "claude-3-5-opus-20241022"
    : "claude-3-5-sonnet-20241022"
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
  
  const message = await anthropic.messages.create({
    model,
    max_tokens: 2000,
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
    throw new Error("Unexpected response type from Claude")
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("No JSON found in Claude response")
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
- For visual content, provide a visual prompt that describes what image would complement the text

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
  "visualPrompt": "Description of visual to generate (for carousels/images)"
}`

  const platformGuidance: Record<string, string> = {
    linkedin: "Professional, thoughtful, value-driven. Can be longer form.",
    twitter: "Concise, punchy, engaging. 280 char limit per tweet, use threads for longer content.",
    instagram: "Visual-first, engaging, authentic.",
    blog: "In-depth, well-structured, SEO-friendly.",
    github: "Technical, precise, documentation-style.",
    hackernews: "Technical, substantive, no marketing speak.",
  }

  const userPrompt = `Generate ${type} content${platform ? ` for ${platform}` : ""} from this insight:

INSIGHT:
- Problem: ${insight.coreProblem}
- Solution: ${insight.solution}
- Audience: ${insight.audience}
- Why it matters: ${insight.whyMatters}
${insight.impact ? `- Impact: ${insight.impact}` : ""}
${insight.themes ? `- Themes: ${insight.themes.join(", ")}` : ""}
${productGuidance}
${strategyGuidance}
${platform && platformGuidance[platform] ? `\nPLATFORM GUIDANCE: ${platformGuidance[platform]}` : ""}
${brandVoice ? `\nBRAND VOICE OVERRIDE: ${brandVoice}` : ""}

Generate the content in JSON format. Remember to follow the tone and anti-patterns from the marketing strategy.`

  const model = getModelForContent(type, userTier)
  
  const message = await anthropic.messages.create({
    model,
    max_tokens: 4000,
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
    throw new Error("Unexpected response type from Claude")
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("No JSON found in Claude response")
  }

  const draft = JSON.parse(jsonMatch[0]) as ContentDraft
  return draft
}
