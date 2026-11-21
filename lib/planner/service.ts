import { db } from "@/lib/db"
import { weekStartUtc } from "@/lib/planner/dates"

export type PlanItemStatus = "planned" | "in_progress" | "completed"

export { weekStartUtc }

export class PlannerDomainError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = "PlannerDomainError"
    this.status = status
  }
}

async function assertProductOwnership(userId: string, productId: string) {
  const product = await db.product.findFirst({
    where: { id: productId, userId },
    select: { id: true },
  })
  if (!product) throw new PlannerDomainError("Product not found", 404)
  return product
}

export async function getOrCreateWeekPlan(opts: {
  userId: string
  productId: string
  weekStart?: Date
}) {
  await assertProductOwnership(opts.userId, opts.productId)
  const weekStart = weekStartUtc(opts.weekStart ?? new Date())

  const existing = await db.weeklyContentPlan.findFirst({
    where: {
      userId: opts.userId,
      productId: opts.productId,
      weekStart,
    },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          contentIdea: {
            select: { id: true, title: true, status: true, platform: true },
          },
          contentDraft: {
            select: { id: true, title: true, status: true, platform: true },
          },
        },
      },
    },
  })
  if (existing) return existing

  return db.weeklyContentPlan.create({
    data: {
      userId: opts.userId,
      productId: opts.productId,
      weekStart,
      status: "active",
    },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          contentIdea: {
            select: { id: true, title: true, status: true, platform: true },
          },
          contentDraft: {
            select: { id: true, title: true, status: true, platform: true },
          },
        },
      },
    },
  })
}

export async function addPlanItem(opts: {
  userId: string
  productId: string
  planId: string
  contentIdeaId?: string
  contentDraftId?: string
  status?: PlanItemStatus
}) {
  if (!opts.contentIdeaId && !opts.contentDraftId) {
    throw new PlannerDomainError("Provide contentIdeaId and/or contentDraftId")
  }

  const plan = await db.weeklyContentPlan.findFirst({
    where: {
      id: opts.planId,
      userId: opts.userId,
      productId: opts.productId,
    },
  })
  if (!plan) throw new PlannerDomainError("Plan not found", 404)

  if (opts.contentIdeaId) {
    const idea = await db.contentIdea.findFirst({
      where: {
        id: opts.contentIdeaId,
        userId: opts.userId,
        productId: opts.productId,
      },
      select: { id: true },
    })
    if (!idea) {
      throw new PlannerDomainError(
        "Idea not found for this user/product",
        404
      )
    }

    const dup = await db.weeklyPlanItem.findFirst({
      where: { planId: plan.id, contentIdeaId: opts.contentIdeaId },
    })
    if (dup) {
      throw new PlannerDomainError("Idea already on this week plan", 409)
    }
  }

  if (opts.contentDraftId) {
    const draft = await db.contentDraft.findFirst({
      where: {
        id: opts.contentDraftId,
        userId: opts.userId,
        productId: opts.productId,
      },
      select: { id: true },
    })
    if (!draft) {
      throw new PlannerDomainError(
        "Draft not found for this user/product",
        404
      )
    }

    const dup = await db.weeklyPlanItem.findFirst({
      where: { planId: plan.id, contentDraftId: opts.contentDraftId },
    })
    if (dup) {
      throw new PlannerDomainError("Draft already on this week plan", 409)
    }
  }

  const maxOrder = await db.weeklyPlanItem.aggregate({
    where: { planId: plan.id },
    _max: { sortOrder: true },
  })

  try {
    return await db.weeklyPlanItem.create({
      data: {
        planId: plan.id,
        userId: opts.userId,
        productId: opts.productId,
        contentIdeaId: opts.contentIdeaId ?? null,
        contentDraftId: opts.contentDraftId ?? null,
        status: opts.status ?? "planned",
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
      include: {
        contentIdea: {
          select: { id: true, title: true, status: true, platform: true },
        },
        contentDraft: {
          select: { id: true, title: true, status: true, platform: true },
        },
      },
    })
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : ""
    if (code === "P2002") {
      throw new PlannerDomainError("Item already on this week plan", 409)
    }
    throw err
  }
}

export async function updatePlanItemStatus(opts: {
  userId: string
  productId: string
  itemId: string
  status: PlanItemStatus
}) {
  const item = await db.weeklyPlanItem.findFirst({
    where: {
      id: opts.itemId,
      userId: opts.userId,
      productId: opts.productId,
    },
  })
  if (!item) throw new PlannerDomainError("Plan item not found", 404)

  return db.weeklyPlanItem.update({
    where: { id: item.id },
    data: { status: opts.status },
  })
}

export async function removePlanItem(opts: {
  userId: string
  productId: string
  itemId: string
}) {
  const item = await db.weeklyPlanItem.findFirst({
    where: {
      id: opts.itemId,
      userId: opts.userId,
      productId: opts.productId,
    },
  })
  if (!item) throw new PlannerDomainError("Plan item not found", 404)
  await db.weeklyPlanItem.delete({ where: { id: item.id } })
  return { ok: true as const }
}
