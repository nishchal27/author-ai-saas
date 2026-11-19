import OpenAI from "openai"
import type { AiProviderAdapter, GenerateTextRequest } from "@/lib/ai/types"
import { AiProviderError } from "@/lib/ai/types"
import { normalizeProviderError, withTimeout } from "@/lib/ai/providers/errors"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

let client: OpenAI | null = null

function getClient(): OpenAI {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    throw new AiProviderError({
      code: "missing_credentials",
      provider: "openrouter",
      message: "OPENROUTER_API_KEY is not configured",
      retryable: false,
    })
  }
  if (!client) {
    client = new OpenAI({
      apiKey: key,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL }
          : {}),
        "X-Title": process.env.OPENROUTER_APP_TITLE || "Varabhi",
      },
    })
  }
  return client
}

export const openrouterAdapter: AiProviderAdapter = {
  id: "openrouter",
  isConfigured: () => Boolean(process.env.OPENROUTER_API_KEY),
  async generateText(req: GenerateTextRequest) {
    const started = Date.now()
    try {
      const openrouter = getClient()
      const completion = await withTimeout(
        openrouter.chat.completions.create(
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
        "openrouter",
        req.signal
      )

      const text = completion.choices[0]?.message?.content?.trim()
      if (!text) {
        throw new AiProviderError({
          code: "provider_error",
          provider: "openrouter",
          message: "OpenRouter returned empty text",
          retryable: false,
        })
      }

      return {
        text,
        provider: "openrouter" as const,
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
      throw normalizeProviderError("openrouter", err)
    }
  },
}
