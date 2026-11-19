import { beforeEach, describe, expect, it, vi } from "vitest"

const findFirstProduct = vi.fn()
const findFirstUser = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    product: { findFirst: (...args: unknown[]) => findFirstProduct(...args) },
    user: { findFirst: (...args: unknown[]) => findFirstUser(...args) },
  },
}))

describe("assembleBrandContext ownership", () => {
  beforeEach(() => {
    findFirstProduct.mockReset()
    findFirstUser.mockReset()
  })

  it("scopes product load by userId and rejects missing ownership", async () => {
    const { assembleBrandContext } = await import("@/lib/brand-context/assembler")

    findFirstProduct.mockResolvedValueOnce(null)

    await expect(
      assembleBrandContext({
        userId: "user_a",
        productId: "prod_owned_by_b",
        task: "ideas.generate",
      })
    ).rejects.toThrow(/Product not found/)

    expect(findFirstProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod_owned_by_b", userId: "user_a" },
      })
    )
    expect(findFirstUser).not.toHaveBeenCalled()
  })

  it("loads only brand-relevant user fields (no email/credentials)", async () => {
    const { assembleBrandContext } = await import("@/lib/brand-context/assembler")

    findFirstProduct.mockResolvedValueOnce({
      id: "prod_1",
      name: "Varabhi Demo",
      type: "saas",
      industry: "devtools",
      audience: "founders",
      audienceDetail: null,
      stage: "launched",
      salesMotion: "self_serve",
      website: null,
      description: "Demo",
      competitors: null,
      techStackJson: null,
      brandSummaryApproved: null,
      brandFactsApproved: null,
      brandFactsProposed: null,
      brandVoiceJson: null,
      brandApprovedAt: null,
      brandProfileStatus: "incomplete",
      strategy: null,
    })
    findFirstUser.mockResolvedValueOnce({
      brandVoice: null,
      founderBio: "Builder",
    })

    const ctx = await assembleBrandContext({
      userId: "user_a",
      productId: "prod_1",
      task: "brand.summarize",
    })

    expect(findFirstUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_a" },
        select: { brandVoice: true, founderBio: true },
      })
    )
    expect(ctx.untrusted.founderBio).toBe("Builder")
    expect(JSON.stringify(ctx)).not.toMatch(/email|password|clerk|stripe/i)
  })
})
