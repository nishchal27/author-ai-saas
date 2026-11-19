import OpenAI from "openai"
import type { AiProviderAdapter, GenerateTextRequest } from "@/lib/ai/types"
import { AiProviderError } from "@/lib/ai/types"
import { normalizeProviderError, withTimeout } from "@/lib/ai/providers/errors"

let client: OpenAI | null = null

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new AiProviderError({
      code: "missing_credentials",
      provider: "openai",
      message: "OPENAI_API_KEY is not configured",
      retryable: false,
    })
  }
  if (!client) {
    client = new OpenAI({ apiKey: key })
  }
  return client
}

export const openaiAdapter: AiProviderAdapter = {
  id: "openai",
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
  async generateText(req: GenerateTextRequest) {
    const started = Date.now()
    try {
      const openai = getClient()
      const completion = await withTimeout(
        openai.chat.completions.create(
          {
            model: req.model,
            max_tokens: req.maxOutputTokens,
            temperature: req.temperature,
            messages: req.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            ...(req.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
          },
          req.signal ? { signal: req.signal } : undefined
        ),
        req.timeoutMs,
        "openai",
        req.signal
      )

      const text = completion.choices[0]?.message?.content?.trim()
      if (!text) {
        throw new AiProviderError({
          code: "provider_error",
          provider: "openai",
          message: "OpenAI returned empty text",
          retryable: false,
        })
      }

      return {
        text,
        provider: "openai" as const,
        model: req.model,
        usage: {
          inputTokens: completion.usage?.prompt_tokens,
          outputTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
        latencyMs: Date.now() - started,
        rawFinishReason: completion.choices[0]?.finish_reason ?? undefined,
      }
    } catch (err) {
      throw normalizeProviderError("openai", err)
    }
  },
}
