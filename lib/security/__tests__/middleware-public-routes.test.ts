import { readFileSync } from "fs"
import path from "path"
import { describe, expect, it } from "vitest"

describe("Clerk middleware public API routes", () => {
  const source = readFileSync(
    path.join(process.cwd(), "middleware.ts"),
    "utf8"
  )

  it("keeps health and cron reachable without a Clerk session", () => {
    expect(source).toContain('"/api/cron(.*)"')
    expect(source).toContain('"/api/health(.*)"')
  })

  it("allows Inngest Cloud to reach /api/inngest without Clerk login", () => {
    expect(source).toContain('"/api/inngest(.*)"')
  })

  it("does not mark all /api routes as public", () => {
    expect(source).not.toMatch(/"\/api\(\.\*\)"/)
  })
})
