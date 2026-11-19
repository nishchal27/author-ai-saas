import Anthropic from "@anthropic-ai/sdk"
import type { AiProviderAdapter, GenerateTextRequest } from "@/lib/ai/types"
import { AiProviderError } from "@/lib/ai/types"
import { normalizeProviderError, withTimeout } from "@/lib/ai/providers/errors"

let client: Anthropic | null = null

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    throw new AiProviderError({
      code: "missing_credentials",
      provider: "anthropic",
      message: "ANTHROPIC_API_KEY is not configured",
      retryable: false,
    })
  }
  if (!client) {
    client = new Anthropic({ apiKey: key })
  }
  return client
}

export const anthropicAdapter: AiProviderAdapter = {
  id: "anthropic",
  isConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY),
  async generateText(req: GenerateTextRequest) {
    const started = Date.now()
    try {
      const system = req.messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n")
      const messages = req.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))

      const anthropic = getClient()
      const response = await withTimeout(
        anthropic.messages.create(
          {
            model: req.model,
            max_tokens: req.maxOutputTokens,
            temperature: req.temperature,
            system: system || undefined,
            messages,
          },
          req.signal ? { signal: req.signal } : undefined
        ),
        req.timeoutMs,
        "anthropic",
        req.signal
      )

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => ("text" in block ? block.text : ""))
        .join("\n")
        .trim()

      if (!text) {
        throw new AiProviderError({
          code: "provider_error",
          provider: "anthropic",
          message: "Anthropic returned empty text",
          retryable: false,
        })
      }

      return {
        text,
        provider: "anthropic" as const,
        model: req.model,
        usage: {
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens,
          totalTokens:
            (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0) ||
            undefined,
        },
        latencyMs: Date.now() - started,
        rawFinishReason: response.stop_reason ?? undefined,
      }
    } catch (err) {
      throw normalizeProviderError("anthropic", err)
    }
  },
}
