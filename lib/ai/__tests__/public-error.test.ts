import { afterEach, describe, expect, it } from "vitest"
import { toAiPublicError } from "@/lib/ai/public-error"

const ORIGINAL = {
  anthropic: process.env.ANTHROPIC_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  openrouter: process.env.OPENROUTER_API_KEY,
}

afterEach(() => {
  for (const [k, v] of Object.entries({
    ANTHROPIC_API_KEY: ORIGINAL.anthropic,
    OPENAI_API_KEY: ORIGINAL.openai,
    OPENROUTER_API_KEY: ORIGINAL.openrouter,
  })) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

describe("toAiPublicError", () => {
  it("reports AI not configured when no provider keys exist", () => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.OPENROUTER_API_KEY
    const err = toAiPublicError(new Error("anything"))
    expect(err.code).toBe("AI_NOT_CONFIGURED")
    expect(err.status).toBe(503)
    expect(err.error.toLowerCase()).toContain("manual")
  })

  it("maps rate limits and provider rejection without leaking internals", () => {
    process.env.OPENAI_API_KEY = "test"
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENROUTER_API_KEY

    const rate = toAiPublicError({ code: "rate_limited", message: "secret sk-abc" })
    expect(rate.code).toBe("AI_RATE_LIMITED")
    expect(rate.error).not.toMatch(/sk-/)

    const rejected = toAiPublicError({
      code: "provider_error",
      message: "invalid_api_key xyz",
    })
    expect(rejected.code).toBe("AI_PROVIDER_REJECTED")
    expect(rejected.error).not.toMatch(/xyz/)
  })
})
