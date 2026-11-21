/**
 * Safe settings DTOs — never include tokens, secrets, or clerk internals.
 */

export type PublicIntegration = {
  id: string
  type: string
  provider: string
  isActive: boolean
  /** Non-secret config JSON (e.g. defaultRepo). Never tokens. */
  config: string | null
  status: "connected" | "disconnected"
  updatedAt: string
}

export type PublicSettingsUser = {
  id: string
  email: string
  name: string | null
  tier: string
  brandVoice: string | null
  founderBio: string | null
  activeProductId: string | null
}

export function toPublicSettingsUser(user: {
  id: string
  email: string
  name: string | null
  tier: string
  brandVoice: string | null
  founderBio: string | null
  activeProductId: string | null
}): PublicSettingsUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
    brandVoice: user.brandVoice,
    founderBio: user.founderBio,
    activeProductId: user.activeProductId,
  }
}

export function toPublicIntegration(row: {
  id: string
  type: string
  provider: string
  isActive: boolean
  config: string | null
  updatedAt: Date
}): PublicIntegration {
  return {
    id: row.id,
    type: row.type,
    provider: row.provider,
    isActive: row.isActive,
    config: row.config,
    status: row.isActive ? "connected" : "disconnected",
    updatedAt: row.updatedAt.toISOString(),
  }
}
