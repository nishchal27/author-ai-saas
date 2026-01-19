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

/**
 * Core Insight Agent - Extracts structured insights from activity data
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
  brandVoice?: string
): Promise<InsightExtraction> {
  const systemPrompt = `You are a Core Insight Agent for Founder OS. Your job is to extract meaningful, honest insights from real product activity.

Principles:
- Be honest and signal-based, never fabricate success
- Focus on problem → solution framing
- Identify who benefits and why it matters
- Extract themes that could resonate with the target audience
- Keep insights grounded in the actual activity

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

${brandVoice ? `Brand voice preferences: ${brandVoice}` : ""}

Extract the core insight in JSON format.`

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
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
 */
export async function generateContent(
  insight: InsightExtraction,
  type: "post" | "blog" | "carousel" | "thread" | "caption",
  platform?: "linkedin" | "twitter" | "instagram" | "blog",
  brandVoice?: string
): Promise<ContentDraft> {
  const systemPrompt = `You are a Content Translation Agent for Founder OS. Your job is to create authentic, founder-style content from insights.

Principles:
- Write like a real founder, not a marketer
- Be honest and credible, avoid hype
- Focus on value and signal, not fluff
- Match the brand voice when provided
- Include a clear, non-pushy CTA when appropriate
- For visual content, provide a visual prompt that describes what image would complement the text

Content types:
- post: Medium-length social post (LinkedIn/Twitter style, 200-500 words)
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
    twitter: "Concise, punchy, engaging. Use threads for longer content.",
    instagram: "Visual-first, engaging, authentic. Include emojis sparingly.",
    blog: "In-depth, well-structured, SEO-friendly.",
  }

  const userPrompt = `Generate ${type} content${platform ? ` for ${platform}` : ""} from this insight:

Problem: ${insight.coreProblem}
Solution: ${insight.solution}
Audience: ${insight.audience}
Why it matters: ${insight.whyMatters}
${insight.impact ? `Impact: ${insight.impact}` : ""}
${insight.themes ? `Themes: ${insight.themes.join(", ")}` : ""}

${platform ? `Platform guidance: ${platformGuidance[platform]}` : ""}
${brandVoice ? `Brand voice: ${brandVoice}` : ""}

Generate the content in JSON format.`

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
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
