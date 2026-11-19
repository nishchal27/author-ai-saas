import { db } from "@/lib/db"

export type PillarApprovalStatus = "proposed" | "approved" | "rejected"

async function assertProductOwnership(userId: string, productId: string) {
  const product = await db.product.findFirst({
    where: { id: productId, userId },
    select: { id: true },
  })
  if (!product) {
    throw new PillarDomainError("Product not found", 404)
  }
  return product
}

export class PillarDomainError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = "PillarDomainError"
    this.status = status
  }
}

export async function listPillars(userId: string, productId: string) {
  await assertProductOwnership(userId, productId)
  return db.contentPillar.findMany({
    where: { userId, productId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })
}

export async function createPillar(opts: {
  userId: string
  productId: string
  name: string
  description: string
  purpose?: string
  source?: "ai" | "user"
  approvalStatus?: PillarApprovalStatus
  sortOrder?: number
  generationMetaJson?: string
}) {
  await assertProductOwnership(opts.userId, opts.productId)
  const maxOrder = await db.contentPillar.aggregate({
    where: { userId: opts.userId, productId: opts.productId },
    _max: { sortOrder: true },
  })
  return db.contentPillar.create({
    data: {
      userId: opts.userId,
      productId: opts.productId,
      name: opts.name,
      description: opts.description,
      purpose: opts.purpose ?? null,
      source: opts.source ?? "user",
      approvalStatus: opts.approvalStatus ?? "proposed",
      sortOrder: opts.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      generationMetaJson: opts.generationMetaJson ?? null,
    },
  })
}

export async function updatePillar(opts: {
  userId: string
  productId: string
  pillarId: string
  name?: string
  description?: string
  purpose?: string | null
  isActive?: boolean
  sortOrder?: number
  approvalStatus?: PillarApprovalStatus
}) {
  const existing = await db.contentPillar.findFirst({
    where: {
      id: opts.pillarId,
      userId: opts.userId,
      productId: opts.productId,
    },
  })
  if (!existing) throw new PillarDomainError("Pillar not found", 404)

  return db.contentPillar.update({
    where: { id: existing.id },
    data: {
      ...(opts.name !== undefined ? { name: opts.name } : {}),
      ...(opts.description !== undefined
        ? { description: opts.description }
        : {}),
      ...(opts.purpose !== undefined ? { purpose: opts.purpose } : {}),
      ...(opts.isActive !== undefined ? { isActive: opts.isActive } : {}),
      ...(opts.sortOrder !== undefined ? { sortOrder: opts.sortOrder } : {}),
      ...(opts.approvalStatus !== undefined
        ? { approvalStatus: opts.approvalStatus }
        : {}),
    },
  })
}

export async function approvePillar(opts: {
  userId: string
  productId: string
  pillarId: string
}) {
  return updatePillar({ ...opts, approvalStatus: "approved", isActive: true })
}

export async function reorderPillars(opts: {
  userId: string
  productId: string
  orderedIds: string[]
}) {
  await assertProductOwnership(opts.userId, opts.productId)
  const pillars = await db.contentPillar.findMany({
    where: { userId: opts.userId, productId: opts.productId },
    select: { id: true },
  })
  const owned = new Set(pillars.map((p) => p.id))
  if (opts.orderedIds.some((id) => !owned.has(id))) {
    throw new PillarDomainError("One or more pillars not found for this product", 400)
  }

  await db.$transaction(
    opts.orderedIds.map((id, index) =>
      db.contentPillar.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  )

  return listPillars(opts.userId, opts.productId)
}

/** Persist AI-generated pillars as proposed rows for a product. */
export async function persistGeneratedPillars(opts: {
  userId: string
  productId: string
  pillars: Array<{
    name: string
    description: string
    purpose?: string
  }>
  generationMetaJson?: string
}) {
  await assertProductOwnership(opts.userId, opts.productId)
  const created = []
  let order = 0
  for (const pillar of opts.pillars.slice(0, 5)) {
    created.push(
      await db.contentPillar.create({
        data: {
          userId: opts.userId,
          productId: opts.productId,
          name: pillar.name,
          description: pillar.description,
          purpose: pillar.purpose ?? null,
          approvalStatus: "proposed",
          isActive: true,
          sortOrder: order++,
          source: "ai",
          generationMetaJson: opts.generationMetaJson ?? null,
        },
      })
    )
  }
  return created
}
