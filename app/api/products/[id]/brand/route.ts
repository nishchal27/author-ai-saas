import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { checkAiRateLimits } from "@/lib/rate-limit"
import {
  parseBody,
  brandApproveSchema,
  brandManualProposeSchema,
} from "@/lib/validation"
import {
  summarizeBrand,
  approveBrandSummary,
  saveManualBrandProposal,
} from "@/lib/brand/summarize"
import {
  assembleBrandContext,
  parseProposedFactsPayload,
} from "@/lib/brand-context/assembler"
import { apiError } from "@/lib/api-error"
import { toAiPublicError } from "@/lib/ai/public-error"
import { hasAnyAiProviderKey } from "@/lib/env"

async function loadOwnedProduct(userId: string, productId: string) {
  return db.product.findFirst({
    where: { id: productId, userId },
    select: {
      id: true,
      name: true,
      description: true,
      brandProfileStatus: true,
      brandSummaryProposed: true,
      brandSummaryApproved: true,
      brandFactsProposed: true,
      brandFactsApproved: true,
      brandVoiceJson: true,
      brandApprovedAt: true,
      brandSuggestionsJson: true,
    },
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const user = await ensureUserForClerkId(clerkId)
    const product = await loadOwnedProduct(user.id, id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const context = await assembleBrandContext({
      userId: user.id,
      productId: id,
      task: "brand.summarize",
    })

    const proposedPayload = parseProposedFactsPayload(product.brandFactsProposed)

    return NextResponse.json({
      productId: product.id,
      name: product.name,
      status: product.brandProfileStatus,
      proposed: {
        summary: product.brandSummaryProposed,
        facts: proposedPayload.facts,
        userSuppliedFacts: proposedPayload.userSuppliedFacts || [],
        fullProposal: proposedPayload.proposal || null,
        promptVersion: proposedPayload.promptVersion,
        // Proposed voice from proposal payload only — never treat brandVoiceJson as proposed.
        voice:
          proposedPayload.voice ||
          (proposedPayload.proposal &&
          typeof proposedPayload.proposal === "object" &&
          proposedPayload.proposal !== null &&
          "brandVoice" in proposedPayload.proposal
            ? (proposedPayload.proposal as { brandVoice?: unknown }).brandVoice
            : null) ||
          null,
      },
      approved: {
        summary: product.brandSummaryApproved,
        facts: product.brandFactsApproved
          ? JSON.parse(product.brandFactsApproved)
          : [],
        voice:
          product.brandProfileStatus === "approved" && product.brandVoiceJson
            ? JSON.parse(product.brandVoiceJson)
            : null,
        approvedAt: product.brandApprovedAt,
      },
      context: {
        hasApprovedContext: context.meta.hasApprovedContext,
        missingFields: context.meta.missingFields,
        profileStatus: context.meta.profileStatus,
      },
      aiConfigured: hasAnyAiProviderKey(),
    })
  } catch (error) {
    return apiError(error, {
      context: "brand GET",
      publicMessage: "Failed to load brand profile",
    })
  }
}

/** POST — AI summarize (no body) OR manual proposal ({ mode: "manual", ... }) */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const user = await ensureUserForClerkId(clerkId)
    const product = await loadOwnedProduct(user.id, id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const contentType = request.headers.get("content-type") || ""
    const raw =
      contentType.includes("application/json")
        ? await request.json().catch(() => null)
        : null

    if (raw && typeof raw === "object" && (raw as { mode?: string }).mode === "manual") {
      const parsed = parseBody(raw, brandManualProposeSchema)
      if ("error" in parsed) return parsed.error
      const result = await saveManualBrandProposal({
        userId: user.id,
        productId: id,
        summary: parsed.data.summary,
        facts: parsed.data.facts,
        voice: parsed.data.voice,
      })
      return NextResponse.json({
        message:
          "Manual brand proposal saved. Review and approve before it becomes trusted context.",
        ...result,
      })
    }

    if (!hasAnyAiProviderKey()) {
      const pub = toAiPublicError(new Error("not configured"))
      return NextResponse.json(
        { error: pub.error, code: pub.code },
        { status: pub.status }
      )
    }

    const rateLimit = await checkAiRateLimits(user.id)
    if (rateLimit) return rateLimit

    const result = await summarizeBrand({ userId: user.id, productId: id })
    return NextResponse.json({
      message:
        "Brand summary proposed. Review and approve in Varabhi before it becomes trusted context.",
      ...result,
    })
  } catch (error) {
    const pub = toAiPublicError(error)
    if (pub.code !== "AI_FAILED" || !hasAnyAiProviderKey()) {
      return NextResponse.json(
        { error: pub.error, code: pub.code },
        { status: pub.status }
      )
    }
    return apiError(error, {
      context: "brand POST summarize",
      publicMessage: "Failed to summarize brand",
    })
  }
}

/** PATCH — user approves edited summary/facts into trusted context */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const user = await ensureUserForClerkId(clerkId)
    const product = await loadOwnedProduct(user.id, id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const raw = await request.json().catch(() => null)
    const parsed = parseBody(raw, brandApproveSchema)
    if ("error" in parsed) return parsed.error

    const result = await approveBrandSummary({
      userId: user.id,
      productId: id,
      summary: parsed.data.summary,
      facts: parsed.data.facts.map((f) => ({
        id: f.id,
        text: f.text,
        category: f.category,
        source: f.source === "user" ? ("user" as const) : ("ai_approved" as const),
      })),
      voice: parsed.data.voice,
    })

    return NextResponse.json({
      message: "Brand context approved for Varabhi generation.",
      ...result,
    })
  } catch (error) {
    return apiError(error, {
      context: "brand PATCH approve",
      publicMessage: "Failed to approve brand summary",
    })
  }
}
