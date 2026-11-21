import { db } from "@/lib/db"
import type { AiTaskId } from "@/lib/ai/types"
import type { BrandFact, BrandProfileStatus, BrandVoice } from "@/lib/brand/types"
import type {
  AssembledBrandContext,
  LegacyProductContext,
  LegacyStrategyContext,
} from "@/lib/brand-context/types"

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Proposed facts may be a bare array or a Phase 2 wrapped proposal payload. */
export function parseProposedFactsPayload(raw: string | null | undefined): {
  facts: BrandFact[]
  proposal?: unknown
  userSuppliedFacts?: BrandFact[]
  promptVersion?: string
  schemaVersion?: string
  voice?: BrandVoice
} {
  if (!raw) return { facts: [] }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return { facts: parsed.filter((f: BrandFact) => f?.text) }
    }
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { facts?: unknown }).facts)) {
      const wrap = parsed as {
        facts: BrandFact[]
        proposal?: unknown
        userSuppliedFacts?: BrandFact[]
        promptVersion?: string
        schemaVersion?: string
        voice?: BrandVoice
      }
      const proposalVoice =
        wrap.voice ||
        (wrap.proposal &&
        typeof wrap.proposal === "object" &&
        wrap.proposal !== null &&
        "brandVoice" in wrap.proposal
          ? ((wrap.proposal as { brandVoice?: BrandVoice }).brandVoice)
          : undefined)
      return {
        facts: wrap.facts.filter((f) => f?.text),
        proposal: wrap.proposal,
        userSuppliedFacts: Array.isArray(wrap.userSuppliedFacts)
          ? wrap.userSuppliedFacts.filter((f) => f?.text)
          : undefined,
        promptVersion: wrap.promptVersion,
        schemaVersion: wrap.schemaVersion,
        voice: proposalVoice,
      }
    }
  } catch {
    // ignore
  }
  return { facts: [] }
}

function parseFacts(raw: string | null | undefined): BrandFact[] {
  const parsed = parseJson<BrandFact[]>(raw, [])
  if (Array.isArray(parsed)) return parsed.filter((f) => f?.text)
  // Approved column must stay a plain array; tolerate wrapped shape defensively
  return parseProposedFactsPayload(raw).facts
}

function formatTechStack(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  try {
    const arr = JSON.parse(raw) as { name: string; version?: string; note?: string }[]
    if (!Array.isArray(arr) || !arr.length) return undefined
    return arr
      .map((t) => [t.name, t.version, t.note].filter(Boolean).join(" — "))
      .join("; ")
  } catch {
    return undefined
  }
}

function parseVoice(raw: string | null | undefined): BrandVoice | undefined {
  if (!raw) return undefined
  try {
    const v = JSON.parse(raw) as BrandVoice | { tone?: string }
    if (v && typeof (v as BrandVoice).tone === "string") {
      return v as BrandVoice
    }
  } catch {
    // plain string tone from older settings
    return { tone: raw }
  }
  return undefined
}

function missingFields(product: {
  description: string | null
  audienceDetail: string | null
  brandSummaryApproved: string | null
  brandFactsApproved: string | null
  website: string | null
}): string[] {
  const missing: string[] = []
  if (!product.description) missing.push("description")
  if (!product.audienceDetail) missing.push("audienceDetail")
  if (!product.brandSummaryApproved) missing.push("approvedSummary")
  if (!parseFacts(product.brandFactsApproved).length) missing.push("approvedFacts")
  if (!product.website) missing.push("website")
  return missing
}

export type AssembleBrandContextInput = {
  userId: string
  productId: string
  task: AiTaskId
  /** Untrusted user brief for generation tasks */
  brief?: string
}

/**
 * Central BrandContextAssembler — only approved facts/summary enter trusted context.
 * Unapproved AI proposals are never included as approved.
 */
export async function assembleBrandContext(
  input: AssembleBrandContextInput
): Promise<AssembledBrandContext> {
  const product = await db.product.findFirst({
    where: { id: input.productId, userId: input.userId },
    include: { strategy: true },
  })

  if (!product) {
    throw new Error("Product not found")
  }

  const user = await db.user.findFirst({
    where: { id: input.userId },
    select: { brandVoice: true, founderBio: true },
  })

  return buildAssembledBrandContext({
    product,
    user,
    task: input.task,
    brief: input.brief,
  })
}

type AssemblerProductRow = {
  id: string
  name: string
  type: string
  industry: string
  audience: string
  audienceDetail: string | null
  stage: string
  salesMotion: string
  website: string | null
  description: string | null
  competitors: string | null
  techStackJson?: string | null
  brandSummaryApproved: string | null
  brandFactsApproved: string | null
  brandFactsProposed?: string | null
  brandVoiceJson: string | null
  brandApprovedAt: Date | null
  brandProfileStatus: string
  strategy?: {
    summary: string | null
    platforms: string
    tone: string
    antiPatterns: string
    proofTypes: string
    cadence: string
  } | null
}

type AssemblerUserRow = {
  brandVoice?: string | null
  founderBio?: string | null
} | null

/**
 * Pure assembler — testable without DB. Never promotes proposed facts to approved.
 */
export function buildAssembledBrandContext(opts: {
  product: AssemblerProductRow
  user?: AssemblerUserRow
  task: AiTaskId
  brief?: string
}): AssembledBrandContext {
  const { product, user, task, brief } = opts

  const approvedFacts = parseFacts(product.brandFactsApproved)
  // Explicitly ignore brandFactsProposed for trusted context
  void product.brandFactsProposed

  const approvedSummary = product.brandSummaryApproved || undefined
  const productVoice = parseVoice(product.brandVoiceJson)
  const userVoice = parseVoice(user?.brandVoice || undefined)
  const profileStatus = (product.brandProfileStatus || "incomplete") as BrandProfileStatus
  const hasApprovedContext = Boolean(approvedSummary || approvedFacts.length > 0)
  // brandVoiceJson is written only on explicit approve (proposed voice lives in
  // brandFactsProposed). Trust it when approved summary/facts exist.
  const approvedVoice =
    approvedSummary || approvedFacts.length
      ? productVoice || userVoice
      : undefined

  let strategy: AssembledBrandContext["strategy"] = null
  if (product.strategy) {
    strategy = {
      summary: product.strategy.summary || undefined,
      platforms: parseJson(product.strategy.platforms, null),
      tone: parseJson(product.strategy.tone, undefined),
      antiPatterns: parseJson(product.strategy.antiPatterns, null),
      proofTypes: parseJson(product.strategy.proofTypes, null),
      cadence: parseJson(product.strategy.cadence, null),
    }
  }

  return {
    identity: {
      productId: product.id,
      name: product.name,
      type: product.type,
      industry: product.industry,
      audience: product.audience,
      audienceDetail: product.audienceDetail || undefined,
      stage: product.stage,
      salesMotion: product.salesMotion,
      website: product.website || undefined,
    },
    approved: {
      summary: approvedSummary,
      facts: approvedFacts,
      voice: approvedVoice,
      approvedAt: product.brandApprovedAt?.toISOString(),
    },
    strategy,
    untrusted: {
      description: product.description || undefined,
      competitors: product.competitors || undefined,
      founderBio: user?.founderBio || undefined,
      userBrandVoice: user?.brandVoice || undefined,
      brief,
      techStack: formatTechStack(product.techStackJson),
    },
    meta: {
      profileStatus,
      hasApprovedContext,
      missingFields: missingFields(product),
      task,
    },
  }
}

/** Map assembler output to legacy ProductContext for existing content prompts */
export function toLegacyProductContext(ctx: AssembledBrandContext): LegacyProductContext {
  return {
    name: ctx.identity.name,
    type: ctx.identity.type,
    industry: ctx.identity.industry,
    audience: ctx.identity.audience,
    stage: ctx.identity.stage,
    audienceDetail: ctx.identity.audienceDetail,
    // Prefer approved summary for description when present; else raw description (untrusted at prompt layer)
    description: ctx.approved.summary || ctx.untrusted.description,
  }
}

export function toLegacyStrategyContext(
  ctx: AssembledBrandContext
): LegacyStrategyContext | null {
  if (!ctx.strategy) return null
  const platformsRaw = ctx.strategy.platforms
  let platforms: LegacyStrategyContext["platforms"] = []
  if (Array.isArray(platformsRaw)) {
    platforms = platformsRaw as LegacyStrategyContext["platforms"]
  }

  const tone = ctx.strategy.tone || { style: "Clear and helpful", examples: [], avoid: [] }
  const cadenceRaw = ctx.strategy.cadence as
    | { frequency?: string; postsPerWeek?: number }
    | null
    | undefined
  const proof = ctx.strategy.proofTypes
  const proofTypes = Array.isArray(proof)
    ? proof.map((p) => (typeof p === "string" ? p : String(p)))
    : typeof proof === "object" && proof && "types" in (proof as object)
      ? ((proof as { types: string[] }).types ?? [])
      : []

  const anti = ctx.strategy.antiPatterns
  let antiPatterns: LegacyStrategyContext["antiPatterns"] = []
  if (Array.isArray(anti)) {
    antiPatterns = anti as LegacyStrategyContext["antiPatterns"]
  } else if (anti && typeof anti === "object" && "avoid" in (anti as object)) {
    antiPatterns = ((anti as { avoid: LegacyStrategyContext["antiPatterns"] }).avoid ||
      []) as LegacyStrategyContext["antiPatterns"]
  }

  return {
    tone: {
      style: tone.style || "Clear and helpful",
      examples: tone.examples || [],
      avoid: tone.avoid || [],
    },
    platforms,
    proofTypes,
    cadence: {
      frequency: cadenceRaw?.frequency || "2-3x per week",
      postsPerWeek: cadenceRaw?.postsPerWeek ?? 2,
    },
    antiPatterns,
  }
}

/** Format approved facts for prompt grounding / claim checks */
export function approvedFactsAllowList(ctx: AssembledBrandContext): string[] {
  return ctx.approved.facts.map((f) => f.text)
}
