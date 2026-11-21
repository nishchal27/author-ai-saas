import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  convertIdeaToDraft,
  createIdea,
  IdeaDomainError,
  updateIdea,
} from "@/lib/ideas/service"

const productFindFirst = vi.fn()
const ideaFindFirst = vi.fn()
const ideaCreate = vi.fn()
const ideaUpdate = vi.fn()
const draftFindFirst = vi.fn()
const draftCreate = vi.fn()
const pillarFindFirst = vi.fn()
const txIdeaFindFirst = vi.fn()
const txDraftFindFirst = vi.fn()
const txDraftCreate = vi.fn()
const txIdeaUpdate = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    product: { findFirst: (...a: unknown[]) => productFindFirst(...a) },
    contentIdea: {
      findFirst: (...a: unknown[]) => ideaFindFirst(...a),
      create: (...a: unknown[]) => ideaCreate(...a),
      update: (...a: unknown[]) => ideaUpdate(...a),
    },
    contentDraft: {
      findFirst: (...a: unknown[]) => draftFindFirst(...a),
      create: (...a: unknown[]) => draftCreate(...a),
    },
    contentPillar: { findFirst: (...a: unknown[]) => pillarFindFirst(...a) },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        contentIdea: {
          findFirst: (...a: unknown[]) => txIdeaFindFirst(...a),
          update: (...a: unknown[]) => txIdeaUpdate(...a),
        },
        contentDraft: {
          findFirst: (...a: unknown[]) => txDraftFindFirst(...a),
          create: (...a: unknown[]) => txDraftCreate(...a),
        },
      }),
  },
}))

describe("idea domain service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a manual idea scoped to user and product without AI", async () => {
    productFindFirst.mockResolvedValue({ id: "p1" })
    ideaCreate.mockResolvedValue({
      id: "idea_manual",
      userId: "u1",
      productId: "p1",
      title: "Behind the craft",
      concept: "Show workshop process",
      platform: "linkedin",
      audience: "founders",
      objective: "trust",
      format: "post",
      source: "user",
      status: "saved",
      contentPillarId: null,
    })

    const idea = await createIdea({
      userId: "u1",
      productId: "p1",
      title: "Behind the craft",
      concept: "Show workshop process",
      platform: "linkedin",
      audience: "founders",
      objective: "trust",
      format: "post",
      source: "user",
      status: "saved",
    })

    expect(productFindFirst).toHaveBeenCalledWith({
      where: { id: "p1", userId: "u1" },
      select: { id: true },
    })
    expect(ideaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        productId: "p1",
        title: "Behind the craft",
        source: "user",
        status: "saved",
        contentPillarId: null,
      }),
    })
    expect(idea.id).toBe("idea_manual")
  })

  it("rejects manual create when product is not owned", async () => {
    productFindFirst.mockResolvedValue(null)
    await expect(
      createIdea({
        userId: "u1",
        productId: "other_product",
        title: "Nope",
        concept: "x",
        platform: "linkedin",
        audience: "a",
        objective: "o",
        format: "post",
      })
    ).rejects.toMatchObject({ status: 404, message: "Product not found" })
    expect(ideaCreate).not.toHaveBeenCalled()
  })

  it("rejects pillar from another product on create", async () => {
    productFindFirst.mockResolvedValue({ id: "p1" })
    pillarFindFirst.mockResolvedValue(null)
    await expect(
      createIdea({
        userId: "u1",
        productId: "p1",
        contentPillarId: "pillar_other",
        title: "Cross brand",
        concept: "leak",
        platform: "linkedin",
        audience: "a",
        objective: "o",
        format: "post",
      })
    ).rejects.toMatchObject({
      status: 404,
      message: "Pillar not found for this product",
    })
    expect(ideaCreate).not.toHaveBeenCalled()
    expect(pillarFindFirst).toHaveBeenCalledWith({
      where: {
        id: "pillar_other",
        userId: "u1",
        productId: "p1",
      },
      select: { id: true },
    })
  })

  it("scopes idea updates to user and product", async () => {
    ideaFindFirst.mockResolvedValue(null)
    await expect(
      updateIdea({
        userId: "u1",
        productId: "p1",
        ideaId: "idea_x",
        status: "saved",
      })
    ).rejects.toBeInstanceOf(IdeaDomainError)
  })

  it("rejects status updates that would cross products via missing ownership", async () => {
    ideaFindFirst.mockResolvedValue(null)
    await expect(
      updateIdea({
        userId: "u1",
        productId: "other_product",
        ideaId: "idea_1",
        title: "Nope",
      })
    ).rejects.toMatchObject({ status: 404 })
  })

  it("converts idea to draft idempotently and returns existing draft", async () => {
    const idea = {
      id: "idea_1",
      userId: "u1",
      productId: "p1",
      title: "Post",
      concept: "Concept",
      platform: "linkedin",
      audience: "founders",
      objective: "trust",
      format: "post",
      explanation: "why",
      status: "saved",
    }
    const existingDraft = {
      id: "draft_1",
      contentIdeaId: "idea_1",
      userId: "u1",
      productId: "p1",
    }

    txIdeaFindFirst.mockResolvedValue(idea)
    txDraftFindFirst.mockResolvedValue(existingDraft)
    txIdeaUpdate.mockResolvedValue({ ...idea, status: "converted" })

    const first = await convertIdeaToDraft({
      userId: "u1",
      productId: "p1",
      ideaId: "idea_1",
    })
    expect(first.created).toBe(false)
    expect(first.draft.id).toBe("draft_1")
    expect(txDraftCreate).not.toHaveBeenCalled()

    const second = await convertIdeaToDraft({
      userId: "u1",
      productId: "p1",
      ideaId: "idea_1",
    })
    expect(second.created).toBe(false)
    expect(second.draft.id).toBe("draft_1")
  })

  it("converts without AI content and is safe under concurrent existing-draft checks", async () => {
    const idea = {
      id: "idea_manual_convert",
      userId: "u1",
      productId: "p1",
      title: "Workshop tour",
      concept: "Show the bench",
      platform: "instagram",
      audience: "buyers",
      objective: "trust",
      format: "carousel",
      explanation: null,
      status: "saved",
    }
    txIdeaFindFirst.mockResolvedValue(idea)
    txDraftFindFirst.mockResolvedValue(null)
    txDraftCreate.mockResolvedValue({
      id: "draft_manual",
      contentIdeaId: "idea_manual_convert",
      insightId: null,
      content: expect.any(String),
    })
    txIdeaUpdate.mockResolvedValue({ ...idea, status: "converted" })

    const result = await convertIdeaToDraft({
      userId: "u1",
      productId: "p1",
      ideaId: "idea_manual_convert",
    })

    expect(result.created).toBe(true)
    expect(txDraftCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contentIdeaId: "idea_manual_convert",
        productId: "p1",
        userId: "u1",
        insightId: null,
        generationMetaJson: expect.stringContaining("idea.convert"),
      }),
    })
  })

  it("creates a draft once when none exists and marks idea converted", async () => {
    const idea = {
      id: "idea_2",
      userId: "u1",
      productId: "p1",
      title: "New",
      concept: "C",
      platform: "x",
      audience: "a",
      objective: "o",
      format: "post",
      explanation: null,
      status: "proposed",
    }
    txIdeaFindFirst.mockResolvedValue(idea)
    txDraftFindFirst.mockResolvedValue(null)
    txDraftCreate.mockResolvedValue({
      id: "draft_new",
      contentIdeaId: "idea_2",
      insightId: null,
    })
    txIdeaUpdate.mockResolvedValue({ ...idea, status: "converted" })

    const result = await convertIdeaToDraft({
      userId: "u1",
      productId: "p1",
      ideaId: "idea_2",
    })

    expect(result.created).toBe(true)
    expect(result.draft.insightId).toBeNull()
    expect(txDraftCreate).toHaveBeenCalledTimes(1)
    expect(txIdeaUpdate).toHaveBeenCalledWith({
      where: { id: "idea_2" },
      data: { status: "converted" },
    })
  })

  it("blocks conversion of rejected ideas", async () => {
    txIdeaFindFirst.mockResolvedValue({
      id: "idea_3",
      userId: "u1",
      productId: "p1",
      status: "rejected",
    })
    await expect(
      convertIdeaToDraft({ userId: "u1", productId: "p1", ideaId: "idea_3" })
    ).rejects.toMatchObject({ message: expect.stringMatching(/Rejected/i) })
  })
})
