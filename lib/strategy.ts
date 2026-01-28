/**
 * Strategy Decision Engine
 * 
 * This is the heart of AuthorAI - the layer that decides marketing strategy
 * based on the PRODUCT, not user preferences.
 * 
 * Core principle: The product profile dictates strategy.
 * Not the founder. Not the user personality. Not the AI.
 * 
 * Architecture:
 * 1. Rules + heuristics come first (deterministic)
 * 2. AI refines and generates human-readable explanations
 * 3. Output is opinionated, conservative, and explainable
 */

import { callAI } from "./claude"

// ============================================
// PRODUCT PROFILE TYPES
// ============================================

export type ProductType = 
  | "saas"           // B2B SaaS
  | "course"         // Online Course / Education
  | "coaching"       // Coaching / Consulting
  | "physical"       // Physical Consumer Product
  | "event"          // Event / Workshop
  | "api"            // API / Infrastructure
  | "service"        // Service Business
  | "ngo"            // NGO / Non-profit

export type AudienceType =
  | "developers"     // Technical developers
  | "smb_owners"     // Small business owners
  | "consumers"      // General consumers
  | "professionals"  // Working professionals
  | "learners"       // Career switchers / learners
  | "enterprise"     // Enterprise / IT teams
  | "creators"       // Content creators

export type ProductStage =
  | "idea"           // Just an idea
  | "building"       // In development
  | "launched"       // Recently launched
  | "growing"        // Active growth phase
  | "mature"         // Established product

export type SalesMotion =
  | "self_serve"     // Self-service signup
  | "demo"           // Demo → subscription
  | "creator_led"    // Personal brand driven
  | "enterprise"     // Sales team / enterprise
  | "impulse"        // Impulse purchase

export interface ProductProfile {
  name: string
  type: ProductType
  industry: string
  audience: AudienceType
  stage: ProductStage
  salesMotion: SalesMotion
  description?: string
  website?: string
  competitors?: string
}

// ============================================
// STRATEGY OUTPUT TYPES
// ============================================

export interface PlatformRecommendation {
  platform: string
  priority: "primary" | "secondary" | "avoid"
  reasoning: string
}

export interface ContentTypeRecommendation {
  type: string
  recommended: boolean
  reasoning: string
}

export interface ToneRecommendation {
  style: string
  examples: string[]
  avoid: string[]
}

export interface CadenceRecommendation {
  frequency: string
  postsPerWeek: number
  reasoning: string
}

export interface AntiPattern {
  pattern: string
  reasoning: string
}

export interface MarketingStrategyOutput {
  platforms: PlatformRecommendation[]
  contentTypes: ContentTypeRecommendation[]
  tone: ToneRecommendation
  visualStyle: {
    style: string
    examples: string[]
  }
  cadence: CadenceRecommendation
  proofTypes: string[]
  antiPatterns: AntiPattern[]
  summary: string
  reasoning: string
  confidence: number
}

// ============================================
// STRATEGY PATTERN LIBRARY
// Encoded from the 10 product profiles in docs/very-important.mdx
// These are the baseline heuristics - AI refines them
// ============================================

const STRATEGY_PATTERNS: Record<ProductType, Partial<MarketingStrategyOutput>> = {
  saas: {
    // Will be refined by audience (developers vs SMB)
    platforms: [
      { platform: "linkedin", priority: "primary", reasoning: "B2B professionals discover solutions here" },
      { platform: "twitter", priority: "secondary", reasoning: "Industry conversations and thought leadership" },
    ],
    contentTypes: [
      { type: "post", recommended: true, reasoning: "Regular updates build visibility" },
      { type: "blog", recommended: true, reasoning: "In-depth content builds authority" },
      { type: "thread", recommended: true, reasoning: "Break down complex topics" },
    ],
    cadence: { frequency: "2-3 posts per week", postsPerWeek: 2, reasoning: "Consistent but not overwhelming" },
  },
  
  course: {
    platforms: [
      { platform: "youtube", priority: "primary", reasoning: "Teaching content performs best as video" },
      { platform: "twitter", priority: "primary", reasoning: "Mini-lessons and threads build following" },
      { platform: "linkedin", priority: "secondary", reasoning: "Career-focused learners are here" },
      { platform: "instagram", priority: "avoid", reasoning: "Not ideal for educational content" },
    ],
    contentTypes: [
      { type: "thread", recommended: true, reasoning: "Teaching threads show expertise" },
      { type: "blog", recommended: true, reasoning: "In-depth lessons establish authority" },
      { type: "carousel", recommended: true, reasoning: "Visual summaries work well" },
    ],
    tone: {
      style: "Educational, generous",
      examples: ["Here's how X works...", "I learned this the hard way..."],
      avoid: ["Corporate language", "Aggressive CTAs", "Sales-y tone"],
    },
    cadence: { frequency: "3-5 short pieces per week", postsPerWeek: 4, reasoning: "Authority is built by teaching, not selling" },
    antiPatterns: [
      { pattern: "Corporate language", reasoning: "Education requires approachability" },
      { pattern: "Aggressive CTAs", reasoning: "Teaching builds trust, not pressure" },
    ],
  },
  
  coaching: {
    platforms: [
      { platform: "linkedin", priority: "primary", reasoning: "Professional audience, trust-building platform" },
      { platform: "twitter", priority: "secondary", reasoning: "Thought leadership and insights" },
      { platform: "instagram", priority: "avoid", reasoning: "Too casual for professional services" },
      { platform: "tiktok", priority: "avoid", reasoning: "Wrong audience and format" },
    ],
    contentTypes: [
      { type: "post", recommended: true, reasoning: "Opinionated insights build authority" },
      { type: "blog", recommended: true, reasoning: "Deep dives show expertise" },
      { type: "thread", recommended: false, reasoning: "Better for quick insights" },
    ],
    tone: {
      style: "Confident, reflective",
      examples: ["What I've learned from 10 years of...", "The uncomfortable truth about..."],
      avoid: ["Generic tips", "AI-written fluff", "Motivational clichés"],
    },
    cadence: { frequency: "2-3 posts per week", postsPerWeek: 2, reasoning: "People buy the person, not the process" },
    proofTypes: ["Lived experience", "Frameworks", "Client transformations"],
    antiPatterns: [
      { pattern: "Generic tips", reasoning: "Undifferentiated from thousands of others" },
      { pattern: "AI-written fluff", reasoning: "Destroys the personal connection that drives sales" },
    ],
  },
  
  physical: {
    platforms: [
      { platform: "instagram", priority: "primary", reasoning: "Visual products need visual platforms" },
      { platform: "tiktok", priority: "primary", reasoning: "Short-form video drives discovery" },
      { platform: "linkedin", priority: "avoid", reasoning: "Wrong audience and format" },
    ],
    contentTypes: [
      { type: "post", recommended: true, reasoning: "Lifestyle imagery" },
      { type: "carousel", recommended: true, reasoning: "Product showcases" },
      { type: "caption", recommended: true, reasoning: "Short, punchy captions" },
      { type: "blog", recommended: false, reasoning: "Too long-form for impulse products" },
    ],
    tone: {
      style: "Visual, emotional",
      examples: ["The feeling when...", "Made for moments like..."],
      avoid: ["Long text explanations", "Technical details", "B2B language"],
    },
    cadence: { frequency: "Daily short-form", postsPerWeek: 7, reasoning: "Visual desire drives conversion" },
    proofTypes: ["Social proof", "UGC", "Lifestyle imagery"],
    antiPatterns: [
      { pattern: "Long text explanations", reasoning: "Visual products sell on desire, not logic" },
      { pattern: "LinkedIn presence", reasoning: "Wrong platform, wrong audience" },
    ],
  },
  
  event: {
    platforms: [
      { platform: "linkedin", priority: "primary", reasoning: "Professional events need professional reach" },
      { platform: "email", priority: "primary", reasoning: "Direct communication for registrations" },
      { platform: "twitter", priority: "secondary", reasoning: "Event buzz and updates" },
    ],
    contentTypes: [
      { type: "post", recommended: true, reasoning: "Speaker highlights, agenda updates" },
      { type: "carousel", recommended: true, reasoning: "Event posters, schedules" },
      { type: "thread", recommended: false, reasoning: "Events sell on urgency, not threads" },
    ],
    tone: {
      style: "Urgent, informative",
      examples: ["Only 20 seats left...", "Confirmed: [Speaker] will be sharing..."],
      avoid: ["Evergreen content", "Vague positioning"],
    },
    cadence: { frequency: "Increasing toward event date", postsPerWeek: 3, reasoning: "Events sell on timing + authority" },
    proofTypes: ["Speaker credibility", "Limited seats", "Past event photos"],
    antiPatterns: [
      { pattern: "Evergreen content", reasoning: "Events have deadlines, content should too" },
      { pattern: "Vague positioning", reasoning: "Must be clear who this is for" },
    ],
  },
  
  api: {
    platforms: [
      { platform: "github", priority: "primary", reasoning: "Engineers discover tools where they work" },
      { platform: "hackernews", priority: "primary", reasoning: "Technical community discovery" },
      { platform: "twitter", priority: "secondary", reasoning: "Dev community engagement" },
      { platform: "linkedin", priority: "avoid", reasoning: "Too sales-focused for infra products" },
      { platform: "instagram", priority: "avoid", reasoning: "Completely wrong audience" },
    ],
    contentTypes: [
      { type: "blog", recommended: true, reasoning: "Technical deep dives" },
      { type: "thread", recommended: true, reasoning: "Technical breakdowns" },
      { type: "post", recommended: false, reasoning: "Short posts lack technical depth" },
    ],
    tone: {
      style: "Precise, transparent",
      examples: ["How we reduced latency by 40%...", "The architecture behind..."],
      avoid: ["Sales copy", "Emotional storytelling", "Marketing speak"],
    },
    cadence: { frequency: "Low but consistent", postsPerWeek: 1, reasoning: "Engineers adopt tools they understand" },
    proofTypes: ["Reliability", "Benchmarks", "Architecture diagrams", "Documentation"],
    antiPatterns: [
      { pattern: "Sales copy", reasoning: "Engineers distrust marketing speak" },
      { pattern: "Emotional storytelling", reasoning: "Technical products need technical proof" },
    ],
  },
  
  service: {
    platforms: [
      { platform: "linkedin", priority: "primary", reasoning: "Professional services need professional presence" },
      { platform: "email", priority: "primary", reasoning: "Direct relationship building" },
    ],
    contentTypes: [
      { type: "post", recommended: true, reasoning: "Thought leadership and case studies" },
      { type: "blog", recommended: true, reasoning: "Deep expertise content" },
    ],
    tone: {
      style: "Practical, outcome-focused",
      examples: ["How we helped [client] achieve...", "The process behind..."],
      avoid: ["Feature dumps", "Generic service descriptions"],
    },
    cadence: { frequency: "1-2 posts per week", postsPerWeek: 2, reasoning: "Quality over quantity" },
    proofTypes: ["Case studies", "Before/after stories", "Client testimonials"],
  },
  
  ngo: {
    platforms: [
      { platform: "email", priority: "primary", reasoning: "Direct connection with donors" },
      { platform: "facebook", priority: "primary", reasoning: "Community building and sharing" },
      { platform: "linkedin", priority: "secondary", reasoning: "Corporate partnerships" },
    ],
    contentTypes: [
      { type: "post", recommended: true, reasoning: "Impact stories and updates" },
      { type: "blog", recommended: true, reasoning: "Transparency reports" },
    ],
    tone: {
      style: "Human, sincere",
      examples: ["Meet [person] whose life changed...", "This month, we..."],
      avoid: ["Growth hacking", "Over-automation", "Sales language"],
    },
    cadence: { frequency: "Monthly", postsPerWeek: 1, reasoning: "Trust > optimization" },
    proofTypes: ["Real-world impact", "Photos", "Transparency"],
    antiPatterns: [
      { pattern: "Growth hacking", reasoning: "Donors want impact, not growth metrics" },
      { pattern: "Over-automation", reasoning: "Personal connection is everything" },
    ],
  },
}

// ============================================
// AUDIENCE-SPECIFIC REFINEMENTS
// ============================================

function refineForAudience(
  baseStrategy: Partial<MarketingStrategyOutput>,
  audience: AudienceType,
  productType: ProductType
): Partial<MarketingStrategyOutput> {
  const refined = { ...baseStrategy }
  
  // Developers have specific needs
  if (audience === "developers") {
    refined.platforms = [
      { platform: "twitter", priority: "primary", reasoning: "Dev community lives here" },
      { platform: "github", priority: "primary", reasoning: "Build in public, show the work" },
      { platform: "hackernews", priority: "secondary", reasoning: "Technical discovery" },
      { platform: "linkedin", priority: "avoid", reasoning: "Developers trust competence, not sales posts" },
      { platform: "instagram", priority: "avoid", reasoning: "Wrong platform entirely" },
    ]
    refined.tone = {
      style: "Honest, technical, low-hype",
      examples: ["Built this because...", "Here's how the architecture works..."],
      avoid: ["Motivational content", "Sales posts", "Hype language"],
    }
    refined.proofTypes = ["Benchmarks", "Real usage examples", "Code snippets"]
    refined.antiPatterns = [
      ...(refined.antiPatterns || []),
      { pattern: "LinkedIn sales posts", reasoning: "Developers trust competence, not persuasion" },
      { pattern: "Motivational content", reasoning: "Technical audience wants technical substance" },
    ]
  }
  
  // SMB owners care about outcomes
  if (audience === "smb_owners") {
    refined.platforms = [
      { platform: "linkedin", priority: "primary", reasoning: "Business owners network here" },
      { platform: "email", priority: "primary", reasoning: "Direct communication builds trust" },
      { platform: "twitter", priority: "secondary", reasoning: "Industry conversations" },
    ]
    refined.tone = {
      style: "Practical, outcome-focused",
      examples: ["Saved 10 hours/week by...", "Before vs After..."],
      avoid: ["Technical explanations", "Feature dumps"],
    }
    refined.proofTypes = ["Time saved", "Money saved", "Case studies"]
    refined.antiPatterns = [
      ...(refined.antiPatterns || []),
      { pattern: "Technical explanations", reasoning: "SMB owners buy relief, not tools" },
      { pattern: "Feature dumps", reasoning: "Focus on outcomes, not features" },
    ]
  }
  
  // Enterprise has different dynamics
  if (audience === "enterprise") {
    refined.platforms = [
      { platform: "internal_docs", priority: "primary", reasoning: "Enterprise adoption is internal" },
      { platform: "email", priority: "primary", reasoning: "Direct stakeholder communication" },
      { platform: "linkedin", priority: "secondary", reasoning: "Professional visibility" },
    ]
    refined.tone = {
      style: "Clear, conservative",
      examples: ["ROI analysis shows...", "Compliance with..."],
      avoid: ["Social media fluff", "Branding content"],
    }
    refined.proofTypes = ["Reduced risk", "Compliance", "Stability"]
    refined.antiPatterns = [
      ...(refined.antiPatterns || []),
      { pattern: "Social media presence", reasoning: "This is change management, not marketing" },
      { pattern: "Branding fluff", reasoning: "Enterprise buyers need ROI, not vibes" },
    ]
  }
  
  return refined
}

// ============================================
// AI STRATEGY GENERATION
// ============================================

export async function generateMarketingStrategy(
  product: ProductProfile,
  tier: string = "standard"
): Promise<MarketingStrategyOutput> {
  // Step 1: Get base pattern from heuristics
  const basePattern = STRATEGY_PATTERNS[product.type] || STRATEGY_PATTERNS.saas
  
  // Step 2: Refine based on audience
  const refinedPattern = refineForAudience(basePattern, product.audience, product.type)
  
  // Step 3: Use AI to generate human-readable explanations and fill gaps
  // Determine model based on available provider
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY
  const useAnthropic = hasAnthropicKey
  const useOpenAI = !hasAnthropicKey && hasOpenAIKey
  
  const model = useAnthropic
    ? (tier === "premium" ? "claude-3-5-opus-20241022" : "claude-3-5-sonnet-20241022")
    : useOpenAI
    ? "gpt-4o" // Using gpt-4o for both tiers (best and cost-effective)
    : "gpt-4o" // fallback
  
  const systemPrompt = `You are a strategic marketing advisor for B2B founders. 
Your role is to provide opinionated, conservative, and explainable marketing recommendations.

Core principles:
1. The PRODUCT determines strategy, not user preferences
2. Be opinionated - tell founders what TO do and what NOT to do
3. Reduce decision fatigue - give clear, actionable guidance
4. Explain your reasoning in simple language
5. Be conservative - it's better to do fewer things well

You will receive:
- A product profile
- Base strategy recommendations from our pattern library

Your job is to:
1. Validate and refine the base recommendations
2. Add any missing context specific to this product
3. Generate a clear summary and reasoning
4. Return a complete strategy object

IMPORTANT: Your recommendations should feel opinionated and trustworthy, not generic.
The founder should feel "this tool understands my product better than I expected."`

  const userPrompt = `Product Profile:
- Name: ${product.name}
- Type: ${product.type}
- Industry: ${product.industry}
- Audience: ${product.audience}
- Stage: ${product.stage}
- Sales Motion: ${product.salesMotion}
${product.description ? `- Description: ${product.description}` : ""}
${product.website ? `- Website: ${product.website}` : ""}
${product.competitors ? `- Competitors: ${product.competitors}` : ""}

Base Strategy Pattern (from our pattern library):
${JSON.stringify(refinedPattern, null, 2)}

Generate a complete marketing strategy that:
1. Validates the base recommendations for this specific product
2. Adds industry-specific nuances
3. Provides clear, human-readable reasoning
4. Includes confidence level (0.0-1.0)

Return ONLY valid JSON matching this structure:
{
  "platforms": [{ "platform": "string", "priority": "primary|secondary|avoid", "reasoning": "string" }],
  "contentTypes": [{ "type": "string", "recommended": boolean, "reasoning": "string" }],
  "tone": { "style": "string", "examples": ["string"], "avoid": ["string"] },
  "visualStyle": { "style": "string", "examples": ["string"] },
  "cadence": { "frequency": "string", "postsPerWeek": number, "reasoning": "string" },
  "proofTypes": ["string"],
  "antiPatterns": [{ "pattern": "string", "reasoning": "string" }],
  "summary": "2-3 sentence strategy summary that starts with 'Because you are building...'",
  "reasoning": "Detailed paragraph explaining why these recommendations fit this product",
  "confidence": 0.8
}`

  try {
    const responseText = await callAI(systemPrompt, userPrompt, model, 3000)

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }

    const strategy = JSON.parse(jsonMatch[0]) as MarketingStrategyOutput
    
    // Ensure summary starts with the magic phrase
    if (!strategy.summary.toLowerCase().startsWith("because you are building")) {
      strategy.summary = `Because you are building ${product.name}, ${strategy.summary}`
    }
    
    return strategy
  } catch (error) {
    console.error("Strategy generation error:", error)
    
    // Fallback to base pattern with default values
    return {
      platforms: refinedPattern.platforms || [
        { platform: "linkedin", priority: "primary", reasoning: "Default recommendation" }
      ],
      contentTypes: refinedPattern.contentTypes || [
        { type: "post", recommended: true, reasoning: "Standard content type" }
      ],
      tone: refinedPattern.tone || {
        style: "Professional and clear",
        examples: ["Clear, value-focused content"],
        avoid: ["Generic marketing speak"]
      },
      visualStyle: {
        style: "Clean and professional",
        examples: ["Minimalist design", "Brand colors"]
      },
      cadence: refinedPattern.cadence || {
        frequency: "2-3 posts per week",
        postsPerWeek: 2,
        reasoning: "Consistent but sustainable"
      },
      proofTypes: refinedPattern.proofTypes || ["Case studies", "Results"],
      antiPatterns: refinedPattern.antiPatterns || [],
      summary: `Because you are building ${product.name}, we recommend a focused approach on LinkedIn with professional, outcome-focused content.`,
      reasoning: "Based on the product profile, these recommendations align with typical patterns for this type of product and audience.",
      confidence: 0.6
    }
  }
}

// ============================================
// STRATEGY EXPLANATION GENERATOR
// For displaying to users in a friendly way
// ============================================

export function formatStrategyForDisplay(strategy: MarketingStrategyOutput): {
  headline: string
  platforms: { name: string; status: "use" | "avoid"; reason: string }[]
  keyActions: string[]
  dontDo: string[]
} {
  const primaryPlatforms = strategy.platforms
    .filter(p => p.priority === "primary")
    .map(p => p.platform)
  
  return {
    headline: strategy.summary,
    platforms: strategy.platforms.map(p => ({
      name: p.platform,
      status: p.priority === "avoid" ? "avoid" : "use",
      reason: p.reasoning
    })),
    keyActions: [
      `Post ${strategy.cadence.frequency}`,
      `Focus on ${strategy.tone.style.toLowerCase()} content`,
      ...strategy.proofTypes.slice(0, 2).map(p => `Use ${p.toLowerCase()} as proof`),
      ...primaryPlatforms.slice(0, 2).map(p => `Prioritize ${p}`),
    ],
    dontDo: strategy.antiPatterns.map(a => a.pattern)
  }
}
