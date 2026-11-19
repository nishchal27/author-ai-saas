import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  aggregateSuccessfulUsage,
  countDistinctRequests,
  estimateCostUsd,
  recordUsageAttempt,
} from "@/lib/usage/meter"

const create = vi.fn()
const findMany = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    aiUsageEvent: {
      create: (...args: unknown[]) => create(...args),
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}))

describe("UsageMeter", () => {
  beforeEach(() => {
    create.mockReset()
    findMany.mockReset()
    create.mockResolvedValue({})
  })

  it("estimates cost from server-observed tokens only", () => {
    expect(estimateCostUsd("openai", { inputTokens: 1_000_000, outputTokens: 0 })).toBe(2.5)
    expect(estimateCostUsd("openai", undefined)).toBeNull()
  })

  it("records successful attempts with tokens and ignores client-less empty usage", async () => {
    await recordUsageAttempt({
      userId: "user_1",
      productId: "prod_1",
      requestId: "req_1",
      taskId: "ideas.generate",
      provider: "openai",
      model: "gpt-4o",
      attemptKind: "primary",
      attemptIndex: 0,
      status: "success",
      usage: { inputTokens: 100, outputTokens: 50 },
      latencyMs: 12,
    })

    expect(create).toHaveBeenCalledTimes(1)
    const data = create.mock.calls[0][0].data
    expect(data.inputTokens).toBe(100)
    expect(data.outputTokens).toBe(50)
    expect(data.estimatedCostUsd).toBeGreaterThan(0)
    expect(data.idempotencyKey).toBeTruthy()
    expect(data.taskId).toBe("ideas.generate")
  })

  it("does not store tokens on failed attempts", async () => {
    await recordUsageAttempt({
      userId: "user_1",
      requestId: "req_2",
      taskId: "content.generate",
      provider: "anthropic",
      model: "claude",
      attemptKind: "retry",
      attemptIndex: 1,
      status: "provider_error",
      usage: { inputTokens: 999, outputTokens: 999 },
    })

    const data = create.mock.calls[0][0].data
    expect(data.inputTokens).toBeNull()
    expect(data.outputTokens).toBeNull()
    expect(data.estimatedCostUsd).toBeNull()
    expect(data.status).toBe("provider_error")
  })

  it("treats unique constraint as idempotent no-op", async () => {
    create.mockRejectedValueOnce({ code: "P2002" })
    await expect(
      recordUsageAttempt({
        userId: "user_1",
        requestId: "req_3",
        taskId: "brand.summarize",
        provider: "openai",
        model: "gpt-4o",
        attemptKind: "primary",
        attemptIndex: 0,
        status: "success",
        usage: { inputTokens: 1, outputTokens: 1 },
      })
    ).resolves.toBeUndefined()
  })

  it("aggregates tokens from successful attempts only", async () => {
    findMany.mockResolvedValueOnce([
      { inputTokens: 10, outputTokens: 5, estimatedCostUsd: 0.01 },
      { inputTokens: 20, outputTokens: 5, estimatedCostUsd: 0.02 },
    ])

    const agg = await aggregateSuccessfulUsage("user_1", new Date(0))
    expect(agg.inputTokens).toBe(30)
    expect(agg.outputTokens).toBe(10)
    expect(agg.successAttempts).toBe(2)
  })

  it("counts distinct requestIds for soft limits", async () => {
    findMany.mockResolvedValueOnce([
      { requestId: "a" },
      { requestId: "b" },
    ])
    expect(await countDistinctRequests("user_1", new Date(0))).toBe(2)
  })
})
