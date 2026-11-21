/**
 * Shared Bearer authentication for cron / ops endpoints that use CRON_SECRET.
 *
 * Fail closed: missing or empty CRON_SECRET never authorizes
 * (including the historical `Bearer undefined` mistake).
 */

import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"

/** Trimmed secret, or null when unset/empty. */
export function getConfiguredCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim()
  return secret ? secret : null
}

/**
 * Returns true only when Authorization is `Bearer <CRON_SECRET>` and
 * CRON_SECRET is a non-empty configured value.
 */
export function isCronBearerAuthorized(
  authorizationHeader: string | null | undefined
): boolean {
  const secret = getConfiguredCronSecret()
  if (!secret) return false
  if (!authorizationHeader?.startsWith("Bearer ")) return false

  const token = authorizationHeader.slice("Bearer ".length)
  const expected = Buffer.from(secret, "utf8")
  const provided = Buffer.from(token, "utf8")
  if (expected.length !== provided.length) return false

  try {
    return timingSafeEqual(expected, provided)
  } catch {
    return false
  }
}

export function unauthorizedCronResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
