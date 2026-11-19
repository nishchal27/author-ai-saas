import { z } from "zod"

export const brandFactSchema = z.object({
  id: z.string().min(1).optional().default("pending"),
  text: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
  source: z.enum(["user", "ai_proposed", "ai_approved"]).optional().default("ai_proposed"),
})

export const brandVoiceSchema = z.object({
  tone: z.string().min(1).max(500),
  examples: z.array(z.string().max(300)).max(8).optional(),
  personality: z.string().max(500).optional(),
})

export const brandSummarizeSchema = z.object({
  businessDescription: z.string().min(1).max(2000),
  productsServices: z.array(z.string().min(1).max(300)).max(20),
  targetAudience: z.string().min(1).max(1000),
  positioning: z.string().min(1).max(1000),
  differentiators: z.array(z.string().min(1).max(300)).max(15),
  brandPersonality: z.string().min(1).max(500),
  brandVoice: brandVoiceSchema,
  missingInformation: z.array(z.string().min(1).max(300)).max(20),
  suggestedImprovements: z.array(z.string().min(1).max(400)).max(15),
  proposedFacts: z.array(brandFactSchema).max(30),
  userSuppliedFacts: z.array(brandFactSchema).max(30),
})

export type BrandSummarizeOutput = z.infer<typeof brandSummarizeSchema>
export const BRAND_SUMMARIZE_SCHEMA_VERSION = "brand.summarize.v1"

export const contentPillarSchema = z.object({
  id: z.string().min(1).optional().default("pending"),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
})

export const contentIdeaSchema = z.object({
  id: z.string().min(1).optional().default("pending"),
  title: z.string().min(1).max(200),
  concept: z.string().min(1).max(1000),
  platform: z.string().min(1).max(50),
  pillar: z.string().min(1).max(120),
  audience: z.string().min(1).max(300),
  objective: z.string().min(1).max(300),
  format: z.string().min(1).max(80),
  explanation: z.string().min(1).max(600),
})

export const ideasGenerateSchema = z.object({
  pillars: z.array(contentPillarSchema).min(3).max(5),
  ideas: z.array(contentIdeaSchema).min(3).max(8),
})

export type IdeasGenerateOutput = z.infer<typeof ideasGenerateSchema>
export const IDEAS_GENERATE_SCHEMA_VERSION = "ideas.generate.v1"

export const brandSuggestionSchema = z.object({
  id: z.string().min(1).optional().default("pending"),
  area: z.enum(["profile", "strategy", "voice", "audience", "offerings", "other"]),
  title: z.string().min(1).max(160),
  suggestion: z.string().min(1).max(800),
  rationale: z.string().min(1).max(800),
  isGuess: z.boolean(),
  status: z.enum(["pending", "accepted", "rejected", "edited"]).default("pending"),
})

export const suggestionsGenerateSchema = z.object({
  suggestions: z.array(brandSuggestionSchema).min(2).max(8),
})

export type SuggestionsGenerateOutput = z.infer<typeof suggestionsGenerateSchema>
export const SUGGESTIONS_GENERATE_SCHEMA_VERSION = "suggestions.generate.v1"
