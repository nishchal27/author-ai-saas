/**
 * Pure next-action resolution for Overview guide.
 * Brand → approved context → pillars → ideas → drafts → plan.
 * Does not require AI-generated summaries.
 */

export type GuideProductSnapshot = {
  id: string
  name: string
  description: string | null
  brandProfileStatus: string
  brandSummaryApproved: string | null
}

export type GuideCounts = {
  pillarCount: number
  approvedPillarCount: number
  ideaCount: number
  ideaNeedingDraft: { id: string; title: string } | null
  pendingDraft: { id: string } | null
  planItemCount: number
}

export type GuideNextAction = {
  step: string
  reason: string
  cta: string
  href: string
  productId?: string
  ideaId?: string
  draftId?: string
}

export function resolveGuideNextStep(
  product: GuideProductSnapshot | null,
  counts?: GuideCounts | null
): GuideNextAction {
  if (!product) {
    return {
      step: "add_product",
      reason:
        "Add your brand so Varabhi can learn your voice and recommend content.",
      cta: "Add your brand",
      href: "/dashboard?addBrand=1",
    }
  }

  if (!product.description?.trim()) {
    return {
      step: "complete_brand_profile",
      reason: `Add a short description for ${product.name} so you can approve brand context.`,
      cta: "Complete brand profile",
      href: "/dashboard/brand",
      productId: product.id,
    }
  }

  // Approved context is required — may be written manually or via AI proposal + approve
  if (!product.brandSummaryApproved?.trim()) {
    const waiting = product.brandProfileStatus === "proposed"
    return {
      step: waiting ? "approve_brand_summary" : "approve_brand_context",
      reason: waiting
        ? "A brand summary is waiting for your review. Approve it so drafts stay grounded."
        : "Write and approve a brand summary in Brand Studio. You can do this manually — AI is optional.",
      cta: waiting ? "Review and approve" : "Approve brand context",
      href: "/dashboard/brand",
      productId: product.id,
    }
  }

  if (!counts) {
    return {
      step: "continue_plan",
      reason: "Your brand context is approved.",
      cta: "Open Brand Studio",
      href: "/dashboard/brand",
      productId: product.id,
    }
  }

  if (counts.pillarCount === 0) {
    return {
      step: "generate_pillars",
      reason:
        "Create content pillars so ideas stay on-brand. Add them manually or with AI.",
      cta: "Open Marketing Intelligence",
      href: "/dashboard/strategy",
      productId: product.id,
    }
  }

  if (counts.approvedPillarCount === 0) {
    return {
      step: "approve_pillars",
      reason: "You have proposed pillars waiting for review.",
      cta: "Review pillars",
      href: "/dashboard/strategy",
      productId: product.id,
    }
  }

  if (counts.ideaCount === 0) {
    return {
      step: "generate_ideas",
      reason: "Add content ideas for this brand — manually or with AI.",
      cta: "Open Content Ideas",
      href: "/dashboard/content",
      productId: product.id,
    }
  }

  if (counts.ideaNeedingDraft) {
    return {
      step: "create_draft",
      reason: `Turn “${counts.ideaNeedingDraft.title}” into a draft (manual convert or AI).`,
      cta: "Open Content Studio",
      href: "/dashboard/content",
      productId: product.id,
      ideaId: counts.ideaNeedingDraft.id,
    }
  }

  if (counts.pendingDraft) {
    return {
      step: "review_draft",
      reason: "You have a draft ready to review and refine.",
      cta: "Review draft",
      href: `/dashboard/content?platform=all&draftId=${counts.pendingDraft.id}`,
      productId: product.id,
      draftId: counts.pendingDraft.id,
    }
  }

  if (counts.planItemCount === 0) {
    return {
      step: "plan_week",
      reason: "Add ideas or drafts to this week’s plan to stay consistent.",
      cta: "Open Content Planner",
      href: "/dashboard/plan",
      productId: product.id,
    }
  }

  return {
    step: "continue_plan",
    reason: "Your brand is set up. Keep moving this week’s plan forward.",
    cta: "View this week",
    href: "/dashboard/plan",
    productId: product.id,
  }
}

/** Contract order for UI/docs alignment. */
export const GUIDE_PRIORITY = [
  "add_product",
  "complete_brand_profile",
  "approve_brand_context",
  "approve_brand_summary",
  "generate_pillars",
  "approve_pillars",
  "generate_ideas",
  "create_draft",
  "review_draft",
  "plan_week",
  "continue_plan",
] as const
