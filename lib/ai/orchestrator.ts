import { parseAndValidate } from "@/lib/ai/parse"
import { requireConfiguredProvider } from "@/lib/ai/providers"
import { runDeterministicChecks, shouldRunAiReview } from "@/lib/ai/quality"
import { getTaskDefinition } from "@/lib/ai/registry"
import type {
  AiNormalizedResult,
  AiProviderId,
  AiTaskId,
  ExecuteAiRequest,
  ExecuteAiResult,
  TaskDefinition,
} from "@/lib/ai/types"
import { AiOrchestrationError, AiProviderError } from "@/lib/ai/types"
import { DAILY_AI_REQUEST_CAP } from "@/lib/rate-limit"
import {
  AiDailyCapExceededError,
  newAiRequestId,
  recordUsageAttempt,
  reserveAiRequestSlot,
  type UsageAttemptKind,
} from "@/lib/usage/meter"

function logAiEvent(event: Record<string, unknown>) {
  // Structured, no prompts/secrets
  console.info(
    JSON.stringify({
      scope: "ai",
      ts: new Date().toISOString(),
      ...event,
    })
  )
}

type AttemptContext = {
  requestId: string
  userId?: string
  productId?: string | null
  taskId: string
}

async function runOnce(
  def: TaskDefinition,
  provider: AiProviderId,
  model: string,
  req: ExecuteAiRequest,
  ctx: AttemptContext,
  baseKind: "primary" | "fallback" | "repair" | "review_nested",
  attemptOffset = 0
): Promise<AiNormalizedResult> {
  const adapter = requireConfiguredProvider(provider)
  let lastError: unknown

  for (let attempt = 0; attempt <= def.maxRetries; attempt++) {
    const attemptKind: UsageAttemptKind =
      attempt === 0
        ? baseKind
        : baseKind === "primary" || baseKind === "fallback"
          ? "retry"
          : baseKind
    const attemptIndex = attemptOffset + attempt
    const started = Date.now()

    try {
      const result = await adapter.generateText({
        messages: req.messages,
        model,
        maxOutputTokens: def.maxOutputTokens,
        temperature: req.temperature ?? def.temperature,
        timeoutMs: def.timeoutMs,
        signal: req.signal,
        jsonMode: req.jsonMode ?? Boolean(def.outputSchema),
      })

      if (ctx.userId) {
        await recordUsageAttempt({
          userId: ctx.userId,
          productId: ctx.productId,
          requestId: ctx.requestId,
          taskId: ctx.taskId,
          provider: result.provider,
          model: result.model,
          attemptKind,
          attemptIndex,
          status: "success",
          usage: result.usage,
          latencyMs: result.latencyMs ?? Date.now() - started,
        })
      }

      return result
    } catch (err) {
      lastError = err
      if (ctx.userId) {
        await recordUsageAttempt({
          userId: ctx.userId,
          productId: ctx.productId,
          requestId: ctx.requestId,
          taskId: ctx.taskId,
          provider,
          model,
          attemptKind,
          attemptIndex,
          status:
            err instanceof AiProviderError ? "provider_error" : "failed",
          latencyMs: Date.now() - started,
        })
      }

      const retryable = err instanceof AiProviderError && err.retryable
      if (!retryable || attempt >= def.maxRetries) break
      logAiEvent({
        event: "retry",
        task: def.id,
        provider,
        model,
        attempt: attempt + 1,
        requestId: ctx.requestId,
        code: err instanceof AiProviderError ? err.code : "provider_error",
      })
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new AiProviderError({
        code: "provider_error",
        provider,
        message: "Provider request failed",
      })
}

async function maybeParseStructured<T>(
  def: TaskDefinition,
  text: string,
  req: ExecuteAiRequest,
  ctx: AttemptContext,
  successfulResult: AiNormalizedResult
): Promise<{ text: string; data?: T }> {
  if (!def.outputSchema) {
    return { text }
  }

  try {
    const data = parseAndValidate<T>(text, def.outputSchema, {
      task: def.id,
      schemaVersion: def.schemaVersion,
    })
    return { text, data }
  } catch (err) {
    if (!def.allowJsonRepair) {
      if (ctx.userId) {
        await recordUsageAttempt({
          userId: ctx.userId,
          productId: ctx.productId,
          requestId: ctx.requestId,
          taskId: def.id,
          provider: successfulResult.provider,
          model: successfulResult.model,
          attemptKind: "primary",
          attemptIndex: 900,
          status: "validation_fail",
        })
      }
      throw err
    }

    logAiEvent({
      event: "json_repair",
      task: def.id,
      schemaVersion: def.schemaVersion,
      requestId: ctx.requestId,
    })

    const repair = await runOnce(
      def,
      def.provider,
      def.model,
      {
        ...req,
        messages: [
          ...req.messages,
          {
            role: "user",
            content:
              "Your previous response was not valid against the required JSON schema. Reply with valid JSON only, no markdown.",
          },
        ],
        jsonMode: true,
      },
      ctx,
      "repair",
      100
    )

    const data = parseAndValidate<T>(repair.text, def.outputSchema, {
      task: def.id,
      schemaVersion: def.schemaVersion,
    })
    return { text: repair.text, data }
  }
}

/**
 * Central AI entry point. Features request task IDs — not model IDs.
 *
 * Usage accounting:
 * - One requestId per executeAi (user AI task)
 * - Each provider attempt is a separate AiUsageEvent (idempotent)
 * - Tokens/cost recorded only on successful attempts from provider metadata
 * - Retries/fallback/repair do not rewrite the same attempt key
 */
export async function executeAi<T = unknown>(
  req: ExecuteAiRequest
): Promise<ExecuteAiResult<T>> {
  const def = getTaskDefinition(req.task)
  const started = Date.now()
  let usedFallback = false
  let result: AiNormalizedResult
  const requestId = newAiRequestId()
  const ctx: AttemptContext = {
    requestId,
    userId: req.userId,
    productId: req.brandId,
    taskId: def.id,
  }

  // Durable daily-cap reservation before any provider attempt (closes check-then-act races).
  if (req.userId) {
    await reserveAiRequestSlot({
      userId: req.userId,
      requestId,
      taskId: def.id,
      productId: req.brandId,
      dailyCap: DAILY_AI_REQUEST_CAP,
    })
  }

  try {
    result = await runOnce(def, def.provider, def.model, req, ctx, "primary", 0)
  } catch (primaryError) {
    if (!def.fallback) {
      logAiEvent({
        event: "failure",
        task: def.id,
        provider: def.provider,
        model: def.model,
        requestId,
        code:
          primaryError instanceof AiProviderError
            ? primaryError.code
            : "provider_error",
        latencyMs: Date.now() - started,
      })
      throw primaryError
    }

    logAiEvent({
      event: "fallback",
      task: def.id,
      fromProvider: def.provider,
      toProvider: def.fallback.provider,
      toModel: def.fallback.model,
      requestId,
      code:
        primaryError instanceof AiProviderError
          ? primaryError.code
          : "provider_error",
    })

    usedFallback = true
    try {
      result = await runOnce(
        def,
        def.fallback.provider,
        def.fallback.model,
        req,
        ctx,
        "fallback",
        50
      )
    } catch (fallbackError) {
      logAiEvent({
        event: "failure",
        task: def.id,
        provider: def.fallback.provider,
        model: def.fallback.model,
        usedFallback: true,
        requestId,
        code:
          fallbackError instanceof AiProviderError
            ? fallbackError.code
            : "provider_error",
        latencyMs: Date.now() - started,
      })
      throw fallbackError
    }
  }

  const parsed = await maybeParseStructured<T>(def, result.text, req, ctx, result)

  const deterministic = runDeterministicChecks({
    text: parsed.text,
    platform: req.platform,
    avoidPatterns: req.avoidPatterns,
    brandName: req.brandName,
    approvedFacts: req.approvedFacts,
  })
  if (!deterministic.passed && def.qualityPolicy !== "review_task") {
    if (ctx.userId) {
      await recordUsageAttempt({
        userId: ctx.userId,
        productId: ctx.productId,
        requestId: ctx.requestId,
        taskId: def.id,
        provider: result.provider,
        model: result.model,
        attemptKind: "primary",
        attemptIndex: 950,
        status: "quality_fail",
      })
    }
    throw new AiOrchestrationError({
      code: "quality_failed",
      message: deterministic.notes.join("; ") || "Deterministic quality checks failed",
      task: def.id,
      details: { notes: deterministic.notes },
    })
  }

  let aiReview: { score?: number; note?: string } | undefined

  if (def.id === "content.review" && parsed.data) {
    const data = parsed.data as { score?: number; note?: string }
    aiReview = { score: data.score, note: data.note }
  } else if (
    shouldRunAiReview({
      qualityPolicy: def.qualityPolicy,
      forceAiReview: req.forceAiReview,
      skipAiReview: req.skipAiReview,
      contentType: req.contentType,
    })
  ) {
    const reviewDef = getTaskDefinition("content.review")
    try {
      const reviewResult = await runOnce(
        reviewDef,
        reviewDef.provider,
        reviewDef.model,
        {
          task: "content.review",
          userId: req.userId,
          brandId: req.brandId,
          messages: [
            {
              role: "system",
              content:
                'You are a content quality reviewer for Varabhi. Output valid JSON only: { "score": number between 0 and 1, "note": "One short sentence" }.',
            },
            {
              role: "user",
              content: `Draft content:\n---\n${parsed.text.slice(0, 2000)}\n---\nOutput JSON only.`,
            },
          ],
          jsonMode: true,
          signal: req.signal,
        },
        { ...ctx, taskId: reviewDef.id },
        "review_nested",
        200
      )
      if (reviewDef.outputSchema) {
        const reviewData = parseAndValidate<{ score: number; note: string }>(
          reviewResult.text,
          reviewDef.outputSchema,
          { task: "content.review", schemaVersion: reviewDef.schemaVersion }
        )
        aiReview = reviewData
      }
    } catch {
      logAiEvent({
        event: "review_skipped",
        task: def.id,
        reason: "review_failed",
        requestId,
      })
    }
  }

  logAiEvent({
    event: "success",
    task: def.id,
    provider: result.provider,
    model: result.model,
    usedFallback,
    usageCategory: def.usageCategory,
    inputTokens: result.usage?.inputTokens,
    outputTokens: result.usage?.outputTokens,
    latencyMs: Date.now() - started,
    promptVersion: def.promptVersion,
    schemaVersion: def.schemaVersion,
    requestId,
    userId: req.userId ? "[redacted]" : undefined,
    brandId: req.brandId ? "[redacted]" : undefined,
  })

  return {
    ok: true,
    task: def.id,
    text: parsed.text,
    data: parsed.data,
    provider: result.provider,
    model: result.model,
    usage: result.usage,
    latencyMs: Date.now() - started,
    usedFallback,
    quality: {
      deterministicPassed: deterministic.passed,
      deterministicNotes: deterministic.notes,
      aiReview,
    },
    promptVersion: def.promptVersion,
    schemaVersion: def.schemaVersion,
  }
}

/**
 * Compatibility helper for legacy callAI(system, user, model, maxTokens).
 * Must supply metering context — never bypasses executeAi / usage accounting.
 * Model/maxTokens from callers are ignored; the task registry is authoritative.
 */
export async function completeText(opts: {
  system: string
  user: string
  model: string
  maxTokens: number
  /** Required: every provider attempt must be attributable. */
  userId: string
  task: AiTaskId
  brandId?: string
  provider?: AiProviderId
  timeoutMs?: number
  temperature?: number
  signal?: AbortSignal
  skipAiReview?: boolean
  jsonMode?: boolean
}): Promise<string> {
  void opts.model
  void opts.maxTokens
  void opts.provider
  void opts.timeoutMs

  const result = await executeAi({
    task: opts.task,
    userId: opts.userId,
    brandId: opts.brandId,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    temperature: opts.temperature,
    signal: opts.signal,
    skipAiReview: opts.skipAiReview ?? true,
    jsonMode: opts.jsonMode ?? true,
  })
  return result.text
}

export { AiDailyCapExceededError }
