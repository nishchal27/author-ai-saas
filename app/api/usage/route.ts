import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { ensureUserForClerkId } from "@/lib/users"
import {
  getDailyUsageSummary,
  getMonthlyUsageSummary,
  startOfUtcDay,
} from "@/lib/usage/meter"
import { DAILY_AI_REQUEST_CAP } from "@/lib/rate-limit"
import { apiError } from "@/lib/api-error"
import { db } from "@/lib/db"

/** Lightweight read-only usage summary for the authenticated user. */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = await ensureUserForClerkId(clerkId)
    const [daily, monthly] = await Promise.all([
      getDailyUsageSummary(user.id),
      getMonthlyUsageSummary(user.id),
    ])

    const sinceDay = startOfUtcDay()
    const [providerAttemptsToday, successAttemptsToday, failedAttemptsToday] =
      await Promise.all([
        db.aiUsageEvent.count({
          where: {
            userId: user.id,
            createdAt: { gte: sinceDay },
            attemptKind: { not: "reservation" },
          },
        }),
        db.aiUsageEvent.count({
          where: {
            userId: user.id,
            createdAt: { gte: sinceDay },
            status: "success",
            attemptKind: { not: "reservation" },
          },
        }),
        db.aiUsageEvent.count({
          where: {
            userId: user.id,
            createdAt: { gte: sinceDay },
            status: { in: ["failed", "provider_error", "validation_fail", "quality_fail"] },
            attemptKind: { not: "reservation" },
          },
        }),
      ])

    return NextResponse.json({
      daily: {
        /** Distinct logical AI requests (one per executeAi / user task). */
        requests: daily.requests,
        limit: DAILY_AI_REQUEST_CAP,
        remaining: Math.max(0, DAILY_AI_REQUEST_CAP - daily.requests),
        /** Provider attempts including retries/fallback (excludes reservation rows). */
        providerAttempts: providerAttemptsToday,
        successAttempts: successAttemptsToday,
        failedAttempts: failedAttemptsToday,
        inputTokens: daily.inputTokens,
        outputTokens: daily.outputTokens,
        /** Soft estimate from public list prices — not an invoice. */
        estimatedCostUsd: daily.estimatedCostUsd,
        estimatedCostIsEstimate: true,
      },
      monthly: {
        requests: monthly.requests,
        successAttempts: monthly.successAttempts,
        inputTokens: monthly.inputTokens,
        outputTokens: monthly.outputTokens,
        estimatedCostUsd: monthly.estimatedCostUsd,
        estimatedCostIsEstimate: true,
      },
    })
  } catch (error) {
    return apiError(error, {
      context: "usage GET",
      publicMessage: "Failed to load usage",
    })
  }
}
