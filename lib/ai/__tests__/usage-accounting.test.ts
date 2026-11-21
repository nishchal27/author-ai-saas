import { beforeEach, describe, expect, it, vi } from "vitest"
import { executeAi } from "@/lib/ai/orchestrator"
import { resetTaskRegistryCache } from "@/lib/ai/registry"
import { AiProviderError } from "@/lib/ai/types"
import type { AiProviderAdapter, GenerateTextRequest } from "@/lib/ai/types"

const generateText = vi.fn()
const recordUsageAttempt = vi.fn()

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
    reserveAiRequestSlot: vi.fn().mockResolvedValue(undefined),
  }
})

describe("orchestrator usage accounting", () => {
  beforeEach(() => {
    generateText.mockReset()
    recordUsageAttempt.mockReset()
    recordUsageAttempt.mockResolvedValue(undefined)
    resetTaskRegistryCache()
    process.env.OPENAI_API_KEY = "test-openai"
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENROUTER_API_KEY
  })

  it("records failed then successful attempts without inventing client tokens", async () => {
    generateText
      .mockRejectedValueOnce(
        new AiProviderError({
          code: "timeout",
          provider: "openai",
          message: "timeout",
          retryable: true,
        })
      )
      .mockResolvedValueOnce({
        text: "Hello world content that is long enough to pass checks.",
        provider: "openai",
        model: "gpt-4o",
        usage: { inputTokens: 11, outputTokens: 7 },
        latencyMs: 5,
      })

    await executeAi({
      task: "content.regenerate",
      userId: "user_1",
      brandId: "prod_1",
      messages: [
        { role: "system", content: "Rewrite" },
        { role: "user", content: "Next step" },
      ],
    })

    expect(recordUsageAttempt).toHaveBeenCalled()
    const calls = recordUsageAttempt.mock.calls.map((c) => c[0])
    const failed = calls.find((c) => c.status === "provider_error")
    const success = calls.find((c) => c.status === "success")
    expect(failed).toBeTruthy()
    expect(failed.usage).toBeUndefined()
    expect(success.usage).toEqual({ inputTokens: 11, outputTokens: 7 })
    expect(success.productId).toBe("prod_1")
    // Same requestId for both attempts under one user task
    expect(failed.requestId).toBe(success.requestId)
    expect(failed.attemptIndex).not.toBe(success.attemptIndex)
  })

  it("skips DB usage writes when userId is absent", async () => {
    generateText.mockResolvedValue({
      text: '{"score":0.5,"note":"ok"}',
      provider: "openai",
      model: "gpt-4o-mini",
      usage: { inputTokens: 1, outputTokens: 1 },
      latencyMs: 1,
    })

    await executeAi({
      task: "content.review",
      messages: [
        { role: "system", content: "Review" },
        { role: "user", content: "Draft" },
      ],
      jsonMode: true,
    })

    expect(recordUsageAttempt).not.toHaveBeenCalled()
  })
})
