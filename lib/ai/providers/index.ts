import type { AiProviderAdapter, AiProviderId } from "@/lib/ai/types"
import { AiProviderError } from "@/lib/ai/types"
import { anthropicAdapter } from "@/lib/ai/providers/anthropic"
import { openaiAdapter } from "@/lib/ai/providers/openai"
import { openrouterAdapter } from "@/lib/ai/providers/openrouter"

const adapters: Record<AiProviderId, AiProviderAdapter> = {
  anthropic: anthropicAdapter,
  openai: openaiAdapter,
  openrouter: openrouterAdapter,
}

export function getProviderAdapter(id: AiProviderId): AiProviderAdapter {
  return adapters[id]
}

export function requireConfiguredProvider(id: AiProviderId): AiProviderAdapter {
  const adapter = getProviderAdapter(id)
  if (!adapter.isConfigured()) {
    const envName =
      id === "anthropic"
        ? "ANTHROPIC_API_KEY"
        : id === "openai"
          ? "OPENAI_API_KEY"
          : "OPENROUTER_API_KEY"
    throw new AiProviderError({
      code: "missing_credentials",
      provider: id,
      message: `${envName} is required for provider "${id}"`,
      retryable: false,
    })
  }
  return adapter
}

export { anthropicAdapter, openaiAdapter, openrouterAdapter }
