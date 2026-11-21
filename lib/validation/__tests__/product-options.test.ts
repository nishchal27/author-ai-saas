import { describe, expect, it } from "vitest"
import {
  INDUSTRIES,
  PRODUCT_TYPES,
  BUSINESS_MODELS,
  SALES_APPROACHES,
  labelFor,
  normalizeIndustry,
} from "@/lib/product-options"
import { productCreateSchema } from "@/lib/validation"

describe("product options", () => {
  it("keeps product type, industry, business model, and sales approach as distinct lists", () => {
    expect(PRODUCT_TYPES.some((t) => t.value === "physical")).toBe(true)
    expect(PRODUCT_TYPES.some((t) => t.value === "other")).toBe(true)
    expect(INDUSTRIES.some((i) => i.value === "retail_ecommerce")).toBe(true)
    expect(INDUSTRIES.some((i) => i.label.toLowerCase() === "e-commerce")).toBe(
      false
    )
    expect(BUSINESS_MODELS.some((m) => m.value === "dtc")).toBe(true)
    expect(SALES_APPROACHES.some((s) => s.value === "self_serve")).toBe(true)
    // Sales approach values must not collide with industry values
    const industryValues = new Set<string>(INDUSTRIES.map((i) => i.value))
    for (const s of SALES_APPROACHES) {
      expect(industryValues.has(s.value)).toBe(false)
    }
  })

  it("normalizes legacy free-text industries without inventing ecommerce as type", () => {
    expect(normalizeIndustry("E-commerce")).toBe("retail_ecommerce")
    expect(normalizeIndustry("devtools")).toBe("technology")
    expect(normalizeIndustry("Fashion & Apparel")).toBe("fashion_apparel")
    expect(normalizeIndustry("fashion_apparel")).toBe("fashion_apparel")
    expect(normalizeIndustry("something unique")).toBe("other")
  })

  it("labels known option values", () => {
    expect(labelFor(PRODUCT_TYPES, "physical")).toBe("Physical Product")
    expect(labelFor(SALES_APPROACHES, "demo")).toBe("Demo → Subscribe")
  })
})

describe("productCreateSchema onboarding payload", () => {
  it("accepts manual brand create without AI fields", () => {
    const parsed = productCreateSchema.safeParse({
      name: "Assam Craft Co.",
      type: "physical",
      industry: "fashion_apparel",
      audience: "consumers",
      stage: "growing",
      salesMotion: "impulse",
      businessModel: "dtc",
      description: "Handmade jewellery",
    })
    expect(parsed.success).toBe(true)
  })

  it("requires industry and allows null businessModel", () => {
    expect(
      productCreateSchema.safeParse({
        name: "X",
        type: "saas",
        industry: "",
        audience: "developers",
        stage: "building",
        salesMotion: "self_serve",
      }).success
    ).toBe(false)

    const ok = productCreateSchema.safeParse({
      name: "X",
      type: "saas",
      industry: "technology",
      audience: "developers",
      stage: "building",
      salesMotion: "self_serve",
      businessModel: null,
    })
    expect(ok.success).toBe(true)
  })
})
