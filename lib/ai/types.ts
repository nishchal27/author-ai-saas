import type { z } from "zod"

export type AiProviderId = "anthropic" | "openai" | "openrouter"

export type AiTaskId =
  | "brand.summarize"
  | "strategy.generate"
  | "ideas.generate"
  | "content.generate"
  | "content.regenerate"
  | "content.repurpose"
  | "content.review"
  | "suggestions.generate"
  | "insight.extract"

export type QualityPolicy =
  | "deterministic_only"
  | "deterministic_then_optional_review"
  | "review_task"

export type AiMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type AiUsage = {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

export type AiNormalizedResult = {
  text: string
  provider: AiProviderId
  model: string
  usage?: AiUsage
  latencyMs: number
  rawFinishReason?: string
}

export type AiProviderErrorCode =
  | "missing_credentials"
  | "timeout"
  | "rate_limit"
  | "auth"
  | "context_length"
  | "content_filter"
  | "provider_error"
  | "cancelled"

export class AiProviderError extends Error {
  readonly code: AiProviderErrorCode
  readonly provider: AiProviderId
  readonly retryable: boolean

  constructor(opts: {
    code: AiProviderErrorCode
    provider: AiProviderId
    message: string
    retryable?: boolean
  }) {
    super(opts.message)
    this.name = "AiProviderError"
    this.code = opts.code
    this.provider = opts.provider
    this.retryable = opts.retryable ?? false
  }
}

export class AiOrchestrationError extends Error {
  readonly code:
    | "unknown_task"
    | "validation_failed"
    | "quality_failed"
    | "provider_failed"
    | "parse_failed"
  readonly task?: AiTaskId
  readonly details?: unknown

  constructor(opts: {
    code: AiOrchestrationError["code"]
    message: string
    task?: AiTaskId
    details?: unknown
  }) {
    super(opts.message)
    this.name = "AiOrchestrationError"
    this.code = opts.code
    this.task = opts.task
    this.details = opts.details
  }
}

export type GenerateTextRequest = {
  messages: AiMessage[]
  model: string
  maxOutputTokens: number
  temperature?: number
  timeoutMs: number
  signal?: AbortSignal
  /** Hint only — adapters may ignore if unsupported */
  jsonMode?: boolean
}

export type AiProviderAdapter = {
  id: AiProviderId
  isConfigured: () => boolean
  generateText: (req: GenerateTextRequest) => Promise<AiNormalizedResult>
}

export type TaskFallback = {
  provider: AiProviderId
  model: string
}

export type TaskDefinition = {
  id: AiTaskId
  description: string
  provider: AiProviderId
  model: string
  fallback?: TaskFallback
  maxOutputTokens: number
  timeoutMs: number
  temperature?: number
  /** Bounded retries on the primary attempt (not including fallback). */
  maxRetries: number
  usageCategory: "strategy" | "draft" | "review" | "ideas" | "brand" | "suggestions" | "insight"
  qualityPolicy: QualityPolicy
  promptVersion: string
  schemaVersion?: string
  /** When true, orchestration may attempt one JSON repair pass. */
  allowJsonRepair?: boolean
  /** Optional Zod schema for structured outputs. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputSchema?: z.ZodType<any>
}

export type ExecuteAiRequest = {
  task: AiTaskId
  messages: AiMessage[]
  userId?: string
  brandId?: string
  signal?: AbortSignal
  /** Override temperature for this call only. */
  temperature?: number
  /** Force JSON-ish response handling when adapters support it. */
  jsonMode?: boolean
  /** Skip optional AI review even if policy allows it. */
  skipAiReview?: boolean
  /** Run AI review even if policy is deterministic_only (explicit request). */
  forceAiReview?: boolean
}

export type ExecuteAiResult<T = string> = {
  ok: true
  task: AiTaskId
  text: string
  data?: T
  provider: AiProviderId
  model: string
  usage?: AiUsage
  latencyMs: number
  usedFallback: boolean
  quality: {
    deterministicPassed: boolean
    deterministicNotes: string[]
    aiReview?: { score?: number; note?: string }
  }
  promptVersion: string
  schemaVersion?: string
}

export type ExecuteAiFailure = {
  ok: false
  task: AiTaskId
  error: AiOrchestrationError | AiProviderError
}
