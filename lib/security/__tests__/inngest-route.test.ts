import { readFileSync } from "fs"
import path from "path"
import { describe, expect, it } from "vitest"

describe("Inngest serve route security contract", () => {
  const source = readFileSync(
    path.join(process.cwd(), "app/api/inngest/[...inngest]/route.ts"),
    "utf8"
  )

  it("uses inngest/next serve (SDK signature verification)", () => {
    expect(source).toContain('from "inngest/next"')
    expect(source).toContain("serve({")
    expect(source).toContain("client: inngest")
  })

  it("documents Clerk-public + signing-key model and does not disable signing", () => {
    expect(source.toLowerCase()).toContain("signing")
    expect(source).toContain("INNGEST_SIGNING_KEY")
    expect(source).not.toMatch(/signingKey:\s*null/)
    expect(source).not.toMatch(/signingKey:\s*["']?false/i)
  })

  it("exports serverless runtime and maxDuration for Vercel", () => {
    expect(source).toContain('runtime = "nodejs"')
    expect(source).toContain("maxDuration = 60")
  })
})
