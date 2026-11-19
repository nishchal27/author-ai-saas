import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  convertIdeaToDraft,
  IdeaDomainError,
  updateIdea,
} from "@/lib/ideas/service"

const productFindFirst = vi.fn()
const ideaFindFirst = vi.fn()
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
