import { beforeEach, describe, expect, it, vi } from "vitest"
import { weekStartUtc } from "@/lib/planner/dates"
import { addPlanItem, PlannerDomainError } from "@/lib/planner/service"

const productFindFirst = vi.fn()
const planFindFirst = vi.fn()
const ideaFindFirst = vi.fn()
const draftFindFirst = vi.fn()
const itemFindFirst = vi.fn()
const itemAggregate = vi.fn()
const itemCreate = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    product: { findFirst: (...a: unknown[]) => productFindFirst(...a) },
    weeklyContentPlan: {
      findFirst: (...a: unknown[]) => planFindFirst(...a),
    },
    contentIdea: { findFirst: (...a: unknown[]) => ideaFindFirst(...a) },
    contentDraft: { findFirst: (...a: unknown[]) => draftFindFirst(...a) },
    weeklyPlanItem: {
      findFirst: (...a: unknown[]) => itemFindFirst(...a),
      aggregate: (...a: unknown[]) => itemAggregate(...a),
      create: (...a: unknown[]) => itemCreate(...a),
    },
  },
}))

describe("weekly planner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("normalizes weekStart to UTC Monday", () => {
    // 2026-11-19 is Thursday UTC
    const monday = weekStartUtc(new Date("2026-11-19T15:00:00.000Z"))
    expect(monday.toISOString()).toBe("2026-11-16T00:00:00.000Z")
  })

  it("rejects plan items whose idea belongs to another product", async () => {
    planFindFirst.mockResolvedValue({
      id: "plan_1",
      userId: "u1",
      productId: "p1",
    })
    ideaFindFirst.mockResolvedValue(null)

    await expect(
      addPlanItem({
        userId: "u1",
        productId: "p1",
        planId: "plan_1",
        contentIdeaId: "idea_other",
      })
    ).rejects.toBeInstanceOf(PlannerDomainError)
  })

  it("prevents duplicate idea items on the same plan", async () => {
    planFindFirst.mockResolvedValue({
      id: "plan_1",
      userId: "u1",
      productId: "p1",
    })
    ideaFindFirst.mockResolvedValue({ id: "idea_1" })
    itemFindFirst.mockResolvedValue({ id: "item_existing" })

    await expect(
      addPlanItem({
        userId: "u1",
        productId: "p1",
        planId: "plan_1",
        contentIdeaId: "idea_1",
      })
    ).rejects.toMatchObject({ status: 409 })
  })

  it("adds a draft item when ownership matches", async () => {
    planFindFirst.mockResolvedValue({
      id: "plan_1",
      userId: "u1",
      productId: "p1",
    })
    draftFindFirst.mockResolvedValue({ id: "draft_1" })
    itemFindFirst.mockResolvedValue(null)
    itemAggregate.mockResolvedValue({ _max: { sortOrder: 0 } })
    itemCreate.mockResolvedValue({
      id: "item_1",
      contentDraftId: "draft_1",
      status: "planned",
    })

    const item = await addPlanItem({
      userId: "u1",
      productId: "p1",
      planId: "plan_1",
      contentDraftId: "draft_1",
    })
    expect(item.id).toBe("item_1")
    expect(itemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u1",
          productId: "p1",
          contentDraftId: "draft_1",
        }),
      })
    )
  })
})
