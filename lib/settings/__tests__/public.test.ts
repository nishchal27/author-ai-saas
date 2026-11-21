import { describe, expect, it } from "vitest"
import { toPublicIntegration, toPublicSettingsUser } from "@/lib/settings/public"

describe("settings public DTOs", () => {
  it("exposes safe user fields without clerkId", () => {
    const pub = toPublicSettingsUser({
      id: "u1",
      email: "a@b.com",
      name: "Ada",
      tier: "standard",
      brandVoice: null,
      founderBio: null,
      activeProductId: "p1",
    })
    expect(pub).toEqual({
      id: "u1",
      email: "a@b.com",
      name: "Ada",
      tier: "standard",
      brandVoice: null,
      founderBio: null,
      activeProductId: "p1",
    })
    expect(JSON.stringify(pub)).not.toMatch(/clerk|accessToken|refreshToken/i)
  })

  it("maps integrations without tokens", () => {
    const pub = toPublicIntegration({
      id: "i1",
      type: "github",
      provider: "github",
      isActive: true,
      config: JSON.stringify({ defaultRepo: "acme/app" }),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    expect(pub.status).toBe("connected")
    expect(pub.config).toContain("acme/app")
    expect(pub).not.toHaveProperty("accessToken")
    expect(pub).not.toHaveProperty("refreshToken")
  })

  it("marks inactive integrations as disconnected", () => {
    const pub = toPublicIntegration({
      id: "i2",
      type: "linkedin",
      provider: "linkedin",
      isActive: false,
      config: null,
      updatedAt: new Date(),
    })
    expect(pub.status).toBe("disconnected")
  })
})
