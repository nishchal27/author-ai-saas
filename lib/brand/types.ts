/** Brand Intelligence domain types for Varabhi */

export type BrandProfileStatus = "incomplete" | "proposed" | "approved"

export type BrandFact = {
  id: string
  text: string
  /** Optional category e.g. offering, audience, differentiator */
  category?: string
  source: "user" | "ai_proposed" | "ai_approved"
}

export type BrandVoice = {
  tone: string
  examples?: string[]
  personality?: string
}

export type BrandSummaryProposal = {
  businessDescription: string
  productsServices: string[]
  targetAudience: string
  positioning: string
  differentiators: string[]
  brandPersonality: string
  brandVoice: BrandVoice
  missingInformation: string[]
  suggestedImprovements: string[]
  /** Facts the model inferred — must stay unapproved until user accepts */
  proposedFacts: BrandFact[]
  /** Echo of user-supplied facts used as input (not invented) */
  userSuppliedFacts: BrandFact[]
}

export type ContentIdea = {
  id: string
  title: string
  concept: string
  platform: string
  pillar: string
  audience: string
  objective: string
  format: string
  explanation: string
}

export type ContentPillar = {
  id: string
  name: string
  description: string
  purpose?: string
}

export type IdeasBatch = {
  pillars: ContentPillar[]
  ideas: ContentIdea[]
}

/** Durable idea statuses (DB source of truth; brandIdeasJson is cache only) */
export type ContentIdeaStatus = "proposed" | "saved" | "rejected" | "converted"

export type BrandSuggestion = {
  id: string
  area: "profile" | "strategy" | "voice" | "audience" | "offerings" | "other"
  title: string
  suggestion: string
  rationale: string
  /** Never treat as a confirmed fact */
  isGuess: boolean
  status: "pending" | "accepted" | "rejected" | "edited"
}

export type SuggestionsBatch = {
  suggestions: BrandSuggestion[]
}
