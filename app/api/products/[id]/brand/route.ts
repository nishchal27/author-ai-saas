import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { checkAiRateLimits } from "@/lib/rate-limit"
import { parseBody, brandApproveSchema } from "@/lib/validation"
import { summarizeBrand, approveBrandSummary } from "@/lib/brand/summarize"
import {
  assembleBrandContext,
  parseProposedFactsPayload,
} from "@/lib/brand-context/assembler"
import { apiError } from "@/lib/api-error"

async function loadOwnedProduct(userId: string, productId: string) {
  return db.product.findFirst({
    where: { id: productId, userId },
    select: {
      id: true,
      name: true,
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
        voice: product.brandVoiceJson
          ? JSON.parse(product.brandVoiceJson)
          : null,
      },
      approved: {
        summary: product.brandSummaryApproved,
        facts: product.brandFactsApproved
          ? JSON.parse(product.brandFactsApproved)
          : [],
        approvedAt: product.brandApprovedAt,
      },
      context: {
        hasApprovedContext: context.meta.hasApprovedContext,
        missingFields: context.meta.missingFields,
        profileStatus: context.meta.profileStatus,
      },
    })
  } catch (error) {
    return apiError(error, {
      context: "brand GET",
      publicMessage: "Failed to load brand profile",
    })
  }
}

/** POST — run brand.summarize (proposal only; does not approve) */
export async function POST(
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

    const rateLimit = await checkAiRateLimits(user.id)
    if (rateLimit) return rateLimit

    const result = await summarizeBrand({ userId: user.id, productId: id })
    return NextResponse.json({
      message:
        "Brand summary proposed. Review and approve in Varabhi before it becomes trusted context.",
      ...result,
    })
  } catch (error) {
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
        source: "ai_approved" as const,
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
