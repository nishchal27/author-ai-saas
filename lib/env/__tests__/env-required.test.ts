import { afterEach, describe, expect, it, vi } from "vitest"
import { getEnvIssues, isNextProductionBuildPhase } from "@/lib/env"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("required env enforcement", () => {
  it("detects Next production build phase", () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build")
    expect(isNextProductionBuildPhase()).toBe(true)
    vi.stubEnv("NEXT_PHASE", "")
    expect(isNextProductionBuildPhase()).toBe(false)
  })

  it("does not require ENCRYPTION_KEY/CRON_SECRET during next build", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PHASE", "phase-production-build")
    vi.stubEnv("DATABASE_URL", "postgresql://example")
    vi.stubEnv("DIRECT_URL", "postgresql://example")
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test")
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test")
    vi.stubEnv("ENCRYPTION_KEY", "")
    vi.stubEnv("CRON_SECRET", "")

    const names = getEnvIssues().map((i) => i.name)
    expect(names).not.toContain("ENCRYPTION_KEY")
    expect(names).not.toContain("CRON_SECRET")
  })

  it("requires ENCRYPTION_KEY and CRON_SECRET at production runtime", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PHASE", "")
    vi.stubEnv("DATABASE_URL", "postgresql://example")
    vi.stubEnv("DIRECT_URL", "postgresql://example")
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test")
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test")
    vi.stubEnv("ENCRYPTION_KEY", "")
    vi.stubEnv("CRON_SECRET", "")

    const names = getEnvIssues().map((i) => i.name)
    expect(names).toContain("ENCRYPTION_KEY")
    expect(names).toContain("CRON_SECRET")
  })
})
