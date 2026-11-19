import { parseAndValidate } from "@/lib/ai/parse"
import { requireConfiguredProvider } from "@/lib/ai/providers"
import { runDeterministicChecks } from "@/lib/ai/quality"
import { getTaskDefinition } from "@/lib/ai/registry"
import type {
  AiNormalizedResult,
  AiProviderId,
  ExecuteAiRequest,
  ExecuteAiResult,
  TaskDefinition,
} from "@/lib/ai/types"
import { AiOrchestrationError, AiProviderError } from "@/lib/ai/types"

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

async function runOnce(
  def: TaskDefinition,
  provider: AiProviderId,
  model: string,
  req: ExecuteAiRequest
): Promise<AiNormalizedResult> {
  const adapter = requireConfiguredProvider(provider)
  let lastError: unknown

  for (let attempt = 0; attempt <= def.maxRetries; attempt++) {
    try {
      return await adapter.generateText({
        messages: req.messages,
        model,
        maxOutputTokens: def.maxOutputTokens,
        temperature: req.temperature ?? def.temperature,
        timeoutMs: def.timeoutMs,
        signal: req.signal,
        jsonMode: req.jsonMode ?? Boolean(def.outputSchema),
      })
    } catch (err) {
      lastError = err
      const retryable = err instanceof AiProviderError && err.retryable
      if (!retryable || attempt >= def.maxRetries) break
      logAiEvent({
        event: "retry",
        task: def.id,
        provider,
        model,
        attempt: attempt + 1,
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
  req: ExecuteAiRequest
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
    if (!def.allowJsonRepair) throw err

    // One bounded repair: ask the same task config again with a repair instruction.
    logAiEvent({
      event: "json_repair",
      task: def.id,
      schemaVersion: def.schemaVersion,
    })

    const repair = await runOnce(def, def.provider, def.model, {
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
    })

    const data = parseAndValidate<T>(repair.text, def.outputSchema, {
      task: def.id,
      schemaVersion: def.schemaVersion,
    })
    return { text: repair.text, data }
  }
}

/**
 * Central AI entry point. Features request task IDs — not model IDs.
 */
export async function executeAi<T = unknown>(
  req: ExecuteAiRequest
): Promise<ExecuteAiResult<T>> {
  const def = getTaskDefinition(req.task)
  const started = Date.now()
  let usedFallback = false
  let result: AiNormalizedResult

  try {
    result = await runOnce(def, def.provider, def.model, req)
  } catch (primaryError) {
    if (!def.fallback) {
      logAiEvent({
        event: "failure",
        task: def.id,
        provider: def.provider,
        model: def.model,
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
      code:
        primaryError instanceof AiProviderError
          ? primaryError.code
          : "provider_error",
    })

    usedFallback = true
    try {
      result = await runOnce(def, def.fallback.provider, def.fallback.model, req)
    } catch (fallbackError) {
      logAiEvent({
        event: "failure",
        task: def.id,
        provider: def.fallback.provider,
        model: def.fallback.model,
        usedFallback: true,
        code:
          fallbackError instanceof AiProviderError
            ? fallbackError.code
            : "provider_error",
        latencyMs: Date.now() - started,
      })
      throw fallbackError
    }
  }

  const parsed = await maybeParseStructured<T>(def, result.text, req)

  const deterministic = runDeterministicChecks({ text: parsed.text })
  if (!deterministic.passed && def.qualityPolicy !== "review_task") {
    throw new AiOrchestrationError({
      code: "quality_failed",
      message: deterministic.notes.join("; ") || "Deterministic quality checks failed",
      task: def.id,
      details: { notes: deterministic.notes },
    })
  }

  let aiReview: { score?: number; note?: string } | undefined

  // content.review task itself returns structured review as data
  if (def.id === "content.review" && parsed.data) {
    const data = parsed.data as { score?: number; note?: string }
    aiReview = { score: data.score, note: data.note }
  } else if (
    def.qualityPolicy === "deterministic_then_optional_review" &&
    req.forceAiReview === true &&
    !req.skipAiReview
  ) {
    // Optional nested review via the review task (explicit only)
    const reviewDef = getTaskDefinition("content.review")
    try {
      const reviewResult = await runOnce(reviewDef, reviewDef.provider, reviewDef.model, {
        task: "content.review",
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
      })
      if (reviewDef.outputSchema) {
        const reviewData = parseAndValidate<{ score: number; note: string }>(
          reviewResult.text,
          reviewDef.outputSchema,
          { task: "content.review", schemaVersion: reviewDef.schemaVersion }
        )
        aiReview = reviewData
      }
    } catch {
      logAiEvent({ event: "review_skipped", task: def.id, reason: "review_failed" })
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
 * Compatibility helper matching legacy callAI(system, user, model, maxTokens).
 * Prefer executeAi with a task id for new code.
 */
export async function completeText(opts: {
  system: string
  user: string
  model: string
  maxTokens: number
  provider?: AiProviderId
  timeoutMs?: number
  temperature?: number
  signal?: AbortSignal
}): Promise<string> {
  const provider =
    opts.provider ??
    (process.env.ANTHROPIC_API_KEY
      ? "anthropic"
      : process.env.OPENAI_API_KEY
        ? "openai"
        : process.env.OPENROUTER_API_KEY
          ? "openrouter"
          : "anthropic")

  const adapter = requireConfiguredProvider(provider)
  const result = await adapter.generateText({
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    model: opts.model,
    maxOutputTokens: opts.maxTokens,
    temperature: opts.temperature,
    timeoutMs: opts.timeoutMs ?? 60_000,
    signal: opts.signal,
  })
  return result.text
}
