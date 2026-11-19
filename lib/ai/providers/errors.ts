import { AiProviderError, type AiProviderId } from "@/lib/ai/types"

export function normalizeProviderError(
  provider: AiProviderId,
  err: unknown,
  fallbackMessage = "Provider request failed"
): AiProviderError {
  if (err instanceof AiProviderError) return err

  const message = err instanceof Error ? err.message : String(err)
  const name = err instanceof Error ? err.name : ""
  const lower = message.toLowerCase()

  if (name === "AbortError" || lower.includes("aborted") || lower.includes("timeout")) {
    return new AiProviderError({
      code: "timeout",
      provider,
      message: `${provider} request timed out`,
      retryable: true,
    })
  }
  if (lower.includes("api key") || lower.includes("unauthorized") || lower.includes("401")) {
    return new AiProviderError({
      code: "auth",
      provider,
      message: `${provider} authentication failed`,
      retryable: false,
    })
  }
  if (lower.includes("rate limit") || lower.includes("429") || lower.includes("too many")) {
    return new AiProviderError({
      code: "rate_limit",
      provider,
      message: `${provider} rate limit exceeded`,
      retryable: true,
    })
  }
  if (lower.includes("context") || lower.includes("maximum") || lower.includes("token")) {
    return new AiProviderError({
      code: "context_length",
      provider,
      message: `${provider} context length exceeded`,
      retryable: false,
    })
  }
  if (lower.includes("content") && lower.includes("filter")) {
    return new AiProviderError({
      code: "content_filter",
      provider,
      message: `${provider} content filter blocked the response`,
      retryable: false,
    })
  }

  return new AiProviderError({
    code: "provider_error",
    provider,
    message: fallbackMessage,
    retryable: false,
  })
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  provider: AiProviderId,
  signal?: AbortSignal
): Promise<T> {
  if (signal?.aborted) {
    throw new AiProviderError({
      code: "cancelled",
      provider,
      message: `${provider} request cancelled`,
      retryable: false,
    })
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new AiProviderError({
          code: "timeout",
          provider,
          message: `${provider} request timed out after ${timeoutMs}ms`,
          retryable: true,
        })
      )
    }, timeoutMs)
  })

  const onAbort = () => {
    // timeout promise already racing; abort surfaces via AbortError from SDK when supported
  }
  signal?.addEventListener("abort", onAbort, { once: true })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
    signal?.removeEventListener("abort", onAbort)
  }
}
