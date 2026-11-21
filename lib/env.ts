/**
 * Safe environment helpers. Never log or return secret values.
 * Authoritative list of names: see `.env.example`.
 */

const REQUIRED_ALWAYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const

/** Enforced when NODE_ENV=production (ENCRYPTION_KEY min length 16). */
const REQUIRED_PRODUCTION = ["ENCRYPTION_KEY", "CRON_SECRET"] as const

export type EnvIssue = {
  name: string
  reason: "missing" | "too_short"
}

/**
 * True while `next build` is collecting page data.
 * Next sets NODE_ENV=production during builds, but production-only secrets
 * must be enforced at runtime — not fail the compile when absent locally.
 */
export function isNextProductionBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build"
}

/**
 * Returns missing/invalid required env names without values.
 * Development: core DB + Clerk only.
 * Production runtime: also ENCRYPTION_KEY and CRON_SECRET.
 * Production *build* phase: core only (Vercel injects secrets at runtime).
 */
export function getEnvIssues(): EnvIssue[] {
  const issues: EnvIssue[] = []
  for (const name of REQUIRED_ALWAYS) {
    if (!process.env[name]?.trim()) {
      issues.push({ name, reason: "missing" })
    }
  }

  const enforceProductionSecrets =
    process.env.NODE_ENV === "production" && !isNextProductionBuildPhase()

  if (enforceProductionSecrets) {
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
