import { afterEach, describe, expect, it } from "vitest"
import {
  getConfiguredCronSecret,
  isCronBearerAuthorized,
  unauthorizedCronResponse,
} from "@/lib/cron-auth"

const ORIGINAL = process.env.CRON_SECRET

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = ORIGINAL
})

describe("cron bearer auth", () => {
  it("rejects when CRON_SECRET is missing", () => {
    delete process.env.CRON_SECRET
    expect(getConfiguredCronSecret()).toBeNull()
    expect(isCronBearerAuthorized("Bearer undefined")).toBe(false)
    expect(isCronBearerAuthorized("Bearer ")).toBe(false)
    expect(isCronBearerAuthorized(null)).toBe(false)
  })

  it("rejects when CRON_SECRET is empty or whitespace", () => {
    process.env.CRON_SECRET = ""
    expect(getConfiguredCronSecret()).toBeNull()
    expect(isCronBearerAuthorized("Bearer undefined")).toBe(false)

    process.env.CRON_SECRET = "   "
    expect(getConfiguredCronSecret()).toBeNull()
    expect(isCronBearerAuthorized("Bearer    ")).toBe(false)
  })

  it("rejects invalid bearer tokens", () => {
    process.env.CRON_SECRET = "correct-secret-value"
    expect(isCronBearerAuthorized(null)).toBe(false)
    expect(isCronBearerAuthorized("")).toBe(false)
    expect(isCronBearerAuthorized("correct-secret-value")).toBe(false)
    expect(isCronBearerAuthorized("Bearer wrong-secret")).toBe(false)
    expect(isCronBearerAuthorized("Bearer correct-secret-valu")).toBe(false)
    expect(isCronBearerAuthorized("Bearer undefined")).toBe(false)
  })

  it("accepts a valid Bearer secret", () => {
    process.env.CRON_SECRET = "correct-secret-value"
    expect(getConfiguredCronSecret()).toBe("correct-secret-value")
    expect(isCronBearerAuthorized("Bearer correct-secret-value")).toBe(true)
  })

  it("trims configured secret but not the presented token mismatch", () => {
    process.env.CRON_SECRET = "  padded-secret  "
    expect(getConfiguredCronSecret()).toBe("padded-secret")
    expect(isCronBearerAuthorized("Bearer padded-secret")).toBe(true)
    expect(isCronBearerAuthorized("Bearer   padded-secret  ")).toBe(false)
  })

  it("returns a 401 JSON unauthorized response", async () => {
    const res = unauthorizedCronResponse()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: "Unauthorized" })
  })
})
