import { beforeEach, describe, expect, it, vi } from "vitest"
import { executeAi, completeText } from "@/lib/ai/orchestrator"
import { resetTaskRegistryCache } from "@/lib/ai/registry"
import { AiProviderError } from "@/lib/ai/types"
import type { AiProviderAdapter, GenerateTextRequest } from "@/lib/ai/types"

const generateText = vi.fn()

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

describe("orchestrator with mocked providers", () => {
  beforeEach(() => {
    generateText.mockReset()
    resetTaskRegistryCache()
    process.env.OPENAI_API_KEY = "test-openai"
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENROUTER_API_KEY
  })

  it("executes a task and returns normalized success metadata", async () => {
    generateText.mockResolvedValue({
      text: '{"score":0.9,"note":"Solid fit"}',
      provider: "openai",
      model: "gpt-4o-mini",
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      latencyMs: 12,
    })

    const result = await executeAi({
      task: "content.review",
      messages: [
        { role: "system", content: "Review" },
        { role: "user", content: "Draft" },
      ],
      jsonMode: true,
    })

    expect(result.ok).toBe(true)
    expect(result.data).toEqual({ score: 0.9, note: "Solid fit" })
    expect(result.provider).toBe("openai")
    expect(result.usage?.totalTokens).toBe(15)
    expect(generateText).toHaveBeenCalledTimes(1)
  })

  it("retries once on retryable provider errors then succeeds", async () => {
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
        latencyMs: 5,
      })

    const result = await executeAi({
      task: "content.regenerate",
      messages: [
        { role: "system", content: "Rewrite" },
        { role: "user", content: "Next step" },
      ],
    })

    expect(result.ok).toBe(true)
    expect(generateText).toHaveBeenCalledTimes(2)
  })

  it("uses explicit fallback after primary exhaustion", async () => {
    process.env.ANTHROPIC_API_KEY = "test-anthropic"
    process.env.OPENAI_API_KEY = "test-openai"
    resetTaskRegistryCache()

    generateText
      .mockRejectedValueOnce(
        new AiProviderError({
          code: "provider_error",
          provider: "anthropic",
          message: "boom",
          retryable: false,
        })
      )
      .mockResolvedValueOnce({
        text: "Fallback draft content that is long enough for quality checks.",
        provider: "openai",
        model: "gpt-4o",
        latencyMs: 8,
      })

    const result = await executeAi({
      task: "content.generate",
      messages: [
        { role: "system", content: "Write" },
        { role: "user", content: "Post" },
      ],
      skipAiReview: true,
    })

    expect(result.ok).toBe(true)
    expect(result.usedFallback).toBe(true)
  })

  it("fails when credentials are missing for required provider", async () => {
    vi.resetModules()
    // Override mock for this case: isConfigured false
    const { AiProviderError: Err } = await import("@/lib/ai/types")
    generateText.mockImplementation(() => {
      throw new Err({
        code: "missing_credentials",
        provider: "openai",
        message: "OPENAI_API_KEY is required",
        retryable: false,
      })
    })

    await expect(
      executeAi({
        task: "content.review",
        messages: [
          { role: "system", content: "x" },
          { role: "user", content: "y" },
        ],
      })
    ).rejects.toMatchObject({ code: "missing_credentials" })
  })

  it("completeText delegates to provider adapter", async () => {
    generateText.mockResolvedValue({
      text: "ok",
      provider: "openai",
      model: "gpt-4o",
      latencyMs: 1,
    })
    const text = await completeText({
      system: "s",
      user: "u",
      model: "gpt-4o",
      maxTokens: 100,
      provider: "openai",
    })
    expect(text).toBe("ok")
  })

  it("rejects malformed structured output after repair attempt", async () => {
    generateText
      .mockResolvedValueOnce({
        text: "not-json",
        provider: "openai",
        model: "gpt-4o-mini",
        latencyMs: 1,
      })
      .mockResolvedValueOnce({
        text: "still-not-json",
        provider: "openai",
        model: "gpt-4o-mini",
        latencyMs: 1,
      })

    await expect(
      executeAi({
        task: "content.review",
        messages: [
          { role: "system", content: "Review" },
          { role: "user", content: "Draft" },
        ],
        jsonMode: true,
      })
    ).rejects.toMatchObject({ code: "parse_failed" })
  })
})
