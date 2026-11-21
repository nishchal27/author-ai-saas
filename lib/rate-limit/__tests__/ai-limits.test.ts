import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  checkAiRateLimits,
  checkDailyAiCap,
  checkRateLimit,
  DAILY_AI_REQUEST_CAP,
} from "@/lib/rate-limit"

const countDistinctRequests = vi.fn()

vi.mock("@/lib/usage/meter", () => ({
  countDistinctRequests: (...args: unknown[]) => countDistinctRequests(...args),
  startOfUtcDay: () => new Date("2026-11-21T00:00:00.000Z"),
}))

describe("AI rate limits", () => {
  beforeEach(() => {
    countDistinctRequests.mockReset()
    countDistinctRequests.mockResolvedValue(0)
  })

  it("enforces the short-window burst limit", () => {
    const userId = `burst_${Math.random()}`
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit(userId)).toBeNull()
    }
    const blocked = checkRateLimit(userId)
    expect(blocked?.status).toBe(429)
  })

  it("enforces the durable daily request cap", async () => {
    countDistinctRequests.mockResolvedValue(DAILY_AI_REQUEST_CAP)
    const blocked = await checkDailyAiCap("user_daily")
    expect(blocked?.status).toBe(429)
  })

  it("checkAiRateLimits combines burst and daily caps", async () => {
    countDistinctRequests.mockResolvedValue(0)
    const userId = `combo_${Math.random()}`
    expect(await checkAiRateLimits(userId)).toBeNull()

    countDistinctRequests.mockResolvedValue(DAILY_AI_REQUEST_CAP)
    const daily = await checkAiRateLimits(`daily_${Math.random()}`)
    expect(daily?.status).toBe(429)
  })
})
