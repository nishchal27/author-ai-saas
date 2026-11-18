/**
 * Product branding — single source for user-facing product name.
 */
export const PRODUCT_NAME = "Varabhi"
export const PRODUCT_TAGLINE = "Brand-aware AI marketing workspace"

/**
 * Shared platform list for content generation and UI.
 * Used by strategy, content generation, ContentPreview, and filters.
 */
export const SUPPORTED_PLATFORMS = [
  "linkedin",
  "twitter",
  "facebook",
  "blog",
] as const

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number]

export const PLATFORM_LABELS: Record<SupportedPlatform, string> = {
  linkedin: "LinkedIn",
  twitter: "Twitter",
  facebook: "Facebook",
  blog: "Blog",
}

/** Platforms that have publishing wired (LinkedIn, Twitter); others are preview-only */
export const PUBLISHABLE_PLATFORMS = ["linkedin", "twitter"] as const
