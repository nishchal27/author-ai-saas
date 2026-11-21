import { createHash, randomUUID } from "crypto"
import { db } from "@/lib/db"
import type { AiProviderId, AiUsage } from "@/lib/ai/types"

export type UsageAttemptKind =
  | "primary"
  | "retry"
  | "fallback"
  | "repair"
  | "review_nested"
  /** Durable daily-cap slot claimed before the first provider call. */
  | "reservation"

export type UsageEventStatus =
  | "success"
  | "failed"
  | "provider_error"
  | "validation_fail"
  | "quality_fail"
  /** Request slot reserved; does not count as a successful provider attempt. */
  | "reserved"

/** Thrown when the durable daily request cap is already reached. */
export class AiDailyCapExceededError extends Error {
  readonly code = "daily_cap_exceeded" as const

  constructor(message = "Daily AI usage limit reached. Try again tomorrow.") {
    super(message)
    this.name = "AiDailyCapExceededError"
  }
}

export type RecordUsageAttemptInput = {
  userId: string
  productId?: string | null
  requestId: string
  taskId: string
  provider: AiProviderId | string
  model: string
  attemptKind: UsageAttemptKind
  attemptIndex: number
  status: UsageEventStatus
  usage?: AiUsage
  latencyMs?: number
}

/** Rough public list prices ($/1M tokens) for soft cost estimates — not billing. */
const COST_RATES: Record<string, { input: number; output: number }> = {
  anthropic: { input: 3, output: 15 },
  openai: { input: 2.5, output: 10 },
  openrouter: { input: 3, output: 15 },
}

export function newAiRequestId(): string {
  return randomUUID()
}

export function estimateCostUsd(
  provider: string,
  usage?: AiUsage
): number | null {
  if (!usage) return null
  const rates = COST_RATES[provider] ?? COST_RATES.anthropic
  const input = usage.inputTokens ?? 0
  const output = usage.outputTokens ?? 0
  if (input === 0 && output === 0) return null
  return (input * rates.input + output * rates.output) / 1_000_000
}

function attemptIdempotencyKey(input: RecordUsageAttemptInput): string {
  // Stable per request + attempt slot so retries of the same attempt do not double-write.
  const raw = [
    input.requestId,
    input.attemptKind,
    String(input.attemptIndex),
    input.provider,
    input.model,
  ].join(":")
  return createHash("sha256").update(raw).digest("hex").slice(0, 64)
}

/**
 * Server-side only. Persists one provider attempt under a user AI request.
 * Tokens/cost come only from server-observed provider metadata.
 * Idempotent via unique idempotencyKey.
 */
export async function recordUsageAttempt(
  input: RecordUsageAttemptInput
): Promise<void> {
  if (!input.userId) return

  const idempotencyKey = attemptIdempotencyKey(input)
  const estimatedCostUsd =
    input.status === "success"
      ? estimateCostUsd(input.provider, input.usage)
      : null

  try {
    await db.aiUsageEvent.create({
      data: {
        userId: input.userId,
        productId: input.productId || null,
        requestId: input.requestId,
        idempotencyKey,
        taskId: input.taskId,
        provider: input.provider,
        model: input.model,
        attemptKind: input.attemptKind,
        attemptIndex: input.attemptIndex,
        inputTokens:
          input.status === "success" ? input.usage?.inputTokens ?? null : null,
        outputTokens:
          input.status === "success" ? input.usage?.outputTokens ?? null : null,
        estimatedCostUsd,
        status: input.status,
        latencyMs: input.latencyMs ?? null,
      },
    })
  } catch (err) {
    // Unique violation = same attempt already recorded (safe retry / race).
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : ""
    if (code === "P2002") return
    console.error("[usage] failed to record attempt", {
      taskId: input.taskId,
      status: input.status,
      code,
    })
  }
}

/**
 * Claim one logical AI request against the durable daily cap before any
 * provider call. Uses a per-user Postgres advisory lock so concurrent requests
 * cannot both pass a check-then-act race.
 *
 * The reservation is a distinct AiUsageEvent (attemptKind=reservation) under
 * the same requestId as later provider attempts — it does not invent tokens.
 */
export async function reserveAiRequestSlot(opts: {
  userId: string
  requestId: string
  taskId: string
  productId?: string | null
  dailyCap: number
}): Promise<void> {
  const since = startOfUtcDay()

  try {
    await db.$transaction(async (tx) => {
      // Transaction-scoped lock; released on commit/rollback. No Redis required.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${opts.userId}))`

      const rows = await tx.aiUsageEvent.findMany({
        where: {
          userId: opts.userId,
          createdAt: { gte: since },
        },
        distinct: ["requestId"],
        select: { requestId: true },
      })

      if (rows.length >= opts.dailyCap) {
        throw new AiDailyCapExceededError()
      }

      const reservationInput: RecordUsageAttemptInput = {
        userId: opts.userId,
        productId: opts.productId,
        requestId: opts.requestId,
        taskId: opts.taskId,
        provider: "system",
        model: "reservation",
        attemptKind: "reservation",
        attemptIndex: -1,
        status: "reserved",
      }

      try {
        await tx.aiUsageEvent.create({
          data: {
            userId: reservationInput.userId,
            productId: reservationInput.productId || null,
            requestId: reservationInput.requestId,
            idempotencyKey: attemptIdempotencyKey(reservationInput),
            taskId: reservationInput.taskId,
            provider: reservationInput.provider,
            model: reservationInput.model,
            attemptKind: reservationInput.attemptKind,
            attemptIndex: reservationInput.attemptIndex,
            inputTokens: null,
            outputTokens: null,
            estimatedCostUsd: null,
            status: reservationInput.status,
            latencyMs: null,
          },
        })
      } catch (err) {
        const code =
          err && typeof err === "object" && "code" in err
            ? String((err as { code?: string }).code)
            : ""
        // Same requestId already reserved (safe idempotent retry).
        if (code === "P2002") return
        throw err
      }
    })
  } catch (err) {
    if (err instanceof AiDailyCapExceededError) throw err
    // If advisory lock / raw SQL unavailable in a test DB, fall back to soft check.
    console.error("[usage] reserveAiRequestSlot failed; applying soft daily check", {
      taskId: opts.taskId,
      message: err instanceof Error ? err.message : "unknown",
    })
    const soft = await countDistinctRequests(opts.userId, since)
    if (soft >= opts.dailyCap) {
      throw new AiDailyCapExceededError()
    }
    await recordUsageAttempt({
      userId: opts.userId,
      productId: opts.productId,
      requestId: opts.requestId,
      taskId: opts.taskId,
      provider: "system",
      model: "reservation",
      attemptKind: "reservation",
      attemptIndex: -1,
      status: "reserved",
    })
  }
}

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function startOfUtcMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

/** Distinct user AI requests (not per-retry attempts) in a window. */
export async function countDistinctRequests(
  userId: string,
  since: Date,
  productId?: string
): Promise<number> {
  const rows = await db.aiUsageEvent.findMany({
    where: {
      userId,
      createdAt: { gte: since },
      ...(productId ? { productId } : {}),
    },
    distinct: ["requestId"],
    select: { requestId: true },
  })
  return rows.length
}

/** Sum tokens/cost from successful provider attempts only (no retry double-count). */
export async function aggregateSuccessfulUsage(
  userId: string,
  since: Date,
  productId?: string
): Promise<{
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
  successAttempts: number
}> {
  const events = await db.aiUsageEvent.findMany({
    where: {
      userId,
      status: "success",
      createdAt: { gte: since },
      ...(productId ? { productId } : {}),
    },
    select: {
      inputTokens: true,
      outputTokens: true,
      estimatedCostUsd: true,
    },
  })

  return events.reduce<{
    inputTokens: number
    outputTokens: number
    estimatedCostUsd: number
    successAttempts: number
  }>(
    (acc, e) => {
      acc.inputTokens += e.inputTokens ?? 0
      acc.outputTokens += e.outputTokens ?? 0
      acc.estimatedCostUsd += e.estimatedCostUsd ?? 0
      acc.successAttempts += 1
      return acc
    },
    {
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      successAttempts: 0,
    }
  )
}

export async function getDailyUsageSummary(userId: string, productId?: string) {
  const since = startOfUtcDay()
  const [requests, success] = await Promise.all([
    countDistinctRequests(userId, since, productId),
    aggregateSuccessfulUsage(userId, since, productId),
  ])
  return { period: "day" as const, since, requests, ...success }
}

export async function getMonthlyUsageSummary(
  userId: string,
  productId?: string
) {
  const since = startOfUtcMonth()
  const [requests, success] = await Promise.all([
    countDistinctRequests(userId, since, productId),
    aggregateSuccessfulUsage(userId, since, productId),
  ])
  return { period: "month" as const, since, requests, ...success }
}

export { startOfUtcDay }
