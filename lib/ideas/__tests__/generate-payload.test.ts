import { describe, expect, it } from "vitest"
import { contentGenerateSchema } from "@/lib/validation"

describe("idea-to-draft generate payload", () => {
  it("accepts ideaId without insightId", () => {
    const result = contentGenerateSchema.safeParse({
      ideaId: "clg1a2b3c4d5e6f7g8h9i0j1k",
      platform: "linkedin",
      type: "post",
      productId: "clg1a2b3c4d5e6f7g8h9i0j1k",
    })
    expect(result.success).toBe(true)
  })

  it("still accepts legacy insightId", () => {
    const result = contentGenerateSchema.safeParse({
      insightId: "clg1a2b3c4d5e6f7g8h9i0j1k",
      platform: "twitter",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty generate body", () => {
    const result = contentGenerateSchema.safeParse({ platform: "linkedin" })
    expect(result.success).toBe(false)
  })
})
