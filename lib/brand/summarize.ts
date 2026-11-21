import { executeAi } from "@/lib/ai"
import {
  brandSummarizeSchema,
  BRAND_SUMMARIZE_SCHEMA_VERSION,
  type BrandSummarizeOutput,
} from "@/lib/ai/schemas/brand"
import { buildBrandSummarizeMessages } from "@/lib/ai/prompts/brand.summarize.v1"
import { assembleBrandContext } from "@/lib/brand-context/assembler"
import { db } from "@/lib/db"
import { randomUUID } from "crypto"
import type { BrandFact } from "@/lib/brand/types"

function ensureFactIds(facts: BrandFact[], source: BrandFact["source"]): BrandFact[] {
  return facts.map((f) => ({
    ...f,
    id: f.id || randomUUID(),
    source: f.source || source,
  }))
}

export async function summarizeBrand(opts: {
  userId: string
  productId: string
}) {
  const ctx = await assembleBrandContext({
    userId: opts.userId,
    productId: opts.productId,
    task: "brand.summarize",
  })

  const { messages, promptVersion } = buildBrandSummarizeMessages(ctx)
  const result = await executeAi<BrandSummarizeOutput>({
    task: "brand.summarize",
    userId: opts.userId,
    brandId: opts.productId,
    messages,
    jsonMode: true,
  })

  // Validate again with schema (orchestrator may already have parsed)
  const data =
    result.data ??
    brandSummarizeSchema.parse(JSON.parse(result.text))

  const proposedFacts = ensureFactIds(data.proposedFacts, "ai_proposed").map((f) => ({
    ...f,
    source: "ai_proposed" as const,
  }))
  const userSuppliedFacts = ensureFactIds(data.userSuppliedFacts, "user").map((f) => ({
    ...f,
    source: "user" as const,
  }))

  const proposal: BrandSummarizeOutput = {
    ...data,
    proposedFacts,
    userSuppliedFacts,
  }

  // Persist as PROPOSED only — never auto-approve.
  // Do not write brandVoiceJson here: that column is trusted after approval only.
  // Proposed voice lives inside brandFactsProposed.proposal for review UI.
  await db.product.updateMany({
    where: { id: opts.productId, userId: opts.userId },
    data: {
      brandSummaryProposed: proposal.businessDescription,
      brandFactsProposed: JSON.stringify({
        version: 1,
        kind: "brand.summarize",
        schemaVersion: BRAND_SUMMARIZE_SCHEMA_VERSION,
        promptVersion,
        facts: proposedFacts,
        userSuppliedFacts,
        proposal,
        voice: proposal.brandVoice,
      }),
      brandProfileStatus: "proposed",
    },
  })

  return {
    proposal,
    promptVersion,
    schemaVersion: BRAND_SUMMARIZE_SCHEMA_VERSION,
    status: "proposed" as const,
    provider: result.provider,
    model: result.model,
  }
}

/**
 * Persist a user-authored proposal without AI. Does not approve.
 * Keeps proposed vs approved distinction intact.
 */
export async function saveManualBrandProposal(opts: {
  userId: string
  productId: string
  summary: string
  facts: Array<{ id?: string; text: string; category?: string }>
  voice?: { tone: string; examples?: string[]; personality?: string }
}) {
  const proposedFacts = opts.facts.map((f) => ({
    id: f.id || randomUUID(),
    text: f.text,
    category: f.category,
    source: "user" as const,
  }))

  const updated = await db.product.updateMany({
    where: { id: opts.productId, userId: opts.userId },
    data: {
      brandSummaryProposed: opts.summary,
      brandFactsProposed: JSON.stringify({
        version: 1,
        kind: "brand.manual",
        facts: proposedFacts,
        userSuppliedFacts: proposedFacts,
        ...(opts.voice ? { voice: opts.voice } : {}),
      }),
      // Never write proposed voice into brandVoiceJson (trusted only after approve).
      brandProfileStatus: "proposed",
    },
  })

  if (updated.count === 0) {
    throw new Error("Product not found")
  }

  return {
    status: "proposed" as const,
    summary: opts.summary,
    facts: proposedFacts,
  }
}

export async function approveBrandSummary(opts: {
  userId: string
  productId: string
  summary: string
  facts: BrandFact[]
  voice?: { tone: string; examples?: string[]; personality?: string }
}) {
  const facts = opts.facts.map((f) => ({
    ...f,
    id: f.id || randomUUID(),
    // Preserve manual user facts; AI-reviewed facts stay ai_approved
    source:
      f.source === "user" || f.source === "ai_approved"
        ? f.source
        : ("ai_approved" as const),
  }))

  const updated = await db.product.updateMany({
    where: { id: opts.productId, userId: opts.userId },
    data: {
      brandSummaryApproved: opts.summary,
      brandFactsApproved: JSON.stringify(facts),
      // Mirror into proposed so the review panel stays consistent after manual approve
      brandSummaryProposed: opts.summary,
      brandFactsProposed: JSON.stringify({
        version: 1,
        kind: "brand.approve",
        facts,
        userSuppliedFacts: facts.filter((f) => f.source === "user"),
      }),
      ...(opts.voice ? { brandVoiceJson: JSON.stringify(opts.voice) } : {}),
      brandApprovedAt: new Date(),
      brandProfileStatus: "approved",
    },
  })

  if (updated.count === 0) {
    throw new Error("Product not found")
  }

  return { status: "approved" as const, approvedAt: new Date().toISOString() }
}
