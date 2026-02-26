import { db } from "@/lib/db"
import type { User } from "@prisma/client"

/**
 * Ensures a User record exists for the given Clerk ID: returns existing user or creates one
 * using Clerk's API for profile data. Use this everywhere you need the app user after auth().
 *
 * - If the user exists in DB, returns it.
 * - If not, fetches profile from Clerk and creates the user with email/name.
 * - If Clerk is unreachable or returns an error, logs and throws (no placeholder user).
 */
export async function ensureUserForClerkId(clerkId: string): Promise<User> {
  const existing = await db.user.findFirst({
    where: { clerkId },
  })
  if (existing) return existing

  const secret = process.env.CLERK_SECRET_KEY
  if (!secret) {
    console.error("[ensureUserForClerkId] CLERK_SECRET_KEY is not set; cannot create user from Clerk.")
    throw new Error("Server configuration error")
  }

  const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(clerkId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(
      "[ensureUserForClerkId] Clerk API failed:",
      res.status,
      res.statusText,
      body.slice(0, 200)
    )
    throw new Error("Could not load your account. Please try again or sign out and back in.")
  }

  const data = (await res.json()) as {
    email_addresses?: Array<{ email_address?: string }>
    first_name?: string | null
    username?: string | null
  }
  const email =
    data?.email_addresses?.[0]?.email_address?.trim() || null
  const name = (data?.first_name ?? data?.username ?? null) as string | null

  if (!email) {
    console.error("[ensureUserForClerkId] Clerk user has no email; cannot create User row.")
    throw new Error("Your account has no email. Please add an email in your account settings and try again.")
  }

  const user = await db.user.create({
    data: {
      clerkId,
      email,
      name: name || undefined,
    },
  })
  return user
}
