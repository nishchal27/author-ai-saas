import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { NextResponse } from "next/server"
import { resolveGuideNextStep } from "@/lib/guide/next-step"

/**
 * GET /api/guide/next
 * Single next-best action for Overview — Brand → Pillars → Ideas → Drafts → Plan.
 * Does not require an AI-generated brand summary.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await ensureUserForClerkId(userId)
    const { searchParams } = new URL(req.url)
    let productId = searchParams.get("productId") || user.activeProductId

    if (!productId) {
      const firstProduct = await db.product.findFirst({
        where: { userId: user.id },
        select: { id: true },
      })
      productId = firstProduct?.id ?? null
    }

    if (!productId) {
      return NextResponse.json(resolveGuideNextStep(null))
    }

    const product = await db.product.findFirst({
      where: { id: productId, userId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        brandProfileStatus: true,
        brandSummaryApproved: true,
      },
    })

    if (!product) {
      return NextResponse.json(resolveGuideNextStep(null))
    }

    // Early brand steps don't need counts
    const early = resolveGuideNextStep(product)
    if (
      early.step === "complete_brand_profile" ||
      early.step === "approve_brand_context" ||
      early.step === "approve_brand_summary"
    ) {
      return NextResponse.json(early)
    }

    const pillarCount = await db.contentPillar.count({
      where: { userId: user.id, productId: product.id, isActive: true },
    })
    const approvedPillarCount = await db.contentPillar.count({
      where: {
        userId: user.id,
        productId: product.id,
        isActive: true,
        approvalStatus: "approved",
      },
    })

    const ideaCount = await db.contentIdea.count({
      where: {
        userId: user.id,
        productId: product.id,
        status: { in: ["proposed", "saved", "converted"] },
      },
    })

    const ideaNeedingDraft = await db.contentIdea.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        status: { in: ["proposed", "saved"] },
        drafts: { none: {} },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    })

    const pendingDraft = await db.contentDraft.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        status: "draft",
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    })

    const weekStart = startOfUtcMonday()
    const plan = await db.weeklyContentPlan.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        weekStart,
      },
      include: { _count: { select: { items: true } } },
    })

    return NextResponse.json(
      resolveGuideNextStep(product, {
        pillarCount,
        approvedPillarCount,
        ideaCount,
        ideaNeedingDraft,
        pendingDraft,
        planItemCount: plan?._count.items ?? 0,
      })
    )
  } catch (error) {
    console.error("Error in guide/next:", error)
    return NextResponse.json(
      { error: "Failed to get next action" },
      { status: 500 }
    )
  }
}

function startOfUtcMonday(d = new Date()): Date {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  )
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + diff)
  date.setUTCHours(0, 0, 0, 0)
  return date
}
