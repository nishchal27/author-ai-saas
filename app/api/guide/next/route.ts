import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ensureUserForClerkId } from "@/lib/users"
import { NextResponse } from "next/server"

/**
 * GET /api/guide/next
 * Single next-best action for Overview — Brand → Pillars → Ideas → Drafts → Plan.
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
      return NextResponse.json({
        step: "add_product",
        reason: "Add your brand so Varabhi can learn your voice and recommend content.",
        cta: "Add your brand",
        href: "/dashboard?addBrand=1",
      })
    }

    const product = await db.product.findFirst({
      where: { id: productId, userId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        brandProfileStatus: true,
        brandSummaryApproved: true,
        brandApprovedAt: true,
      },
    })

    if (!product) {
      return NextResponse.json({
        step: "add_product",
        reason: "Select or add a brand to get started.",
        cta: "Add your brand",
        href: "/dashboard?addBrand=1",
      })
    }

    // 1. Incomplete profile basics
    if (!product.description?.trim()) {
      return NextResponse.json({
        step: "complete_brand_profile",
        reason: `Add a short description for ${product.name} so we can propose an accurate brand summary.`,
        cta: "Complete brand profile",
        href: "/dashboard/brand",
        productId: product.id,
      })
    }

    // 2. Need proposed or approved summary
    if (
      product.brandProfileStatus === "incomplete" ||
      (!product.brandSummaryApproved && product.brandProfileStatus !== "proposed")
    ) {
      return NextResponse.json({
        step: "generate_brand_summary",
        reason: "Generate an AI brand summary, then review and approve it before creating content.",
        cta: "Generate brand summary",
        href: "/dashboard/brand",
        productId: product.id,
      })
    }

    // 3. Proposed but not approved
    if (product.brandProfileStatus === "proposed" || !product.brandSummaryApproved) {
      return NextResponse.json({
        step: "approve_brand_summary",
        reason: "A brand summary is waiting for your review. Approve it so drafts stay grounded.",
        cta: "Review and approve",
        href: "/dashboard/brand",
        productId: product.id,
      })
    }

    // 4. Pillars
    const pillarCount = await db.contentPillar.count({
      where: { userId: user.id, productId: product.id, isActive: true },
    })
    const approvedPillars = await db.contentPillar.count({
      where: {
        userId: user.id,
        productId: product.id,
        isActive: true,
        approvalStatus: "approved",
      },
    })

    if (pillarCount === 0) {
      return NextResponse.json({
        step: "generate_pillars",
        reason: "Create content pillars so ideas stay on-brand. Available in Marketing Intelligence.",
        cta: "Open Marketing Intelligence",
        href: "/dashboard/strategy",
        productId: product.id,
      })
    }

    if (approvedPillars === 0) {
      return NextResponse.json({
        step: "approve_pillars",
        reason: "You have proposed pillars waiting for review.",
        cta: "Review pillars",
        href: "/dashboard/strategy",
        productId: product.id,
      })
    }

    // 5. Ideas
    const ideaCount = await db.contentIdea.count({
      where: {
        userId: user.id,
        productId: product.id,
        status: { in: ["proposed", "saved", "converted"] },
      },
    })

    if (ideaCount === 0) {
      return NextResponse.json({
        step: "generate_ideas",
        reason: "Generate practical content ideas for this brand.",
        cta: "Generate ideas",
        href: "/dashboard/content",
        productId: product.id,
      })
    }

    const savedWithoutDraft = await db.contentIdea.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        status: { in: ["proposed", "saved"] },
        drafts: { none: {} },
      },
      orderBy: { updatedAt: "desc" },
    })

    if (savedWithoutDraft) {
      return NextResponse.json({
        step: "create_draft",
        reason: `Turn “${savedWithoutDraft.title}” into a platform draft.`,
        cta: "Open Content Studio",
        href: "/dashboard/content",
        productId: product.id,
        ideaId: savedWithoutDraft.id,
      })
    }

    // 6. Drafts needing attention
    const pendingDraft = await db.contentDraft.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        status: "draft",
      },
      orderBy: { updatedAt: "desc" },
    })

    if (pendingDraft) {
      return NextResponse.json({
        step: "review_draft",
        reason: "You have a draft ready to review and refine.",
        cta: "Review draft",
        href: `/dashboard/content?draftId=${pendingDraft.id}`,
        productId: product.id,
        draftId: pendingDraft.id,
      })
    }

    // 7. Weekly plan
    const weekStart = startOfUtcMonday()
    const plan = await db.weeklyContentPlan.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        weekStart,
      },
      include: { _count: { select: { items: true } } },
    })

    if (!plan || plan._count.items === 0) {
      return NextResponse.json({
        step: "plan_week",
        reason: "Add ideas or drafts to this week’s plan to stay consistent.",
        cta: "Open Content Planner",
        href: "/dashboard/plan",
        productId: product.id,
      })
    }

    return NextResponse.json({
      step: "continue_plan",
      reason: "Your brand is set up. Keep moving this week’s plan forward.",
      cta: "View this week",
      href: "/dashboard/plan",
      productId: product.id,
    })
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
