import { db } from "@/lib/db"

export type IdeaStatus = "proposed" | "saved" | "rejected" | "converted"

export class IdeaDomainError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = "IdeaDomainError"
    this.status = status
  }
}

async function assertProductOwnership(userId: string, productId: string) {
  const product = await db.product.findFirst({
    where: { id: productId, userId },
    select: { id: true },
  })
  if (!product) throw new IdeaDomainError("Product not found", 404)
  return product
}

export async function listIdeas(
  userId: string,
  productId: string,
  status?: IdeaStatus
) {
  await assertProductOwnership(userId, productId)
  return db.contentIdea.findMany({
    where: {
      userId,
      productId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      contentPillar: {
        select: { id: true, name: true, approvalStatus: true, isActive: true },
      },
      drafts: {
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  })
}

export async function createIdea(opts: {
  userId: string
  productId: string
  contentPillarId?: string | null
  title: string
  concept: string
  platform: string
  audience: string
  objective: string
  format: string
  explanation?: string | null
  source?: "ai" | "user"
  status?: IdeaStatus
  generationMetaJson?: string
}) {
  await assertProductOwnership(opts.userId, opts.productId)

  if (opts.contentPillarId) {
    const pillar = await db.contentPillar.findFirst({
      where: {
        id: opts.contentPillarId,
        userId: opts.userId,
        productId: opts.productId,
      },
      select: { id: true },
    })
    if (!pillar) throw new IdeaDomainError("Pillar not found for this product", 404)
  }

  return db.contentIdea.create({
    data: {
      userId: opts.userId,
      productId: opts.productId,
      contentPillarId: opts.contentPillarId ?? null,
      title: opts.title,
      concept: opts.concept,
      platform: opts.platform,
      audience: opts.audience,
      objective: opts.objective,
      format: opts.format,
      explanation: opts.explanation ?? null,
      source: opts.source ?? "user",
      status: opts.status ?? "proposed",
      generationMetaJson: opts.generationMetaJson ?? null,
    },
  })
}

export async function updateIdea(opts: {
  userId: string
  productId: string
  ideaId: string
  title?: string
  concept?: string
  platform?: string
  audience?: string
  objective?: string
  format?: string
  explanation?: string | null
  contentPillarId?: string | null
  status?: IdeaStatus
}) {
  const existing = await db.contentIdea.findFirst({
    where: {
      id: opts.ideaId,
      userId: opts.userId,
      productId: opts.productId,
    },
  })
  if (!existing) throw new IdeaDomainError("Idea not found", 404)

  if (opts.contentPillarId) {
    const pillar = await db.contentPillar.findFirst({
      where: {
        id: opts.contentPillarId,
        userId: opts.userId,
        productId: opts.productId,
      },
      select: { id: true },
    })
    if (!pillar) throw new IdeaDomainError("Pillar not found for this product", 404)
  }

  return db.contentIdea.update({
    where: { id: existing.id },
    data: {
      ...(opts.title !== undefined ? { title: opts.title } : {}),
      ...(opts.concept !== undefined ? { concept: opts.concept } : {}),
      ...(opts.platform !== undefined ? { platform: opts.platform } : {}),
      ...(opts.audience !== undefined ? { audience: opts.audience } : {}),
      ...(opts.objective !== undefined ? { objective: opts.objective } : {}),
      ...(opts.format !== undefined ? { format: opts.format } : {}),
      ...(opts.explanation !== undefined
        ? { explanation: opts.explanation }
        : {}),
      ...(opts.contentPillarId !== undefined
        ? { contentPillarId: opts.contentPillarId }
        : {}),
      ...(opts.status !== undefined ? { status: opts.status } : {}),
    },
  })
}

/**
 * Idempotent idea → draft conversion.
 * Concurrent callers: transaction + existing draft check; returns the same draft.
 */
export async function convertIdeaToDraft(opts: {
  userId: string
  productId: string
  ideaId: string
  content?: string
}) {
  return db.$transaction(async (tx) => {
    const idea = await tx.contentIdea.findFirst({
      where: {
        id: opts.ideaId,
        userId: opts.userId,
        productId: opts.productId,
      },
    })
    if (!idea) throw new IdeaDomainError("Idea not found", 404)
    if (idea.status === "rejected") {
      throw new IdeaDomainError("Rejected ideas cannot be converted", 400)
    }

    const existingDraft = await tx.contentDraft.findFirst({
      where: {
        contentIdeaId: idea.id,
        userId: opts.userId,
        productId: opts.productId,
      },
      orderBy: { createdAt: "asc" },
    })

    if (existingDraft) {
      if (idea.status !== "converted") {
        await tx.contentIdea.update({
          where: { id: idea.id },
          data: { status: "converted" },
        })
      }
      return { draft: existingDraft, created: false as const }
    }

    const placeholder =
      opts.content?.trim() ||
      [
        `# ${idea.title}`,
        "",
        idea.concept,
        "",
        idea.explanation ? `Why: ${idea.explanation}` : null,
        `Platform: ${idea.platform}`,
        `Format: ${idea.format}`,
        `Audience: ${idea.audience}`,
        `Objective: ${idea.objective}`,
      ]
        .filter(Boolean)
        .join("\n")

    const draft = await tx.contentDraft.create({
      data: {
        userId: opts.userId,
        productId: opts.productId,
        contentIdeaId: idea.id,
        insightId: null,
        type: idea.format || "post",
        platform: idea.platform,
        title: idea.title,
        content: placeholder,
        status: "draft",
        generationReason: `Converted from idea ${idea.id}`,
        audienceContext: idea.audience,
        generationMetaJson: JSON.stringify({
          source: "idea.convert",
          ideaId: idea.id,
        }),
      },
    })

    await tx.contentIdea.update({
      where: { id: idea.id },
      data: { status: "converted" },
    })

    return { draft, created: true as const }
  })
}

/** Persist AI idea batch into ContentIdea rows (source of truth). */
export async function persistGeneratedIdeas(opts: {
  userId: string
  productId: string
  ideas: Array<{
    title: string
    concept: string
    platform: string
    audience: string
    objective: string
    format: string
    explanation?: string
    pillarName?: string
  }>
  pillarsByName: Map<string, string>
  generationMetaJson?: string
}) {
  await assertProductOwnership(opts.userId, opts.productId)
  const created = []
  for (const idea of opts.ideas) {
    const pillarId = idea.pillarName
      ? opts.pillarsByName.get(idea.pillarName.toLowerCase()) ?? null
      : null
    created.push(
      await db.contentIdea.create({
        data: {
          userId: opts.userId,
          productId: opts.productId,
          contentPillarId: pillarId,
          title: idea.title,
          concept: idea.concept,
          platform: idea.platform,
          audience: idea.audience,
          objective: idea.objective,
          format: idea.format,
          explanation: idea.explanation ?? null,
          status: "proposed",
          source: "ai",
          generationMetaJson: opts.generationMetaJson ?? null,
        },
      })
    )
  }
  return created
}
