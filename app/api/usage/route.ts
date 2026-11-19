import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { ensureUserForClerkId } from "@/lib/users"
import {
  getDailyUsageSummary,
  getMonthlyUsageSummary,
} from "@/lib/usage/meter"
import { DAILY_AI_REQUEST_CAP } from "@/lib/rate-limit"
import { apiError } from "@/lib/api-error"

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

    return NextResponse.json({
      daily: {
        requests: daily.requests,
        limit: DAILY_AI_REQUEST_CAP,
        remaining: Math.max(0, DAILY_AI_REQUEST_CAP - daily.requests),
      },
      monthly: {
        requests: monthly.requests,
        successAttempts: monthly.successAttempts,
      },
    })
  } catch (error) {
    return apiError(error, {
      context: "usage GET",
      publicMessage: "Failed to load usage",
    })
  }
}
