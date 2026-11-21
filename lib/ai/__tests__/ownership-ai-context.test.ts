import { describe, expect, it } from "vitest"
import { buildAssembledBrandContext } from "@/lib/brand-context/assembler"

/**
 * Cross-brand isolation for AI context:
 * assembleBrandContext / buildAssembledBrandContext only trust the product row
 * the caller loaded with userId scope. A foreign brand's facts must never appear
 * just because a client sent another productId.
 */
describe("cross-brand AI context isolation", () => {
  it("keeps approved facts scoped to the product row provided", () => {
    const brandA = buildAssembledBrandContext({
      product: {
        id: "brand_a",
        name: "Brand A",
        type: "saas",
        industry: "a",
        audience: "a",
        audienceDetail: null,
        stage: "launched",
        salesMotion: "self_serve",
        website: null,
        description: "A",
        competitors: null,
        techStackJson: null,
        brandSummaryApproved: "Brand A approved",
        brandFactsApproved: JSON.stringify([
          { id: "1", text: "Secret of A", source: "user" },
        ]),
        brandFactsProposed: null,
        brandVoiceJson: JSON.stringify({ tone: "A tone" }),
        brandApprovedAt: new Date(),
        brandProfileStatus: "approved",
        strategy: null,
      },
      task: "content.generate",
    })

    const brandB = buildAssembledBrandContext({
      product: {
        id: "brand_b",
        name: "Brand B",
        type: "saas",
        industry: "b",
        audience: "b",
        audienceDetail: null,
        stage: "launched",
        salesMotion: "self_serve",
        website: null,
        description: "B",
        competitors: null,
        techStackJson: null,
        brandSummaryApproved: "Brand B approved",
        brandFactsApproved: JSON.stringify([
          { id: "2", text: "Secret of B", source: "user" },
        ]),
        brandFactsProposed: null,
        brandVoiceJson: JSON.stringify({ tone: "B tone" }),
        brandApprovedAt: new Date(),
        brandProfileStatus: "approved",
        strategy: null,
      },
      task: "content.generate",
    })

    expect(brandA.approved.facts.map((f) => f.text)).toEqual(["Secret of A"])
    expect(brandB.approved.facts.map((f) => f.text)).toEqual(["Secret of B"])
    expect(JSON.stringify(brandA)).not.toContain("Secret of B")
    expect(JSON.stringify(brandB)).not.toContain("Secret of A")
  })
})
