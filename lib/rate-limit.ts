import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { countDistinctRequests, startOfUtcDay } from "@/lib/usage/meter"

/**
 * Short-window rate limiter + durable daily soft cap via AiUsageEvent.
 *
 * - In-memory window is per Node process (not shared across serverless instances).
 * - Daily cap counts distinct AI requestIds (user tasks), not retry attempts.
 */

const windowMs = 60 * 1000
const maxPerWindow = 20
export const DAILY_AI_REQUEST_CAP = 100

const hits = new Map<string, number[]>()
const cleanupInterval = 5 * 60 * 1000
let lastCleanup = Date.now()
let warnedMultiInstance = false

function prune(key: string, now: number) {
  const times = hits.get(key)
  if (!times) return
  const cutoff = now - windowMs
  const kept = times.filter((t) => t > cutoff)
  if (kept.length === 0) hits.delete(key)
  else hits.set(key, kept)
}

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < cleanupInterval) return
  lastCleanup = now
  for (const key of hits.keys()) prune(key, now)
}

/**
 * Check short-window rate limit for a user.
 * Returns null if allowed, or a 429 NextResponse if over limit.
 */
export function checkRateLimit(userId: string): NextResponse | null {
  if (process.env.NODE_ENV === "production" && !warnedMultiInstance) {
    warnedMultiInstance = true
    console.warn(
      "[rate-limit] In-memory window is per instance; daily Prisma cap also applies. Prefer a shared store for multi-instance production."
    )
  }

  const now = Date.now()
  cleanup()
  prune(userId, now)
  const times = hits.get(userId) ?? []
  if (times.length >= maxPerWindow) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 }
    )
  }
  times.push(now)
  hits.set(userId, times)
  return null
}

/**
 * Durable soft daily cap for AI user-tasks.
 * Prefer AiUsageEvent distinct requestIds; fall back to draft+insight counts
 * so pre-Phase-3 traffic still contributes until usage events dominate.
 */
export async function checkDailyAiCap(userId: string): Promise<NextResponse | null> {
  const since = startOfUtcDay()
  const usageRequests = await countDistinctRequests(userId, since)

  if (usageRequests >= DAILY_AI_REQUEST_CAP) {
    return NextResponse.json(
      { error: "Daily AI usage limit reached. Try again tomorrow." },
      { status: 429 }
    )
  }

  // Compatibility soft floor while older activity may lack usage events
  if (usageRequests === 0) {
    const [drafts, insights] = await Promise.all([
      db.contentDraft.count({ where: { userId, createdAt: { gte: since } } }),
      db.insight.count({ where: { userId, createdAt: { gte: since } } }),
    ])
    if (drafts + insights >= DAILY_AI_REQUEST_CAP) {
      return NextResponse.json(
        { error: "Daily AI usage limit reached. Try again tomorrow." },
        { status: 429 }
      )
    }
  }

  return null
}

/** Short window + daily soft cap for expensive AI routes. */
export async function checkAiRateLimits(userId: string): Promise<NextResponse | null> {
  const window = checkRateLimit(userId)
  if (window) return window
  return checkDailyAiCap(userId)
}
