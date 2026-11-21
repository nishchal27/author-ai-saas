import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AiDailyCapExceededError,
  reserveAiRequestSlot,
} from "@/lib/usage/meter"

const executeRaw = vi.fn()
const findMany = vi.fn()
const create = vi.fn()
const transaction = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => transaction(fn),
    aiUsageEvent: {
      findMany: (...args: unknown[]) => findMany(...args),
      create: (...args: unknown[]) => create(...args),
    },
  },
}))

describe("reserveAiRequestSlot", () => {
  beforeEach(() => {
    executeRaw.mockReset()
    findMany.mockReset()
    create.mockReset()
    transaction.mockReset()
    executeRaw.mockResolvedValue(undefined)
    create.mockResolvedValue({})
    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        $executeRaw: executeRaw,
        aiUsageEvent: {
          findMany: (...args: unknown[]) => findMany(...args),
          create: (...args: unknown[]) => create(...args),
        },
      }
      return fn(tx)
    })
  })

  it("creates a reservation when under the daily cap", async () => {
    findMany.mockResolvedValue([{ requestId: "a" }, { requestId: "b" }])

    await reserveAiRequestSlot({
      userId: "user_1",
      requestId: "req_new",
      taskId: "content.generate",
      productId: "prod_1",
      dailyCap: 100,
    })

    expect(executeRaw).toHaveBeenCalled()
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: "req_new",
          attemptKind: "reservation",
          status: "reserved",
          inputTokens: null,
          estimatedCostUsd: null,
        }),
      })
    )
  })

  it("rejects when distinct requests already at the daily cap", async () => {
    findMany.mockResolvedValue(
      Array.from({ length: 100 }, (_, i) => ({ requestId: `r${i}` }))
    )

    await expect(
      reserveAiRequestSlot({
        userId: "user_1",
        requestId: "req_overflow",
        taskId: "ideas.generate",
        dailyCap: 100,
      })
    ).rejects.toBeInstanceOf(AiDailyCapExceededError)

    expect(create).not.toHaveBeenCalled()
  })

  it("treats duplicate reservation as idempotent", async () => {
    findMany.mockResolvedValue([])
    create.mockRejectedValueOnce({ code: "P2002" })

    await expect(
      reserveAiRequestSlot({
        userId: "user_1",
        requestId: "req_dup",
        taskId: "brand.summarize",
        dailyCap: 100,
      })
    ).resolves.toBeUndefined()
  })
})
