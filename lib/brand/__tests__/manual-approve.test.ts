import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  approveBrandSummary,
  saveManualBrandProposal,
} from "@/lib/brand/summarize"

const productUpdateMany = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    product: {
      updateMany: (...args: unknown[]) => productUpdateMany(...args),
    },
  },
}))

vi.mock("@/lib/ai", () => ({
  executeAi: vi.fn(),
}))

vi.mock("@/lib/brand-context/assembler", () => ({
  assembleBrandContext: vi.fn(),
}))

describe("manual brand proposal and approval", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    productUpdateMany.mockResolvedValue({ count: 1 })
  })

  it("saves a manual proposal as proposed without approving", async () => {
    const result = await saveManualBrandProposal({
      userId: "u1",
      productId: "p1",
      summary: "Assam craft jewellery for gift buyers",
      facts: [{ text: "Handmade in Assam" }],
      voice: { tone: "Warm and grounded" },
    })

    expect(result.status).toBe("proposed")
    expect(productUpdateMany).toHaveBeenCalledWith({
      where: { id: "p1", userId: "u1" },
      data: expect.objectContaining({
        brandSummaryProposed: "Assam craft jewellery for gift buyers",
        brandProfileStatus: "proposed",
      }),
    })
    const data = productUpdateMany.mock.calls[0][0].data
    expect(data.brandSummaryApproved).toBeUndefined()
    expect(data.brandApprovedAt).toBeUndefined()
    expect(data.brandVoiceJson).toBeUndefined()
    const factsWrap = JSON.parse(data.brandFactsProposed)
    expect(factsWrap.facts[0].source).toBe("user")
    expect(factsWrap.voice).toEqual({ tone: "Warm and grounded" })
  })

  it("approves manual facts with user source and sets approved status", async () => {
    const result = await approveBrandSummary({
      userId: "u1",
      productId: "p1",
      summary: "Approved summary",
      facts: [
        { id: "f1", text: "Handmade in Assam", source: "user" },
      ],
    })

    expect(result.status).toBe("approved")
    expect(productUpdateMany).toHaveBeenCalledWith({
      where: { id: "p1", userId: "u1" },
      data: expect.objectContaining({
        brandSummaryApproved: "Approved summary",
        brandProfileStatus: "approved",
      }),
    })
    const approved = JSON.parse(
      productUpdateMany.mock.calls[0][0].data.brandFactsApproved
    )
    expect(approved[0].source).toBe("user")
  })

  it("rejects update when product is not owned", async () => {
    productUpdateMany.mockResolvedValue({ count: 0 })
    await expect(
      saveManualBrandProposal({
        userId: "u1",
        productId: "other",
        summary: "Nope",
        facts: [{ text: "x" }],
      })
    ).rejects.toThrow(/not found/i)
  })
})
