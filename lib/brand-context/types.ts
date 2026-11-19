import type { AiTaskId } from "@/lib/ai/types"
import type { BrandFact, BrandProfileStatus, BrandVoice } from "@/lib/brand/types"

export type BrandIdentitySlice = {
  productId: string
  name: string
  type: string
  industry: string
  audience: string
  audienceDetail?: string
  stage: string
  salesMotion: string
  website?: string
}

export type ApprovedBrandSlice = {
  summary?: string
  facts: BrandFact[]
  voice?: BrandVoice
  approvedAt?: string
}

export type StrategySlice = {
  summary?: string
  platforms?: unknown
  tone?: { style?: string; examples?: string[]; avoid?: string[] }
  antiPatterns?: unknown
  proofTypes?: unknown
  cadence?: unknown
} | null

export type UntrustedBrandSlice = {
  description?: string
  competitors?: string
  founderBio?: string
  userBrandVoice?: string
  brief?: string
  /** Formatted tech stack note for content prompts (untrusted) */
  techStack?: string
}

export type AssembledBrandContext = {
  identity: BrandIdentitySlice
  approved: ApprovedBrandSlice
  strategy: StrategySlice
  untrusted: UntrustedBrandSlice
  meta: {
    profileStatus: BrandProfileStatus
    hasApprovedContext: boolean
    missingFields: string[]
    task: AiTaskId
  }
}

/** Legacy shapes used by existing content prompts */
export type LegacyProductContext = {
  name: string
  type: string
  industry: string
  audience: string
  stage: string
  description?: string
  audienceDetail?: string
}

export type LegacyStrategyContext = {
  tone: { style: string; examples: string[]; avoid: string[] }
  platforms: { platform: string; priority: string; reasoning: string }[]
  proofTypes: string[]
  cadence: { frequency: string; postsPerWeek: number }
  antiPatterns: { pattern: string; reasoning: string }[]
}
