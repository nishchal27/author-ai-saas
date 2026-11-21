import { beforeEach, describe, expect, it, vi } from "vitest"
import { generateMarketingStrategy } from "@/lib/strategy"

const executeAi = vi.fn()

vi.mock("@/lib/ai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai")>("@/lib/ai")
  return {
    ...actual,
    executeAi: (...args: unknown[]) => executeAi(...args),
  }
})

const profile = {
  name: "Varabhi",
  type: "saas" as const,
  industry: "marketing",
  audience: "founders",
  stage: "launched" as const,
  salesMotion: "self_serve" as const,
}

describe("generateMarketingStrategy metering", () => {
  beforeEach(() => {
    executeAi.mockReset()
  })

  it("skips AI when skipAi is set (brand create rate-limit path)", async () => {
    const result = await generateMarketingStrategy(profile, "standard", {
      userId: "u1",
      productId: "p1",
      skipAi: true,
    })
    expect(executeAi).not.toHaveBeenCalled()
    expect(result.confidence).toBe(0.6)
    expect(result.summary.toLowerCase()).toContain("because you are building")
  })

  it("skips AI when metering userId is missing (no silent unmetered calls)", async () => {
    const result = await generateMarketingStrategy(profile, "standard")
    expect(executeAi).not.toHaveBeenCalled()
    expect(result.confidence).toBe(0.6)
  })

  it("calls executeAi with user and product when metering provided", async () => {
    executeAi.mockResolvedValue({
      data: {
        platforms: [
          { platform: "linkedin", priority: "primary", reasoning: "B2B" },
        ],
        contentTypes: [{ type: "post", recommended: true, reasoning: "ok" }],
        tone: { style: "Clear", examples: ["a"], avoid: ["hype"] },
        cadence: { frequency: "2x", postsPerWeek: 2, reasoning: "steady" },
        proofTypes: ["case_study"],
        antiPatterns: [{ pattern: "hype", reasoning: "trust" }],
        summary: "Because you are building Varabhi, focus on LinkedIn.",
        reasoning: "Founders need clarity.",
        confidence: 0.85,
      },
      text: "{}",
    })

    const result = await generateMarketingStrategy(profile, "standard", {
      userId: "u1",
      productId: "p1",
    })

    expect(executeAi).toHaveBeenCalledWith(
      expect.objectContaining({
        task: "strategy.generate",
        userId: "u1",
        brandId: "p1",
      })
    )
    expect(result.confidence).toBe(0.85)
  })
})
