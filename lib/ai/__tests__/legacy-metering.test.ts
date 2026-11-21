import { beforeEach, describe, expect, it, vi } from "vitest"
import { callAI } from "@/lib/claude"
import { resetTaskRegistryCache } from "@/lib/ai/registry"
import type { AiProviderAdapter, GenerateTextRequest } from "@/lib/ai/types"

const generateText = vi.fn()
const recordUsageAttempt = vi.fn()
const reserveAiRequestSlot = vi.fn()

vi.mock("@/lib/ai/providers", () => {
  const mockAdapter: AiProviderAdapter = {
    id: "openai",
    isConfigured: () => true,
    generateText: (req: GenerateTextRequest) => generateText(req),
  }
  return {
    getProviderAdapter: () => mockAdapter,
    requireConfiguredProvider: () => mockAdapter,
    anthropicAdapter: mockAdapter,
    openaiAdapter: mockAdapter,
    openrouterAdapter: mockAdapter,
  }
})

vi.mock("@/lib/usage/meter", async () => {
  const actual = await vi.importActual<typeof import("@/lib/usage/meter")>(
    "@/lib/usage/meter"
  )
  return {
    ...actual,
    recordUsageAttempt: (...args: unknown[]) => recordUsageAttempt(...args),
    reserveAiRequestSlot: (...args: unknown[]) => reserveAiRequestSlot(...args),
  }
})

describe("legacy callAI metering", () => {
  beforeEach(() => {
    generateText.mockReset()
    recordUsageAttempt.mockReset()
    reserveAiRequestSlot.mockReset()
    recordUsageAttempt.mockResolvedValue(undefined)
    reserveAiRequestSlot.mockResolvedValue(undefined)
    resetTaskRegistryCache()
    process.env.OPENAI_API_KEY = "test-openai"
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENROUTER_API_KEY
  })

  it("routes callAI through executeAi and records usage", async () => {
    generateText.mockResolvedValue({
      text: JSON.stringify({
        coreProblem: "p",
        solution: "s",
        audience: "a",
        whyMatters: "w",
      }),
      provider: "openai",
      model: "gpt-4o",
      usage: { inputTokens: 5, outputTokens: 3 },
      latencyMs: 2,
    })

    const text = await callAI("sys", "user", "gpt-4o", 1000, {
      userId: "user_1",
      brandId: "prod_1",
      task: "insight.extract",
    })

    expect(text).toContain("coreProblem")
    expect(reserveAiRequestSlot).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        taskId: "insight.extract",
        productId: "prod_1",
      })
    )
    expect(recordUsageAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        productId: "prod_1",
        taskId: "insight.extract",
        status: "success",
        usage: { inputTokens: 5, outputTokens: 3 },
      })
    )
  })
})
