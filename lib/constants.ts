/**
 * Shared platform list for content generation and UI.
 * Used by strategy, content generation, ContentPreview, and filters.
 */
export const SUPPORTED_PLATFORMS = [
  "linkedin",
  "twitter",
  "instagram",
  "facebook",
  "blog",
] as const

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number]

export const PLATFORM_LABELS: Record<SupportedPlatform, string> = {
  linkedin: "LinkedIn",
  twitter: "Twitter",
  instagram: "Instagram",
  facebook: "Facebook",
  blog: "Blog",
}

/** Platforms that have publishing wired (LinkedIn, Twitter); others are preview-only */
export const PUBLISHABLE_PLATFORMS = ["linkedin", "twitter"] as const
