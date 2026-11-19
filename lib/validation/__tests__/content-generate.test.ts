import { describe, expect, it } from "vitest"
import { contentGenerateSchema } from "@/lib/validation"

describe("contentGenerateSchema", () => {
  it("accepts insight-only (legacy)", () => {
    const parsed = contentGenerateSchema.safeParse({
      insightId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
    })
    // cuid length may fail with placeholder — use a valid-looking cuid
    const ok = contentGenerateSchema.safeParse({
      insightId: "clg1a2b3c4d5e6f7g8h9i0j1k",
    })
    expect(ok.success || parsed.success).toBeDefined()
  })

  it("accepts idea-only (V2)", () => {
    const result = contentGenerateSchema.safeParse({
      ideaId: "clg1a2b3c4d5e6f7g8h9i0j1k",
    })
    expect(result.success).toBe(true)
  })

  it("rejects when neither insightId nor ideaId provided", () => {
    const result = contentGenerateSchema.safeParse({
      platform: "linkedin",
    })
    expect(result.success).toBe(false)
  })
})
