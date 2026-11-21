import { describe, expect, it } from "vitest"
import { parseBody, productCreateSchema } from "@/lib/validation"

describe("website validation and parseBody", () => {
  it("rejects incomplete website URLs with a clear message", async () => {
    const parsed = parseBody(
      {
        name: "Acme",
        type: "saas",
        industry: "devtools",
        audience: "founders",
        stage: "launched",
        salesMotion: "self_serve",
        website: "example.com",
      },
      productCreateSchema
    )
    expect("error" in parsed).toBe(true)
    if ("error" in parsed) {
      const body = await parsed.error.json()
      expect(body.code).toBe("VALIDATION_ERROR")
      expect(String(body.details)).toMatch(/https:\/\//i)
    }
  })

  it("accepts empty website and full https URLs", () => {
    const empty = parseBody(
      {
        name: "Acme",
        type: "saas",
        industry: "devtools",
        audience: "founders",
        stage: "launched",
        salesMotion: "self_serve",
        website: "",
      },
      productCreateSchema
    )
    expect("data" in empty).toBe(true)

    const ok = parseBody(
      {
        name: "Acme",
        type: "saas",
        industry: "devtools",
        audience: "founders",
        stage: "launched",
        salesMotion: "self_serve",
        website: "https://example.com",
      },
      productCreateSchema
    )
    expect("data" in ok).toBe(true)
  })
})
