import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

/**
 * GET /api/guide/next
 *
 * Returns the single recommended "next best action" for the user, product-aware.
 * Used by the Home page to show one clear CTA.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findFirst({
      where: { clerkId: userId },
      select: { id: true, activeProductId: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    let productId = searchParams.get("productId") || user.activeProductId

    // Resolve product: if no active product but user has products, use first product
    if (!productId) {
      const firstProduct = await db.product.findFirst({
        where: { userId: user.id },
        select: { id: true },
      })
      productId = firstProduct?.id ?? null
    }

    // 1. No product at all → add product
    if (!productId) {
      return NextResponse.json({
        step: "add_product",
        reason: "Add your product so we can recommend what to post.",
        cta: "Add your product",
        href: "/dashboard",
      })
    }

    const product = await db.product.findFirst({
      where: { id: productId, userId: user.id },
      include: { strategy: true },
    })

    if (!product) {
      return NextResponse.json({
        step: "add_product",
        reason: "Select or add a product to get started.",
        cta: "Add your product",
        href: "/dashboard",
      })
    }

    // 2. Product but no strategy → view strategy
    if (!product.strategy) {
      return NextResponse.json({
        step: "view_strategy",
        reason: "We need a strategy for this product before recommending posts.",
        cta: "See your strategy",
        href: "/dashboard/strategy",
      })
    }

    // 3. Draft in "draft" status → review draft (highest priority so user finishes what they started)
    const pendingDraft = await db.contentDraft.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        status: "draft",
      },
      orderBy: { createdAt: "desc" },
    })

    if (pendingDraft) {
      return NextResponse.json({
        step: "review_draft",
        reason: "Review your draft before posting.",
        cta: "Review draft",
        href: `/dashboard/content?draftId=${pendingDraft.id}`,
        draftId: pendingDraft.id,
        draftTitle: pendingDraft.title || `${pendingDraft.type} for ${pendingDraft.platform || "general"}`,
      })
    }

    // 4. Unprocessed activity (for this product) → get angle
    const unprocessedActivity = await db.activity.findFirst({
      where: {
        userId: user.id,
        productId: product.id,
        processed: false,
      },
      orderBy: { createdAt: "desc" },
    })

    if (unprocessedActivity) {
      return NextResponse.json({
        step: "get_angle",
        reason: "We have something to turn into a post.",
        cta: "Get the angle",
        href: `/dashboard?action=extract&activityId=${unprocessedActivity.id}`,
        activityId: unprocessedActivity.id,
        activityTitle: unprocessedActivity.title,
      })
    }

    // 5. Insight with no approved/scheduled draft → create post
    const insights = await db.insight.findMany({
      where: {
        userId: user.id,
        productId: product.id,
      },
      include: {
        contentDrafts: {
          where: { status: { in: ["approved", "scheduled", "published"] } },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const insightWithoutDraft = insights.find((i) => i.contentDrafts.length === 0)

    if (insightWithoutDraft) {
      const oneLiner = insightWithoutDraft.solution || insightWithoutDraft.coreProblem
      return NextResponse.json({
        step: "create_post",
        reason: "This angle is ready to share.",
        cta: "Create post",
        href: `/dashboard?action=post&insightId=${insightWithoutDraft.id}`,
        insightId: insightWithoutDraft.id,
        oneLiner: oneLiner.slice(0, 120) + (oneLiner.length > 120 ? "…" : ""),
        whyAudienceCares: insightWithoutDraft.whyMatters,
      })
    }

    // 6. Else → share story
    return NextResponse.json({
      step: "share_story",
      reason: "Add what you're working on to get a post idea.",
      cta: "Share a story",
      href: "/dashboard/activities/new",
    })
  } catch (error) {
    console.error("Error in guide/next:", error)
    return NextResponse.json(
      { error: "Failed to get next action" },
      { status: 500 }
    )
  }
}
