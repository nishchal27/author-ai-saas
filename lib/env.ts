/**
 * Safe environment helpers. Never log or return secret values.
 */

const REQUIRED_ALWAYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const

const REQUIRED_PRODUCTION = ["ENCRYPTION_KEY", "CRON_SECRET"] as const

export type EnvIssue = {
  name: string
  reason: "missing" | "too_short"
}

/**
 * Returns missing/invalid required env names without values.
 * Development: core DB + Clerk only.
 * Production: also ENCRYPTION_KEY and CRON_SECRET.
 */
export function getEnvIssues(): EnvIssue[] {
  const issues: EnvIssue[] = []
  for (const name of REQUIRED_ALWAYS) {
    if (!process.env[name]?.trim()) {
      issues.push({ name, reason: "missing" })
    }
  }

  if (process.env.NODE_ENV === "production") {
    for (const name of REQUIRED_PRODUCTION) {
      const value = process.env[name]
      if (!value?.trim()) {
        issues.push({ name, reason: "missing" })
      } else if (name === "ENCRYPTION_KEY" && value.length < 16) {
        issues.push({ name, reason: "too_short" })
      }
    }
  }

  return issues
}

/**
 * Throw a user-safe error if required env vars are missing.
 * Call from server entry points that need config certainty.
 */
export function assertRequiredEnv(): void {
  const issues = getEnvIssues()
  if (issues.length === 0) return
  const names = issues.map((i) => i.name).join(", ")
  throw new Error(`Missing or invalid environment configuration: ${names}`)
}

/** Whether at least one AI provider key is present (does not reveal which). */
export function hasAnyAiProviderKey(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.OPENROUTER_API_KEY
  )
}
