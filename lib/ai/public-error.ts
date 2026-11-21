/**
 * Map AI / provider failures to safe client-facing messages.
 * Never include credentials, stack traces, or raw provider payloads.
 */

import { hasAnyAiProviderKey } from "@/lib/env"

export type AiPublicError = {
  status: number
  error: string
  code:
    | "AI_NOT_CONFIGURED"
    | "AI_RATE_LIMITED"
    | "AI_PROVIDER_REJECTED"
    | "AI_TEMPORARY_FAILURE"
    | "AI_FAILED"
}

export function toAiPublicError(err: unknown): AiPublicError {
  if (!hasAnyAiProviderKey()) {
    return {
      status: 503,
      code: "AI_NOT_CONFIGURED",
      error:
        "AI is not configured for this environment. You can continue with manual brand approval, ideas, and draft conversion.",
    }
  }

  const message = err instanceof Error ? err.message : String(err)
  const lower = message.toLowerCase()
  const code =
    typeof err === "object" &&
    err &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
      ? (err as { code: string }).code
      : ""

  if (
    code === "missing_credentials" ||
    lower.includes("api key") ||
    lower.includes("not configured")
  ) {
    return {
      status: 503,
      code: "AI_NOT_CONFIGURED",
      error:
        "AI provider is not configured. Use manual workflows or ask an admin to add a provider key.",
    }
  }

  if (
    code === "rate_limited" ||
    code === "daily_cap_exceeded" ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("daily ai usage limit")
  ) {
    return {
      status: 429,
      code: "AI_RATE_LIMITED",
      error: "AI usage limit reached. Try again later, or continue manually.",
    }
  }

  if (
    code === "provider_error" ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("invalid_api_key")
  ) {
    return {
      status: 502,
      code: "AI_PROVIDER_REJECTED",
      error:
        "The AI provider rejected the request. Your existing data was not changed.",
    }
  }

  if (
    code === "timeout" ||
    lower.includes("timeout") ||
    lower.includes("temporar") ||
    lower.includes("unavailable")
  ) {
    return {
      status: 503,
      code: "AI_TEMPORARY_FAILURE",
      error:
        "The AI provider is temporarily unavailable. Try again later — your existing draft was kept.",
    }
  }

  return {
    status: 502,
    code: "AI_FAILED",
    error:
      "AI generation failed. You can continue with manual drafts; existing content was not overwritten.",
  }
}
