import { NextResponse } from "next/server"

/**
 * In-memory per-user rate limiter. Limits are per serverless instance;
 * for multi-instance production, consider Upstash Redis or similar.
 */

const windowMs = 60 * 1000 // 1 minute
const maxPerWindow = 20 // e.g. content generation + extract + repurpose

const hits = new Map<string, number[]>()
const cleanupInterval = 5 * 60 * 1000 // 5 minutes
let lastCleanup = Date.now()

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
 * Check rate limit for a user. Returns null if allowed, or a 429 NextResponse if over limit.
 * Call this at the start of expensive/AI routes (content generate, regenerate, repurpose, insight extract).
 */
export function checkRateLimit(userId: string): NextResponse | null {
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
